# Issue #101 plan: reconcile members removed from uploaded CSV

## Context

[GitHub issue #101](https://github.com/MiquelAdell/refugio-del-satiro/issues/101) requires the members CSV to become the synchronization source of truth: existing active members absent from a valid upload must be disabled, not deleted, while the administrator performing the import remains active. Today the use case filters email-less rows and only upserts rows present in the file (`backend/domain/use_cases/import_members.py:43-104`); it neither reconciles the pre-import membership set nor returns batch counts beyond the list of newly created members (`backend/domain/use_cases/import_members.py:130-138`). The repository already has the soft-disable primitive (`backend/data/repositories/sqlite_member_repository.py:177-183`), although that method is missing from the repository protocol (`backend/domain/repositories/member_repository.py:8-57`).

The API currently performs only encoding and `Email`-header checks, materializes the CSV, then mutates immediately (`backend/api/routes/admin.py:181-220`). Its response reports total/skipped rows and new-member token links, but not updated or disabled counts (`backend/api/routes/admin.py:89-99`). Use the established 50% reconciliation guard pattern from the catalogue sync (`backend/domain/use_cases/bgg_reconciliation.py:5-40`): zero valid member emails or a file missing more than 50% of active, non-acting members must skip bulk deactivation and return a warning. The upload can still apply valid creates/updates; malformed structure or field values must fail validation before any mutation.

The admin page uploads immediately and only distinguishes “new members” from “existing members updated” (`frontend/src/pages/AdminMembersPage.tsx:144-174`), while its result banner derives a partial summary from the created list (`frontend/src/pages/AdminMembersPage.tsx:273-296`). Extend that flow to show created, updated, skipped, and disabled counts plus the safety warning. The existing shared `Dialog` is unrelated to this design because the guard skips suspicious deactivation rather than offering an unsafe override.

## Workstreams

### A. Domain reconciliation, persistence contract, and CLI caller

- **Goal** — Implement prevalidated member batch reconciliation with soft-deactivation, acting-admin protection, a 50% deactivation guard, and a structured batch result, then adapt the CLI caller.
- **Complexity** — `medium`
- **Agent** — `backend-developer`
- **Files**
  - Read/modify: `backend/domain/use_cases/import_members.py`
  - Create: `backend/domain/use_cases/member_reconciliation.py`
  - Read/modify: `backend/domain/repositories/member_repository.py`
  - Read/modify: `backend/cli/main.py`
  - Read/modify: `tests/domain/use_cases/test_import_members.py`
  - Create: `tests/domain/use_cases/test_member_reconciliation.py`
  - Read/modify: `tests/cli/test_import_members.py`
- **Context bundle**
  - `ImportMembersUseCase.execute` currently returns `list[ImportResult]`, records pre-existing emails at `backend/domain/use_cases/import_members.py:59-65`, upserts at `backend/domain/use_cases/import_members.py:66-104`, protects only admin rights at `backend/domain/use_cases/import_members.py:124-128`, and generates tokens at `backend/domain/use_cases/import_members.py:130-138`.
  - Replace the list return with an immutable batch result carrying: created member/token records, `created_count`, `updated_count`, `skipped_count`, `disabled_count`, `total_rows`, and `deactivation_skip_reason: str | None`. Counts must describe input rows consistently; duplicate-email behavior is not being redesigned in this issue.
  - Normalize and validate the entire batch before the first repository write. In particular, blank emails are skipped; malformed member numbers must raise a domain validation error before any upsert or deactivation. Preserve the current column mapping and activation-on-create semantics at `backend/domain/use_cases/import_members.py:69-103`.
  - Snapshot `member_repo.list_all()` before upserts. Build uploaded-email membership from valid rows; only members that were active in that snapshot and are absent from the upload are candidates. Exclude `acting_member_id` from candidates and explicitly call `set_active(acting_member_id, True)` after a successful import as belt-and-braces protection.
  - Mirror `backend/domain/use_cases/bgg_reconciliation.py:5-40` in a member-specific pure helper: no valid uploaded emails yields no candidate IDs plus a warning; if `missing / existing_active_non_actor > 0.5`, yield no candidate IDs plus a warning; otherwise yield the missing member IDs. The threshold is strictly `> 50%`, matching the existing catalogue guard.
  - Add `set_active(member_id, is_active)` to `MemberRepository`; SQLite already implements it at `backend/data/repositories/sqlite_member_repository.py:177-183`, so no migration or repository implementation change is needed.
  - Adapt the only production non-API caller at `backend/cli/main.py:313-324` to iterate `batch_result.created` and print the structured summary. Preserve its current token-link output. Update `tests/cli/test_import_members.py:20-62` accordingly.
  - Extend the fake repository at `tests/domain/use_cases/test_import_members.py:11-180` with `set_active`, then add concrete assertions for: a missing member disabled; present existing member updated and counted; acting admin absent but active; empty upload produces a warning and zero deactivations; more than 50% missing is guarded; exactly 50% missing proceeds; malformed numeric data causes zero mutations; disabled records remain retrievable.
- **Non-goals**
  - Do not delete member rows, loans, password hashes, or password-token history.
  - Do not change administrator promotion/demotion rules or reactivate an existing inactive member merely because it reappears in the CSV.
  - Do not generalize or refactor the BGG reconciliation helper.
  - Do not add database migrations or bulk SQL optimization; the association-sized import may call `set_active` per candidate.
  - Do not redesign duplicate-email or case-sensitivity behavior.
- **Acceptance**
  - Run `uv run pytest tests/domain/use_cases/test_member_reconciliation.py tests/domain/use_cases/test_import_members.py tests/cli/test_import_members.py`; all tests pass.
  - Run `uv run mypy backend/domain/use_cases/import_members.py backend/domain/use_cases/member_reconciliation.py backend/domain/repositories/member_repository.py backend/cli/main.py`; exit code is 0.
  - `rg -n "def set_active" backend/domain/repositories/member_repository.py backend/data/repositories/sqlite_member_repository.py tests/domain/use_cases/test_import_members.py` returns all three protocol/implementation/fake definitions.
- **Estimated tokens** — `~20k`

### B. Strict upload validation and expanded API contract

- **Goal** — Expose reconciliation counts and safety warnings through the admin import endpoint, rejecting malformed CSV before invoking the mutating use case.
- **Complexity** — `medium`
- **Agent** — `backend-developer`
- **Files**
  - Read/modify: `backend/api/routes/admin.py`
  - Read/modify: `tests/api/test_members.py`
  - Read-only: `backend/domain/use_cases/import_members.py` (A's completed version)
- **Context bundle**
  - **Input: A's commit/diff and its structured batch result/domain validation exception.** Do not independently invent a second result model or reconciliation threshold.
  - The endpoint decodes UTF-8 at `backend/api/routes/admin.py:188-195`, builds `csv.DictReader` and checks only the `Email` header at `backend/api/routes/admin.py:197-205`, then calls the use case at `backend/api/routes/admin.py:207-208`.
  - Parse strictly and reject with HTTP 400 before `execute` when the CSV has parser errors, extra cells (`None` key), missing cells (`None` values), or a missing `Email` header. Translate A's prevalidation error (for example, invalid `Nº Socio`) to HTTP 400 with a human-readable Spanish detail. The route must never catch unrelated programming/database errors as bad input.
  - Expand `ImportMembersResponse` at `backend/api/routes/admin.py:95-99` with `created_count`, `updated_count`, `disabled_count`, and nullable `deactivation_skip_reason`, while retaining `created`, `total_rows`, and `skipped_rows` for token-link and compatibility needs. Map every field directly from A's batch result; assert `created_count == len(created)` in tests.
  - Existing API import coverage lives at `tests/api/test_members.py:451-583`. Update exact response assertions (notably `tests/api/test_members.py:508-525`) and add end-to-end repository-state tests for normal removal, absent acting admin protection, empty/header-only CSV guard, >50% safety guard and warning, malformed row shape, and invalid member number. Each failure/guard test must assert pre-existing members remain active; malformed-data tests must also prove no earlier row was partially upserted.
- **Non-goals**
  - Do not add a preview endpoint, confirmation flag, or client-controlled bypass for the 50% guard.
  - Do not move CSV parsing into the frontend or CLI.
  - Do not change authentication, authorization, manual enable/disable endpoints, or response schemas outside member import.
  - Do not alter the safety threshold chosen in A.
- **Acceptance**
  - Run `uv run pytest tests/api/test_members.py`; all tests pass.
  - Run `uv run pytest tests/domain/use_cases/test_import_members.py tests/api/test_members.py`; all tests pass together.
  - Run `uv run ruff check backend/api/routes/admin.py tests/api/test_members.py`; exit code is 0.
  - A header-only upload and an upload missing more than 50% of active non-acting members both return `disabled_count: 0`, a non-null `deactivation_skip_reason`, and leave all candidate members active; a malformed upload returns 400 and leaves both membership state and prior-row data unchanged.
- **Estimated tokens** — `~20k`

### C. Admin import reporting and UI tests

- **Goal** — Show the complete reconciliation outcome and safety warning after CSV upload, with component tests covering successful disabling and guarded deactivation responses.
- **Complexity** — `medium`
- **Agent** — `frontend-developer`
- **Files**
  - Read/modify: `frontend/src/types/admin.ts`
  - Read/modify: `frontend/src/pages/AdminMembersPage.tsx`
  - Read/modify only if needed for existing banner styling: `frontend/src/pages/AdminMembersPage.css`
  - Create: `frontend/src/pages/AdminMembersPage.test.tsx`
  - Read-only: `frontend/src/api/client.ts`
  - Read-only: `frontend/src/context/AuthContext.tsx`
- **Context bundle**
  - **Input: B's final `ImportMembersResponse` JSON shape.** Match it exactly in TypeScript; do not maintain a parallel client-only result model.
  - Add the four new response fields to `ImportMembersResponse` at `frontend/src/types/admin.ts:59-63`: `created_count`, `updated_count`, `disabled_count`, and `deactivation_skip_reason: string | null`.
  - `handleImportFile` resets state and uploads at `frontend/src/pages/AdminMembersPage.tsx:144-174`. Always retain the successful response in `importResult`, including when no member was created; remove the current special branch that collapses zero-created imports into a generic success string (`frontend/src/pages/AdminMembersPage.tsx:161-167`). Continue refreshing the member list only after a successful response.
  - Replace the partial banner sentence at `frontend/src/pages/AdminMembersPage.tsx:273-296` with a concrete summary covering created, updated, skipped, and disabled counts. Render `deactivation_skip_reason` prominently as a warning when non-null, while still showing token links for `created` members. Do not claim absent members were disabled when the guard skipped them.
  - Extend the help text at `frontend/src/pages/AdminMembersPage.tsx:386-425` to explain that absent members are disabled, the importing admin is protected, and empty/suspiciously small uploads skip mass deactivation.
  - Create a focused page test using the established Vitest/Testing Library mock pattern (`frontend/src/pages/GameDetailPage.test.tsx:11-27`, `frontend/src/pages/GameDetailPage.test.tsx:89-103`). Mock `useAuth`, `apiFetch`, and `apiUpload`; make the initial `/admin/members` fetch resolve; use `userEvent.upload` on the hidden file input identified by its accessible label at `frontend/src/pages/AdminMembersPage.tsx:218-225`.
  - Test at minimum: response counts are all rendered; a non-null safety warning is rendered with `disabled_count` zero; no generic “existing updated” message hides the warning when `created_count` is zero; created-member token links remain visible; and the member list is fetched again after a successful import.
- **Non-goals**
  - Do not add a confirmation dialog or allow the browser to bypass backend reconciliation safeguards.
  - Do not parse or validate CSV contents client-side.
  - Do not restyle the members page beyond minimal reuse/addition of semantic warning styling.
  - Do not change manual create/edit/enable/disable behavior.
- **Acceptance**
  - Run `npm test -- --run src/pages/AdminMembersPage.test.tsx` from `frontend/`; all tests pass.
  - Run `npm run typecheck` from `frontend/`; exit code is 0.
  - Run `npm run lint -- src/pages/AdminMembersPage.tsx src/pages/AdminMembersPage.test.tsx src/types/admin.ts` from `frontend/`; exit code is 0.
  - The guarded-response test finds the server-provided warning text and exact summary counts, and verifies `apiUpload` was called once with `/admin/members/import` and a `FormData` containing the selected file.
- **Estimated tokens** — `~20k`

## Sequencing

1. **A — `parallel-safe` only as the first workstream.** It owns the domain contract consumed by both remaining workstreams.
2. **B — `depends-on: A`.** The API schema and tests must map A's exact result and validation behavior.
3. **C — `depends-on: B`.** The frontend type and UI must consume B's final response shape. It may begin test-fixture scaffolding earlier, but its implementation and acceptance run use B's contract.

The workstreams deliberately avoid overlapping writable files. Execute them in A → B → C order; do not parallelize contract-defining edits.

## Verification

- Run the focused backend suite: `uv run pytest tests/domain/use_cases/test_member_reconciliation.py tests/domain/use_cases/test_import_members.py tests/cli/test_import_members.py tests/api/test_members.py`.
- Run backend static checks: `uv run ruff check backend tests/domain/use_cases/test_member_reconciliation.py tests/domain/use_cases/test_import_members.py tests/cli/test_import_members.py tests/api/test_members.py` and `uv run mypy backend`.
- From `frontend/`, run `npm test -- --run src/pages/AdminMembersPage.test.tsx`, `npm run typecheck`, and `npm run lint`.
- Manually inspect the merged tests for these global invariants: removing one member from an otherwise valid CSV disables that record; records and loan history are not deleted; creates and edits still apply; zero-valid-email, malformed, and >50%-missing uploads cannot bulk-disable members; the acting admin remains active while absent; and API/UI output explicitly reports created, updated, skipped, and disabled totals plus any safety warning.
- Run `git diff --check`; it returns no whitespace errors. Confirm `git diff --name-only` contains only files named by the three workstreams.
