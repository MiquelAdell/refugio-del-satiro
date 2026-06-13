# Proposal — ludoteca-rpg-catalog

GitHub issue: [#75 — Re-add libros de rol to ludoteca](https://github.com/MiquelAdell/refugio-del-satiro/issues/75)

## Why

The legacy PythonAnywhere site served both **juegos de mesa** and **libros de
rol** from the same BGG collection (`RefugioDelSatiro`); the rebuilt app only
has board games. The legacy RPG import is the same BGG XML API with
`subtype=rpgitem` — no PythonAnywhere access is needed. Separately, the app
lives at `/prestamos` while the public catalog alias `/ludoteca` is a Caddy
rewrite hack; issue #75 asks to make `/ludoteca` the canonical URL.

## What Changes

**URL unification (decision: full move):**

- The whole SPA (catalog, detail, login, my-loans, admin) moves from
  `/prestamos` to `/ludoteca`. Guest vs member is decided by **login state**
  (`member === null`), not by path. `/prestamos/*` 301-redirects to
  `/ludoteca/*`, preserving query strings (old set-password email links).
- New catalog routes: `/ludoteca/juegos-de-mesa` (default — `/ludoteca/`
  redirects there) and `/ludoteca/juegos-de-rol`. Existing
  `/ludoteca/juegos/:slug` board-game detail links keep working; RPG detail
  lives at `/ludoteca/rol/:slug`.

**RPG catalog (decisions: catalog-only, minimal filters):**

- `games` table gains `item_type` (`'boardgame' | 'rpgitem'`, default
  `'boardgame'`) and `description` columns. RPG items are excluded from all
  lending paths (list, borrow, history).
- New `BggClient.fetch_owned_rpg_items()` (collection `subtype=rpgitem` +
  thing-API details in batches of 20), `ImportRpgItemsUseCase`, and CLI
  command `refugio import-rol`.
- New public endpoints `GET /api/rol` and `GET /api/rol/{slug}` with their own
  `RpgItemResponse` (no loan fields). `/api/juegos` lists boardgames only.
- New `RpgCatalogPage` (search + name/rating sort only — no players/time/
  location/availability facets), `RpgCard`, `RpgDetailPage` (no borrow UI).
- `CatalogTypeToggle` ("Juegos de mesa" / "Libros de rol" pills, legacy look)
  on both catalog pages, plus a "powered by BGG" banner on both.

## Goals

- Canonical `/ludoteca` URL with safe redirects; sessions survive the move.
- Libros de rol browsable again, imported from the existing BGG collection.
- Board-game filters and search untouched.

## Non-Goals

- Lending for RPG items (catalog-only; could be added later).
- RPG genre/category/mechanics/setting facets (legacy had them; deferred).
- Any change to board-game filters, search, or `GameResponse` shape.
- PythonAnywhere data access (`PYTHON_ANYWHERE_*` env vars unused).

## Rollback

- Migration is additive; rpgitem rows are inert (excluded by `item_type`).
- Ship `/prestamos` redirects as 302 on first deploy; flip to 301 after a
  soak period (browsers cache 301s).
