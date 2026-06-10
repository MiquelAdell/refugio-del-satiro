## Context

The lending app is a React + TypeScript SPA (Vite) under `frontend/`, mounted at
`/prestamos` via a React Router basename. Catalog data comes from the typed
client in `frontend/src/api/client.ts` through the `useGames` hook; game history
through `useGameHistory`. Styling is plain CSS Modules driven by the tokens in
`frontend/src/tokens.css` (Phase A). Primitives live in `frontend/src/ui/`.

Authoritative visual reference: `tasks/lending-redesign/style-guide.md`
(§4 layout, §5 components, §6 imagery, §9 accessibility, §11 guardrails) plus the
exported pages under `tasks/lending-redesign/mockups/`. The `#11` agent prompt
guide in the style guide is the condensed do/don't list — follow it.

> **Note on `current-state.md`:** it documents the *pre-Phase-A* tree (it lists
> `NavBar`, `LanguageSelector`, `#2563eb` tokens). The live tree already has
> `SiteHeader`/`SiteFooter`/`PageLayout`, the `ui/` primitives, brand tokens, and
> no i18n. Treat `current-state.md` as a structural map, not a source of truth for
> styling.

## Data flow through the layers

This change is **frontend-only**; no domain/data/api/cli layer is touched.

```
GET /games            ── useGames() ──► CatalogPage ──► GameCard[]    (grid|list)
                                              │
                                  FilterPanel (side / drawer)
                                  ActiveFilterChips (chip row)
                                              │
GET /games/{id}/history ─ useGameHistory ─► GameDetailPage ─► LoanHistory table
                                              │
                                       Borrow CTA ──► onBorrow(gameId)
                                                       (handler provided by
                                                        lending-borrow-with-return-date)
```

### Guest mode (`/ludoteca`)

Mount the same React tree under a second basename and pass an `isGuest` flag down
(via a small context or a route-level prop). `isGuest` gates exactly two things:

- `GameCard` / `GameDetailPage` render **no** Borrow control; instead a
  "Iniciar sesión" link to `/prestamos/login`.
- The header's member-only nav (My Loans, Admin) is hidden.

No data filtering — guests see the same `GET /games` payload (the catalog is
public information). Confirm the basename wiring in `App.tsx` and the Vite/Caddy
routing split (`/ludoteca` must reach the SPA, like `/prestamos`).

## Component contracts (proposed)

- **`GameCard`** — props `{ game: GameResponse; view: 'grid' | 'list'; isGuest: boolean }`.
  - Grid: cover on top (object-fit: contain, natural height capped by a
    `--card-cover-max-h` token), availability badge overlay top-left, rating badge
    overlay (see Decision **DQ-1** for position), title/year/meta-icons/pills below.
  - List: cover thumbnail (~110px) left, content right, pills bottom.
  - Expose card state to AT: `aria-label="<title> — <disponible|prestado>"`
    (ribbon/colour alone is invisible to screen readers — style-guide §9).
- **`FilterPanel`** — availability, location, player-range (Radix slider),
  play-time presets, min BGG rating, sort. Emits a typed `CatalogQuery`.
- **`ActiveFilterChips`** — renders one removable `Chip` per non-default filter;
  removing re-runs the query.
- **`CatalogPage`** — owns `CatalogQuery` + `view` state; `view` persistence is
  Decision **DQ-2**.

## Known constraints / decisions

- **Variable cover aspect ratio** — never force-crop covers (style-guide §6.4).
  Cards size their height to the cover; the grid is a masonry-tolerant CSS grid,
  not fixed-ratio cells.
- **Flat design** — 1px `--color-border` hairlines, no resting shadows; soft
  shadow only on hover and on dialogs (style-guide §4.5).
- **Radix** is headless behaviour only — style it with CSS Modules + tokens.
- Open product decisions that gate acceptance criteria are tracked in
  `handoff/DECISIONS_NEEDED.md` (DQ-1 rating-badge position, DQ-2 view
  persistence, DQ-3 cover-height cap). Pick defaults there if unconfirmed.

## Testing strategy

- **Vitest + RTL** for `GameCard` (available vs lent badge, guest hides Borrow),
  `CatalogPage` (chip add/remove re-queries, side-panel vs drawer at breakpoints),
  and the Radix slider keyboard interaction.
- **Playwright** for the `/ludoteca` guest journey (browse, open detail, see
  "Iniciar sesión", no Borrow) — extend the existing `smoke-46-guest` flow.
