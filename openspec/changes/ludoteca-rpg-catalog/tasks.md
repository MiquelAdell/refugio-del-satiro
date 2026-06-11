# Tasks — ludoteca-rpg-catalog (issue #75)

Branch `feature/ludoteca-rpg-catalog` from `development`. Conventional
Commits. Definition of Done: specs updated, tests pass, lint + typecheck
clean, browser smoke per repo CLAUDE.md.

## A. Backend data layer + RPG import [BE]

- [ ] A.1 [DB] `backend/migrations/006_add_item_type.sql`: `item_type` TEXT
      NOT NULL DEFAULT 'boardgame' CHECK in ('boardgame','rpgitem'),
      `description` TEXT NOT NULL DEFAULT '', index on `item_type`.
- [ ] A.2 [BE] `Game` entity: `item_type: str = "boardgame"`,
      `description: str = ""`. Repo Protocol + SQLite impl: `list_by_type`,
      `upsert_by_bgg_id(..., item_type, description)`.
- [ ] A.3 [BE] `BggClient`: `BggRpgItem` dataclass + `fetch_owned_rpg_items()`
      (collection `subtype=rpgitem&own=1&stats=1`, thing-API details in
      batches of 20, 1 s sleep, 202 retry/backoff, no scrape fallback).
- [ ] A.4 [BE] `ImportRpgItemsUseCase` (upsert `item_type='rpgitem'`,
      created/updated/total result) + CLI `refugio import-rol`;
      `enrich-games` → boardgames only.
- [ ] A.5 [BE] Tests: migration, repo `list_by_type` exclusion + cross-type
      slug collision, BGG client RPG XML fixture, import use case.

## B. Backend API + lending guards [BE]

- [ ] B.1 [BE] `ListRpgItemsUseCase` + `GetRpgItemUseCase`.
- [ ] B.2 [BE] `backend/api/routes/rpg_items.py`: `GET /api/rol`,
      `GET /api/rol/{slug}` (404 "Libro no encontrado."), `RpgItemResponse`;
      wire in `app.py` + `dependencies.py`.
- [ ] B.3 [BE] Guards: `list_games` → boardgames only; `get_game` /
      `get_game_history` 404 on rpgitem; `borrow_game` rejects rpgitem.
- [ ] B.4 [BE] Tests: rpgitem in `/api/rol`, absent from `/api/juegos`,
      juegos-slug 404, borrow rejection.

## C. URL unification /prestamos → /ludoteca [FE/infra]

- [ ] C.1 [FE] Single `BrowserRouter basename="/ludoteca"`; `/` →
      `/juegos-de-mesa`; delete path-based guest mode; `CatalogModeContext`
      derives `isGuest` from `useAuth()`.
- [ ] C.2 [FE] `vite.config.ts` base + proxy, `api/client.ts`,
      `SiteHeader`, `GameDetailPage` login link, `AdminContentPage`,
      `site-shell-embed.tsx` → `/ludoteca`.
- [ ] C.3 [infra] Caddyfile(.dev/.e2e): `handle_path /ludoteca/*`, delete
      `/ludoteca*` rewrite hack, query-preserving `/prestamos` redirects;
      `caddy validate`. `docker-compose.yml` + `backend/config.py` base URL
      defaults; `scraper/nav_extractor.py` excludes `/ludoteca`.
- [ ] C.4 [FE] Keep `prestamos_session` localStorage key; tests green.

## D. RPG catalog UI [FE]

- [ ] D.1 [FE] `types/rpg.ts` (`RpgItem`, `RpgQuery`, `applyRpgQuery`),
      `hooks/useRpgItems.ts`.
- [ ] D.2 [FE] `CatalogTypeToggle` (legacy pill look) + `PoweredByBgg`
      (svg from legacy repo) on both catalog pages.
- [ ] D.3 [FE] `RpgCard`, `RpgCatalogPage` (search + name/rating sort only),
      `RpgDetailPage` (no borrow UI, RPGGeek link); routes `/juegos-de-rol`,
      `/rol/:slug`.
- [ ] D.4 [FE] Vitest: search/sort with concrete orders; CatalogPage toggle +
      banner without filter regressions.

## E. E2E + docs

- [ ] E.1 Update redirect/guest/site-shell/visual specs for `/ludoteca`;
      add `/prestamos?query` redirect cases.
- [ ] E.2 Guest RPG journey: toggle → `/juegos-de-rol` → `/rol/:slug` →
      no borrow UI, banner visible. Seed one rpgitem.
- [ ] E.3 README + scraper/README path updates.

## F. Deploy

- [ ] F.1 Deploy; migration auto-runs; `refugio import-rol` on VPS with
      `BGG_BEARER_TOKEN`; production smoke. Flip 302 → 301 after soak.
