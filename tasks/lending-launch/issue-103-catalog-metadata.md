# Issue #103 — Normalize BGG and RPGGeek catalog metadata

## Context

GitHub issue [#103](https://github.com/MiquelAdell/refugio-del-satiro/issues/103) requires both catalog item types to retain synchronized descriptions, categories, ratings, and type-specific metadata without erasing previously fetched detail data when a BGG detail request fails. The shared `Game` entity currently stops at `description` and has no category or RPG publication classification fields (`backend/domain/entities/game.py:7-25`), while the SQLite mapper and upsert persist only that existing shape (`backend/data/repositories/sqlite_game_repository.py:11-31`, `backend/data/repositories/sqlite_game_repository.py:118-176`).

The normal board-game import currently writes collection-summary data and explicitly resets `image_url` without calling the existing detail endpoint (`backend/domain/use_cases/import_games.py:34-51`), even though `BggClient.fetch_details` already fetches images, player counts, playing time, and rating (`backend/data/bgg_client.py:178-246`). RPG detail fetching already obtains descriptions but substitutes empty defaults when detail data is absent (`backend/data/bgg_client.py:274-308`), so both paths need an explicit “details loaded” boundary before upserting.

The API also drops the board game's existing description (`backend/api/routes/games.py:23-62`), whereas the RPG response carries description through a dedicated status DTO (`backend/domain/use_cases/rpg_item_with_status.py:10-62`, `backend/api/routes/rpg_items.py:25-54`). The detail UIs render board-game mechanics but no prose metadata (`frontend/src/pages/GameDetailPage.tsx:107-169`), while the RPG page already has a description section that can host the new classifications (`frontend/src/pages/RpgDetailPage.tsx:87-90`, `frontend/src/pages/RpgDetailPage.tsx:164-170`).

### Data-shape decisions

- Represent normalized multi-valued metadata as immutable tuples in Python and JSON arrays at the API boundary: `categories: tuple[str, ...]` on both item types and `publication_types: tuple[str, ...]` for RPG items. RPGGeek classifications are many-to-many, so an array avoids an arbitrary/lossy “first type” rule despite the issue's singular shorthand.
- Store both collections as deterministic JSON arrays in SQLite (`categories_json` and `publication_types_json`, each `TEXT NOT NULL DEFAULT '[]'`). Normalize by trimming values, dropping blanks, de-duplicating, and sorting case-insensitively before persistence/API projection.
- Parse BGG `<link type="boardgamecategory">` values as board-game categories. For RPG items, parse `<link type="rpggenre">` as topical categories and `<link type="rpgcategory">` as publication types; RPGGeek defines the latter with values such as “Core Rules” and “Scenario / Adventure / Module”.
- Do not add publisher in this issue. The source can contain multiple publisher links, the requested field is singular/optional, and publisher is absent from the acceptance criteria; therefore it does not map cleanly without inventing another multi-value contract. Record this decision in code/test naming rather than silently choosing the first publisher.
- Treat absence of a detail record/batch as failure and preserve all previously stored detail-only values. When a detail record is successfully returned, its normalized values are authoritative, including legitimate empty collections.

## Workstreams

### A. Add the normalized metadata contract and SQLite persistence

- **Goal** — Extend the shared catalog entity and repository contract with normalized category/publication-type collections and persist them through a new migration without changing existing rows' meaning.
- **Complexity** — medium
- **Agent** — `backend-developer`
- **Files**
  - Modify `backend/domain/entities/game.py`
  - Modify `backend/domain/repositories/game_repository.py`
  - Modify `backend/data/repositories/sqlite_game_repository.py`
  - Add `backend/migrations/010_add_catalog_metadata.sql`
  - Modify `tests/domain/use_cases/conftest.py`
  - Modify `tests/domain/entities/test_game.py`
  - Modify `tests/data/repositories/test_sqlite_game_repository.py`
  - Modify `tests/migrations/test_runner.py`
- **Context bundle**
  - Current entity tail: `item_type`, `description`, and `is_active` are the only catalog extensions (`backend/domain/entities/game.py:23-25`). Add immutable defaults `categories=()` and `publication_types=()`; publication types stay empty for board games.
  - The protocol's upsert ends at `description: str = ""` (`backend/domain/repositories/game_repository.py:34-48`). Extend it with tuple-typed keyword parameters matching the entity.
  - `_row_to_game` provides backward-compatible defaults for migrated fields (`backend/data/repositories/sqlite_game_repository.py:11-31`). Decode `categories_json` and `publication_types_json` into tuples there; centralize deterministic normalization/serialization rather than duplicating it in callers.
  - The SQL upsert enumerates every column and overwrites every metadata value on conflict (`backend/data/repositories/sqlite_game_repository.py:135-176`). Add both JSON columns/parameters to the insert and conflict update while retaining the existing reactivation behavior.
  - Existing migration tests hard-code eight migrations and the exact games column set (`tests/migrations/test_runner.py:48-53`, `tests/migrations/test_runner.py:63-87`). Update the count to nine, assert `009_add_catalog_metadata`, assert both columns/defaults, and prove pre-existing rows read back as empty tuples.
  - The shared import fake reconstructs `Game` explicitly (`tests/domain/use_cases/conftest.py:77-124`, `tests/domain/use_cases/conftest.py:127-146`). Extend both construction paths here so downstream importer tests receive the new contract without reimplementing it.
- **Non-goals**
  - Do not fetch or parse BGG/RPGGeek XML.
  - Do not expose the fields through FastAPI or TypeScript.
  - Do not introduce category lookup/junction tables, filtering, admin editing, or publisher fields.
  - Do not change loan/reconciliation behavior.
- **Acceptance**
  - `uv run pytest tests/domain/entities/test_game.py tests/data/repositories/test_sqlite_game_repository.py tests/migrations/test_runner.py -q` passes.
  - A repository test upserts duplicate/blank/unsorted category values and reads an exact normalized tuple; an RPG test does the same for publication types.
  - `uv run pytest tests/domain/use_cases/test_import_games.py tests/domain/use_cases/test_import_rpg_items.py -q` still passes against the extended fake before importer behavior changes.
  - `uv run mypy backend tests/domain/use_cases/conftest.py` reports no errors.
- **Estimated tokens** — `~20k`

### B. Parse source classifications and make both imports failure-safe

- **Goal** — Fetch complete metadata in the normal board-game and RPG imports, parse the source classification links, and merge failed detail requests without clearing stored details.
- **Complexity** — medium
- **Agent** — `backend-developer`
- **Files**
  - Modify `backend/data/bgg_client.py`
  - Modify `backend/domain/use_cases/import_games.py`
  - Modify `backend/domain/use_cases/import_rpg_items.py`
  - Modify `backend/cli/main.py`
  - Modify `tests/data/test_bgg_client.py`
  - Modify `tests/data/test_bgg_rpg_client.py`
  - Modify `tests/domain/use_cases/test_import_games.py`
  - Modify `tests/domain/use_cases/test_import_rpg_items.py`
- **Context bundle**
  - Input: A's commit SHA and its exact `GameRepository.upsert_by_bgg_id` signature.
  - `BggGameDetails` currently carries only image, players, time, and rating (`backend/data/bgg_client.py:20-29`); add `description` and normalized board-game categories. Parse description with HTML entity unescaping and parse every `boardgamecategory` link value.
  - `_RpgDetails` and `BggRpgItem` currently stop at description (`backend/data/bgg_client.py:31-50`). Add RPG genres/categories and publication types, plus an explicit `details_loaded` signal on the collection-facing item so an unavailable detail batch is distinguishable from a successful response containing empty fields.
  - Board detail requests already skip failed HTTP batches and return only successful IDs (`backend/data/bgg_client.py:188-201`). Keep that partial-success behavior and use mapping membership as the success signal.
  - RPG detail requests currently raise and abort on an HTTP failure (`backend/data/bgg_client.py:341-360`). Align them with board-game partial success: skip the failed batch, return successful IDs, and let `fetch_owned_rpg_items` mark each item appropriately.
  - The normal board import currently never calls `fetch_details` and upserts `image_url=""` (`backend/domain/use_cases/import_games.py:38-51`). Fetch details once for all fetched IDs. For a successful detail result, update image/player/time/rating/description/categories; for a missing result, preserve those fields from `existing` (or use entity defaults for a new item) while still updating collection-level name, thumbnail, and year.
  - RPG import currently passes every source value straight into the upsert (`backend/domain/use_cases/import_rpg_items.py:38-54`). Merge existing detail-only values when `details_loaded` is false; update them authoritatively when true.
  - The legacy `enrich_games` command rewrites a whole row (`backend/cli/main.py:145-180`). Either delegate to the same merge helper as normal import or pass through description/categories/publication types explicitly so it cannot erase the new fields.
  - Extend board XML fixtures with `<description>` and repeated/unsorted `<link type="boardgamecategory" value="...">` nodes. Extend RPG fixtures at `tests/data/test_bgg_rpg_client.py:28-58` with repeated `rpggenre`, `rpgcategory`, and publisher links; assert the first two normalize correctly and publisher is deliberately ignored.
  - Import fakes currently expose only the collection methods (`tests/domain/use_cases/test_import_games.py:11-17`, `tests/domain/use_cases/test_import_rpg_items.py:11-17`). Give the board fake controllable detail results and add exact tests for (1) new complete import, (2) changed metadata update, and (3) a partial detail failure preserving old description/images/categories/types for each item type.
- **Non-goals**
  - Do not change SQLite schema/serialization beyond consuming A's contract.
  - Do not add API/UI fields, category filters, publisher support, or live-network tests.
  - Do not alter missing-item deletion/soft-deletion thresholds.
  - Do not replace BGG XML API2 or change request authentication/rate-limit policy beyond partial batch handling.
- **Acceptance**
  - `uv run pytest tests/data/test_bgg_client.py tests/data/test_bgg_rpg_client.py tests/domain/use_cases/test_import_games.py tests/domain/use_cases/test_import_rpg_items.py -q` passes.
  - Board parsing asserts exact description and normalized categories; RPG parsing asserts exact normalized genres/categories and publication types and confirms publisher links are ignored.
  - Import tests prove changed successful details overwrite old values and missing/failed detail responses preserve every old detail-only field for board games and RPG items.
  - `rg -n 'image_url=""' backend/domain/use_cases/import_games.py` returns no match.
  - `uv run ruff check backend/data/bgg_client.py backend/domain/use_cases/import_games.py backend/domain/use_cases/import_rpg_items.py backend/cli/main.py tests/data/test_bgg_client.py tests/data/test_bgg_rpg_client.py tests/domain/use_cases/test_import_games.py tests/domain/use_cases/test_import_rpg_items.py` passes.
- **Estimated tokens** — `~20k`

### C. Carry normalized metadata through status DTOs and FastAPI

- **Goal** — Expose descriptions, categories, and RPG publication types consistently in list/detail API responses for both catalog item types.
- **Complexity** — small
- **Agent** — `backend-developer`
- **Files**
  - Modify `backend/domain/use_cases/list_games.py`
  - Modify `backend/domain/use_cases/rpg_item_with_status.py`
  - Modify `backend/api/routes/games.py`
  - Modify `backend/api/routes/rpg_items.py`
  - Modify `tests/domain/use_cases/test_list_games.py`
  - Modify `tests/domain/use_cases/test_list_rpg_items.py`
  - Modify `tests/domain/use_cases/test_get_game.py`
  - Modify `tests/domain/use_cases/test_get_rpg_item.py`
  - Modify `tests/api/test_games.py`
  - Modify `tests/api/test_rpg_items.py`
- **Context bundle**
  - Input: A's commit SHA and canonical tuple field names.
  - `GameWithStatus` omits even the entity's existing description (`backend/domain/use_cases/list_games.py:12-30`), and both available/lent builders enumerate fields manually (`backend/domain/use_cases/list_games.py:38-79`). Add `description` and `categories` to the DTO and both construction branches.
  - `RpgItemWithStatus` already carries description but not classifications (`backend/domain/use_cases/rpg_item_with_status.py:10-23`); add categories and publication types to both available/lent construction branches (`backend/domain/use_cases/rpg_item_with_status.py:31-62`).
  - `GameResponse` and `_to_response` currently omit description (`backend/api/routes/games.py:23-62`). Add `description: str` and `categories: list[str]`; emit arrays in stable normalized order.
  - `RpgItemResponse` currently exposes description (`backend/api/routes/rpg_items.py:25-54`). Add `categories: list[str]` and `publication_types: list[str]` and project both exactly.
  - API fixtures already assert exact board detail basics (`tests/api/test_games.py:181-202`) and exact RPG fields (`tests/api/test_rpg_items.py:74-107`). Extend list and detail coverage for both item types, including exact arrays and unchanged anonymous borrower privacy.
- **Non-goals**
  - Do not change routes, authentication/privacy behavior, importer logic, or storage.
  - Do not add filtering/query parameters or publisher fields.
  - Do not render frontend UI.
- **Acceptance**
  - `uv run pytest tests/domain/use_cases/test_list_games.py tests/domain/use_cases/test_list_rpg_items.py tests/domain/use_cases/test_get_game.py tests/domain/use_cases/test_get_rpg_item.py tests/api/test_games.py tests/api/test_rpg_items.py -q` passes.
  - Exact API assertions demonstrate board responses contain `description` and `categories`, and RPG responses contain `description`, `categories`, and `publication_types`, for both list and detail endpoints.
  - Existing anonymous/authenticated borrower-identity tests remain green.
  - `uv run mypy backend` reports no errors.
- **Estimated tokens** — `<10k`

### D. Render metadata on both detail pages

- **Goal** — Add the new API fields to frontend types and render useful, accessible metadata on board-game and RPG detail pages without cluttering catalog cards.
- **Complexity** — small
- **Agent** — `frontend-developer`
- **Files**
  - Modify `frontend/src/types/game.ts`
  - Modify `frontend/src/types/rpg.ts`
  - Modify `frontend/src/pages/GameDetailPage.tsx`
  - Modify `frontend/src/pages/GameDetailPage.css`
  - Modify `frontend/src/pages/GameDetailPage.test.tsx`
  - Modify `frontend/src/pages/RpgDetailPage.tsx`
  - Modify `frontend/src/pages/RpgDetailPage.css`
  - Modify `frontend/src/pages/RpgDetailPage.test.tsx`
- **Context bundle**
  - Input: C's API contract/commit SHA. TypeScript fields are readonly arrays: board `description` plus `categories`; RPG `categories` plus `publication_types` in addition to its existing description.
  - `Game` currently ends its metadata at `location` (`frontend/src/types/game.ts:1-14`); `RpgItem` ends catalog metadata at `description` (`frontend/src/types/rpg.ts:6-19`). Keep the immutable style with `readonly` properties and `readonly string[]` values.
  - The board detail hero currently renders year, players, and time then goes directly to status/actions (`frontend/src/pages/GameDetailPage.tsx:107-169`). Render non-empty categories/publication labels as compact textual metadata and add a description section after the hero, matching the RPG page's paragraph splitting behavior (`frontend/src/pages/RpgDetailPage.tsx:87-90`, `frontend/src/pages/RpgDetailPage.tsx:164-170`).
  - The RPG page already renders rating and description (`frontend/src/pages/RpgDetailPage.tsx:107-170`). Add genres/categories and publication types near the year/rating, with clear Spanish labels (for example `Categorías` and `Tipo de publicación`) and omit empty groups.
  - Reuse existing design tokens and section treatment from `frontend/src/pages/RpgDetailPage.css:131-151`; do not introduce a new component system or modify catalog cards.
  - Existing typed fixtures are centralized at `frontend/src/pages/GameDetailPage.test.tsx:34-50` and `frontend/src/pages/RpgDetailPage.test.tsx:33-46`. Extend them and add content tests that assert exact descriptions/labels/values plus omission when arrays/description are empty.
- **Non-goals**
  - Do not change catalog cards, search/filter behavior, borrowing actions, history, or API hooks.
  - Do not add publisher rendering.
  - Do not render empty headings/placeholders for unavailable metadata.
- **Acceptance**
  - `cd frontend && npm test -- --run src/pages/GameDetailPage.test.tsx src/pages/RpgDetailPage.test.tsx` passes.
  - `cd frontend && npm run typecheck` passes.
  - `cd frontend && npm run lint -- src/types/game.ts src/types/rpg.ts src/pages/GameDetailPage.tsx src/pages/RpgDetailPage.tsx` passes.
  - Tests assert board description/categories and RPG categories/publication types render exactly, and empty metadata does not leave empty labeled sections.
- **Estimated tokens** — `<10k`

## Sequencing

1. **A — parallel-safe** (foundation; run first by itself because all later work consumes its contract).
2. After A completes, run **B — depends-on: A** and **C — depends-on: A** in parallel; they touch disjoint production/test files.
3. Run **D — depends-on: C** after the API field names and response shapes are final. D can start from the contract documented here, but verification must use C's merged API shape.
4. Merge in A → B/C → D order. If workers use separate branches/worktrees, give B and C A's commit SHA and give D C's commit SHA as specified in their context bundles.

## Verification

- Apply migrations to a database at schema version 8 and verify existing catalog rows remain readable with empty category/publication arrays; rerunning migrations applies nothing.
- Run the full backend suite: `uv run pytest -q`.
- Run backend static checks: `uv run ruff check backend tests scripts` and `uv run mypy backend`.
- Run the full frontend checks: `cd frontend && npm test -- --run && npm run typecheck && npm run lint && npm run build`.
- Confirm exact API contracts manually or in tests: `/api/juegos` and `/api/juegos/{slug}` expose `description` and `categories`; `/api/rol` and `/api/rol/{slug}` expose `description`, `categories`, and `publication_types` as JSON arrays.
- Simulate a mixed detail response in each importer where one item succeeds and one item is absent/fails. Verify successful metadata updates and the failed item's stored image, rating/mechanics, description, categories, and publication types remain unchanged.
- Confirm both detail pages render populated metadata and omit empty metadata cleanly at desktop and mobile widths; catalog cards and borrower privacy remain unchanged.
- Confirm no publisher field was introduced and no code selects an arbitrary first publisher: `rg -n "publisher" backend frontend/src tests` should return only pre-existing/unrelated references or explicit fixture assertions that publisher links are ignored.
