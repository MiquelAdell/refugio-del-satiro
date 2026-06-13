# Design — ludoteca-rpg-catalog

## Data model: shared `games` table + `item_type`

BGG boardgames and rpgitems share the "thing" id namespace, so the existing
`bgg_id UNIQUE` constraint holds and slug uniqueness across both catalogs
comes free (both have detail URLs). A separate `rpg_items` table would
duplicate the repo/slug/migration machinery for five fields. Cost: lending
paths must exclude rpgitems — guards in `list_games`, `get_game`,
`get_game_history`, and `borrow_game`.

Migration `006_add_item_type.sql`:

```sql
ALTER TABLE games ADD COLUMN item_type TEXT NOT NULL DEFAULT 'boardgame'
    CHECK (item_type IN ('boardgame', 'rpgitem'));
ALTER TABLE games ADD COLUMN description TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_games_item_type ON games (item_type);
```

No post-migration hook: defaults are correct for all existing rows.

## Import flow

Mirrors the legacy `RPGameExternalClient.py` against the current
architecture: collection fetch
(`/xmlapi2/collection?username=RefugioDelSatiro&subtype=rpgitem&own=1&stats=1`,
reusing the 202 retry/backoff and bearer token) then thing-API details
(`/xmlapi2/thing?id=…&stats=1`) in batches of 20 with a 1 s sleep. Import and
enrichment happen in one `ImportRpgItemsUseCase.execute()` pass — the RPG set
is small. No HTML-scrape fallback; fail loudly. Fields: name, thumbnail,
image, year, rating, description (`html.unescape`).

## API: separate `/api/rol` router

`GameResponse` carries status/borrower/loan/location/players/time — all
meaningless for RPG items. A separate `RpgItemResponse` keeps both models
honest and `/api/juegos` consumers unchanged. `/api/rol` is public with no
guest/member distinction (nothing to hide).

## Guest/member unification

The backend already derives guest from auth (`OptionalMember` cookie JWT;
borrower fields nulled when `member is None`) — no backend change. The
frontend drops the dual-`BrowserRouter` path split: one router with
`basename="/ludoteca"`, and `CatalogModeContext` derives
`isGuest = member === null` from `useAuth()`. Consumers keep calling
`useCatalogMode()`. While auth is loading, guest rendering is the safe
default. The `prestamos_session` localStorage key is kept (origin-scoped) so
sessions survive the URL move.

## Caddy routing

`handle_path /ludoteca/*` replaces `handle_path /prestamos/*`; the
`handle /ludoteca*` rewrite hack is deleted (the FastAPI SPA catch-all serves
`index.html` for client routes). `/prestamos` and `/prestamos/*` redirect with
`{uri}` to preserve queries. Content-mirror static pages at root
`/juegos-de-rol/*` do not conflict with `/ludoteca/juegos-de-rol` (longest
prefix wins).

## Frontend pages

`RpgCatalogPage` is a separate page from `CatalogPage` (different query model:
`RpgQuery { search, sort: name-asc | name-desc | rating }`; no FilterPanel) so
the board-game catalog stays untouched per issue requirement. `RpgCard` is a
separate component (`GameCard` is loan-typed). Toggle and BGG banner are
shared components rendered by both catalog pages.
