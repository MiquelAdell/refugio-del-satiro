# Issue #102 — Combined admin BGG/RPGGeek synchronization

## Context

The admin import endpoint currently constructs and executes only `ImportGamesUseCase`, then flattens the board-game counters into one response (`backend/api/routes/bgg.py:35-42`, `backend/api/routes/bgg.py:50-67`). RPG synchronization already exists as a separate, type-scoped use case: it reads only `rpgitem` rows, calls `fetch_owned_rpg_items()`, and applies the same loan-aware delete/deactivate safeguards without touching board games (`backend/domain/use_cases/import_rpg_items.py:10-20`, `backend/domain/use_cases/import_rpg_items.py:34-60`, `backend/domain/use_cases/import_rpg_items.py:69-93`). The CLI independently instantiates that use case (`backend/cli/main.py:188-223`), so the admin implementation must reuse it without changing either existing CLI command.

The web page currently models one flat board-game result and renders one aggregate sentence (`frontend/src/pages/AdminBggPage.tsx:7-19`, `frontend/src/pages/AdminBggPage.tsx:52-67`, `frontend/src/pages/AdminBggPage.tsx:85-118`). Issue #102 requires one admin action to run both imports, preserve a successful catalog result if the other catalog fails, and show created, updated, deleted, hidden/deactivated, total, skipped-removal warnings, and failures separately for board games and RPG items.

Use this response contract in both workstreams so they can execute in parallel:

```json
{
  "boardgames": {
    "result": {
      "created": 2,
      "updated": 0,
      "total": 2,
      "deleted": 0,
      "deactivated": 0,
      "skip_reason": null
    },
    "error": null
  },
  "rpg_items": {
    "result": null,
    "error": "No se han podido sincronizar los juegos de rol."
  },
  "last_imported_at": "2026-07-15T10:00:00Z"
}
```

Each catalog outcome is always present. Exactly one of `result` or `error` is non-null. The endpoint returns HTTP 200 after attempting both catalogs, including when one or both catalog operations fail, because the structured body is how the admin page exposes partial outcomes. Authentication/authorization failures retain their existing status codes. Return a stable, admin-facing Spanish error message rather than the raw exception text.

## Workstreams

### 1. Combine and isolate the two imports in the admin API

- **Goal** — Make `POST /api/admin/bgg/import` attempt the existing board-game and RPG-item use cases independently and return the agreed per-catalog outcome contract.
- **Complexity** — `medium`
- **Agent** — `backend-developer`
- **Files**
  - Read and modify `backend/api/routes/bgg.py`.
  - Read and modify `tests/api/test_bgg.py`.
  - Read only `backend/domain/use_cases/import_games.py`.
  - Read only `backend/domain/use_cases/import_rpg_items.py`.
  - Read only `backend/cli/main.py`.
- **Context bundle**
  - Current route schema and implementation (`backend/api/routes/bgg.py:35-42`, `backend/api/routes/bgg.py:50-67`):

    ```python
    class BggImportResponse(BaseModel):
        created: int
        updated: int
        total: int
        deleted: int
        deactivated: int
        skip_reason: str | None
        last_imported_at: datetime | None

    use_case = ImportGamesUseCase(game_repo, bgg_client, loan_repo)
    result = use_case.execute()
    ```

  - Import `ImportRpgItemsUseCase` beside `ImportGamesUseCase`; instantiate both with the same `game_repo`, `bgg_client`, and `loan_repo`. Execute each inside its own failure boundary so the second attempt occurs even if the first raises.
  - Represent successful stats with one shared Pydantic model (`created`, `updated`, `total`, `deleted`, `deactivated`, `skip_reason`) nested in a catalog outcome containing `result` and `error`; nest two outcomes as `boardgames` and `rpg_items` in `BggImportResponse`, followed by `last_imported_at`.
  - Keep the exact stable failure messages `No se han podido sincronizar los juegos de mesa.` and `No se han podido sincronizar los juegos de rol.`; do not serialize exception text.
  - Existing separation is a safety boundary, not duplication to remove: board games use `ITEM_TYPE = "boardgame"` and `fetch_owned_games()` (`backend/domain/use_cases/import_games.py:10-20`, `backend/domain/use_cases/import_games.py:34-39`), while RPG items use `ITEM_TYPE = "rpgitem"` and `fetch_owned_rpg_items()` (`backend/domain/use_cases/import_rpg_items.py:10-20`, `backend/domain/use_cases/import_rpg_items.py:34-39`).
  - Existing API coverage patches only the board-game fetch and asserts flat counters (`tests/api/test_bgg.py:99-123`). Replace/extend it to patch both client fetch methods. Add a combined-success case that asserts the complete nested JSON and verifies persisted rows have `boardgame` and `rpgitem` types. Add a partial-failure case (for example, RPG fetch raises while board-game fetch succeeds) that asserts HTTP 200, the successful board-game stats remain available, the RPG `result` is null with the stable error, and the board-game row was persisted. Also keep the admin authorization test.
  - `BggRpgItem` provides the RPG fixture fields (`backend/data/bgg_client.py:31-39`). Use a concrete object rather than a loose mock.
- **Non-goals**
  - Do not merge or refactor `ImportGamesUseCase` and `ImportRpgItemsUseCase`.
  - Do not alter reconciliation thresholds, deletion/deactivation behavior, repositories, migrations, or BGG client fetch logic.
  - Do not modify `import-games` or `import-rol` CLI behavior or output.
  - Do not introduce background jobs, concurrency, or a new endpoint.
- **Acceptance**
  - `pytest -q tests/api/test_bgg.py` passes.
  - `pytest -q tests/domain/use_cases/test_import_games.py tests/domain/use_cases/test_import_rpg_items.py` passes unchanged.
  - `ruff check backend/api/routes/bgg.py tests/api/test_bgg.py` passes.
  - `mypy backend/api/routes/bgg.py` passes.
  - Combined-success response contains exactly the top-level keys `boardgames`, `rpg_items`, and `last_imported_at`; each successful outcome contains `result` with all six stats fields and `error: null`.
  - Partial-failure coverage proves both attempts are made and one failure does not erase the other catalog's successful result.
- **Estimated tokens** — `~12k`

### 2. Render separate board-game and RPG outcomes in the admin page

- **Goal** — Update the BGG admin UI to consume the agreed nested response and visibly distinguish each catalog's counts, skip warning, and failure.
- **Complexity** — `medium`
- **Agent** — `frontend-developer`
- **Files**
  - Read and modify `frontend/src/pages/AdminBggPage.tsx`.
  - Read and modify `frontend/src/pages/AdminBggPage.css`.
  - Create `frontend/src/pages/AdminBggPage.test.tsx`.
  - Read only `frontend/src/api/client.ts`.
  - Read only `frontend/src/context/AuthContext.tsx`.
  - Read only `frontend/tests/setup.ts`.
- **Context bundle**
  - Implement the exact nested response contract from the plan Context. Keep the response types local to `AdminBggPage.tsx`, matching the existing placement at `frontend/src/pages/AdminBggPage.tsx:7-19`.
  - `apiFetch` throws only for non-2xx responses (`frontend/src/api/client.ts:3-21`), so an HTTP 200 partial outcome reaches `setResult`; the page-level `catch` remains for transport or unstructured endpoint failures.
  - Replace the board-game-only explanation at `frontend/src/pages/AdminBggPage.tsx:88-93` with copy saying the action synchronizes both BoardGameGeek board games and RPGGeek role-playing items.
  - Replace the single result paragraph at `frontend/src/pages/AdminBggPage.tsx:108-118` with two labelled result blocks (`Juegos de mesa` and `Juegos de rol`). For a successful outcome, render created, updated, deleted, hidden/deactivated, and total counts and show `skip_reason` as that catalog's warning when non-null. For a failed outcome, render that catalog's `error` while still rendering the other catalog's success.
  - Reuse the existing success/error visual language (`frontend/src/pages/AdminBggPage.css:42-58`) but add layout/selectors for two clearly separated, responsive outcome blocks. Preserve accessible text labels; do not communicate status by color alone.
  - In the new Vitest file, mock `useAuth` to return an authenticated admin and mock `apiFetch`. Account for the status request performed by the effect (`frontend/src/pages/AdminBggPage.tsx:38-50`) before the import request. Use Testing Library and `userEvent`, consistent with `frontend/src/pages/ValidacionPage.test.tsx:1-15` and `frontend/src/pages/ValidacionPage.test.tsx:109-125`.
  - Add one test for combined success that clicks `Reimportar desde BGG` and asserts both headings plus their distinct concrete counters. Add one partial-failure test that returns a board-game result and RPG error, then asserts both the success and failure remain visible. Include a skip-warning assertion in either test so skipped-removal results are covered.
- **Non-goals**
  - Do not change `apiFetch`, auth behavior, routing, navigation, or unrelated admin pages.
  - Do not add polling, progress reporting, retries, or parallel browser requests.
  - Do not redesign the full admin page or introduce a new shared component/type solely for this page.
  - Do not collapse the two catalog outcomes into aggregate totals.
- **Acceptance**
  - `npm test -- --run src/pages/AdminBggPage.test.tsx` passes from `frontend/`.
  - `npm run typecheck` passes from `frontend/`.
  - `npm run lint -- src/pages/AdminBggPage.tsx src/pages/AdminBggPage.test.tsx` passes from `frontend/`.
  - The combined-success test concretely asserts separate board-game and RPG created/updated/deleted/hidden/total values.
  - The partial-failure test concretely asserts the successful catalog result, failed catalog message, and catalog-specific skip warning can coexist without the page-level error replacing them.
- **Estimated tokens** — `~12k`

## Sequencing

1. **Workstream 1 — `parallel-safe`**. It owns only backend/API files and implements the fixed contract above.
2. **Workstream 2 — `parallel-safe`**. It owns only frontend files and can use the fixed contract above without waiting for backend code.
3. After both workstreams return, merge their changes and run the global verification. If either worker changes the response shape, reject that divergence rather than adapting the other workstream ad hoc.

## Verification

- Run `pytest -q tests/api/test_bgg.py tests/domain/use_cases/test_import_games.py tests/domain/use_cases/test_import_rpg_items.py`; all tests pass and existing type-specific reconciliation tests remain unchanged.
- Run `ruff check backend/api/routes/bgg.py tests/api/test_bgg.py` and `mypy backend/api/routes/bgg.py`; both pass.
- From `frontend/`, run `npm test -- --run src/pages/AdminBggPage.test.tsx`, `npm run typecheck`, and `npm run lint -- src/pages/AdminBggPage.tsx src/pages/AdminBggPage.test.tsx`; all pass.
- Inspect the combined-success API assertion: both an owned `BggGame` and owned `BggRpgItem` are persisted with their original item types, and both nested outcomes report independent counters.
- Inspect the partial-failure API and UI assertions: both imports are attempted, HTTP 200 preserves the successful result, the failed catalog has `result: null` plus its stable error, and the page shows both outcomes simultaneously.
- Confirm `git diff -- backend/domain/use_cases/import_games.py backend/domain/use_cases/import_rpg_items.py backend/cli/main.py` is empty, proving the established reconciliation safeguards and CLI commands were not changed.
