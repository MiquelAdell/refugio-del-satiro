# Tasks — lending-catalog-rebuild (Phase B1–B3)

Branch from `development` as `feature/lending-catalog-rebuild`. Conventional
Commits. Definition of Done: specs updated, code matches specs, tests pass, lint
+ typecheck clean.

## 0. Reconcile design tokens (Phase B0 — do first)

- [x] 0.1 [FE] Replace `frontend/src/tokens.css` with the reconciled token set from `handoff/figma-extract/tokens.reconciled.css` (grep `⚠` for each change): muted `#6D6D6D`; surface+border `#EFEFEF`; add `--color-scrim`; system colours to the Google palette (`#34A853`/`#FBBC05`/`#EA4335`); add `--font-size-display: 5rem` (80px H1) and `--font-size-sm: 0.75rem` (12px); add the `--pill-*` pastel set. See `handoff/figma-extract/DESIGN_TOKENS.md`.
- [x] 0.2 [FE] Update `specs/lending-design-system/spec.md` if any token value it asserts changed (border, muted, system colours, type scale). This is a design-system capability edit — keep its delta with this change.
- [x] 0.3 [FE] Regression sweep: grep existing CSS for hard-coded `#f5f5f5`, `#e2e2e2`, `#6b6b6b`, `#2e7d32`, `#ed6c02`, `#c62828` and route them through the tokens; visually confirm SiteHeader/PageLayout/`ui/` primitives still render correctly with the new greys.

## 1. Dependencies & scaffolding

- [x] 1.1 [FE] Add `@radix-ui/react-slider` to `frontend/package.json`; run install; confirm bundle delta is acceptable.
- [x] 1.2 [FE] Add a guest-mode signal: a `CatalogModeContext` (or route prop) carrying `isGuest: boolean`, defaulting to `false` on `/prestamos`.

## 2. GameCard (cover-first)

- [x] 2.1 [FE] Rewrite `components/GameCard.tsx` + `GameCard.css` per design §"Component contracts": cover-dominant, overlay availability + rating badges, meta below, category pills, favourite affordance optional (cut if not in v1 data).
- [x] 2.2 [FE] Support `view: 'grid' | 'list'`; list mode reflows to a horizontal row (style-guide §5.7).
- [x] 2.3 [FE] Add `aria-label` exposing title + availability; ensure badges are not colour-only.
- [x] 2.4 [FE] Resolve DQ-1 (rating badge position) and DQ-3 (cover-height cap); bake the chosen values into tokens/CSS.
- [x] 2.5 [FE] Update/extend `components/GameCard.test.tsx`: available badge, lent badge, guest hides Borrow, list vs grid render.

## 3. CatalogPage (filters + chips + view toggle)

- [x] 3.1 [FE] Rebuild `pages/CatalogPage.tsx` + `.css`: fixed left `FilterPanel` ≥1024px; bottom-sheet/drawer below; grid right.
- [x] 3.2 [FE] Build `FilterPanel` from `ui/` primitives (`Select`, `Chip`, `Input`) + the Radix player-range slider; emit a typed `CatalogQuery`.
- [x] 3.3 [FE] Build `ActiveFilterChips` row above the grid; each chip removable, removal re-runs the query.
- [x] 3.4 [FE] Add grid/list view toggle; wire DQ-2 (persist choice in `localStorage`?).
- [x] 3.5 [FE] Keep the existing 300ms-debounced name search (`SearchBar`); restyle to tokens.
- [x] 3.6 [FE] Vitest: chip add/remove re-queries; breakpoint switch side-panel↔drawer; slider arrow-key + Home/End move handles and update `aria-valuenow`.

## 4. GameDetailPage (hero + Borrow CTA)

- [x] 4.1 [FE] Rebuild `pages/GameDetailPage.tsx` + `.css`: two-column hero (cover left; name, meta icons, pills, primary Borrow CTA right), collapsible description.
- [x] 4.2 [FE] Keep the loan-history table (`LoanHistoryEntry`) under a `HISTORIAL DE PRÉSTAMOS Y COMENTARIOS` section; restyle to tokens (style-guide §5.12).
- [x] 4.3 [FE] Render the state-driven primary action: available → **Borrow** (`Solicitar préstamo`); lent → non-actionable "Prestado" status; guest → "Iniciar sesión" link. Wire Borrow to call `onBorrow(gameId)` — the handler lands in `lending-borrow-with-return-date`; stub it here (e.g. `console.warn` / no-op) and note the dependency in the PR.
- [x] 4.4 [FE] Vitest: available shows Borrow CTA above fold; lent shows status not Borrow; guest shows login link; history still renders in all states.

## 5. Public read-only catalog at `/ludoteca`

- [x] 5.1 [FE] Add the `/ludoteca` basename in `App.tsx` mounting the catalog tree with `isGuest = true`.
- [x] 5.2 [FE] Confirm dev (Vite/Caddy) and prod routing send `/ludoteca/*` to the SPA; document any Caddyfile change needed (coordinate with `site-shell-from-scraped-html`).
- [x] 5.3 [FE] Hide member-only nav in guest mode; ensure deep links to `/ludoteca/games/:id` work read-only.
- [x] 5.4 [FE] Playwright: extend `smoke-46-guest` — browse, open a detail page, assert no Borrow control and a visible "Iniciar sesión" link.

## 6. Specs & cleanup

- [x] 6.1 [CR] Update `specs/lending-catalog-redesign/spec.md` in this change with the resolved DQ-1/DQ-2/DQ-3 acceptance detail (the delta in this folder).
- [x] 6.2 [CR] Boy-Scout: delete any dead CSS/JS from the old custom slider and inline filter panel; grep for stale `#2563eb` and remove.
- [x] 6.3 [CR] `openspec validate lending-catalog-rebuild` → no errors; run frontend lint + typecheck + test.
