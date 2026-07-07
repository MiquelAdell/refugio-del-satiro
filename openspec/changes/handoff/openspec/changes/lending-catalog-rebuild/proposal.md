## Why

Phase A (`lending-design-tokens-and-primitives`) is merged: `frontend/src/tokens.css`
now carries the brand palette (`#BE0000`, Oswald/Open Sans, `#111`/black nav),
and `frontend/src/ui/` exposes `Button`, `Input`, `Select`, `Chip`, `Badge`,
`Card`, `Dialog`, plus `PageLayout`/`SiteHeader`/`SiteFooter`. The catalog,
however, still renders the pre-redesign UI: a utilitarian `GameCard`, an
inline filter panel, a custom JS dual-slider, and a `GameDetailPage` with no
borrow action. This change implements the **`lending-catalog-redesign`**
capability (`openspec/specs/lending-catalog-redesign/spec.md`) — the cover-first
browse experience defined by the TFM and distilled in
`tasks/lending-redesign/style-guide.md` (§5.3–5.9, §6.4).

## What Changes

- **Rebuild `GameCard`** (`frontend/src/components/GameCard.tsx`) as cover-first:
  the BGG cover is the dominant element; availability + BGG-rating render as
  overlay badges; title/year/player-range/play-time sit below. Covers are framed
  in a neutral white card with **no forced crop** (variable height — RPG covers
  are portrait, board-game covers near-square). See style-guide §5.6, §6.4.
- **Rebuild `CatalogPage`** (`frontend/src/pages/CatalogPage.tsx`): filters move
  to a **fixed left side panel ≥1024px** (bottom-sheet/drawer below that), with a
  **chip row of active filters** above the grid (each chip individually
  removable). Add a **grid/list view toggle**. Compose all controls from
  `ui/` primitives.
- **Replace the custom dual-slider** for player-range with an accessible
  **Radix UI `Slider`** (`@radix-ui/react-slider`) — full keyboard control and
  ARIA value attributes (style-guide §5.5, §9; Decision D2/F4 in the archived
  plan).
- **Rebuild `GameDetailPage`** (`frontend/src/pages/GameDetailPage.tsx`): a
  two-column hero (cover left; name + meta icons + category pills + primary
  **Borrow CTA** right), collapsible description (`Mostrar más`), and the
  existing loan-history table below under a `HISTORIAL DE PRÉSTAMOS Y
  COMENTARIOS` section. The Borrow CTA is the page's primary action and is
  visible above the fold. Clicking it opens the borrow dialog **delivered by the
  sibling change `lending-borrow-with-return-date`** (see Dependencies).
- **Add the public read-only catalog at `/ludoteca`**: the same catalog
  component, mounted under a second basename in a guest-mode variant — no Borrow
  controls; a "Iniciar sesión" link to `/prestamos/login` instead.

## Goals

- Visual + interaction parity with the TFM catalog and detail screens, tuned to
  the merged brand tokens — the lending section reads as one product with the
  club site.
- A single catalog component that serves both the authenticated member route
  (`/prestamos`) and the public guest route (`/ludoteca`) via a guest-mode flag.
- An accessible (WCAG 2.1 AA) player-range slider replacing the brittle custom one.

## Non-Goals

- The borrow dialog itself, the `expected_return_date` field, and the
  `MyLoansPage` rebuild — those ship in `lending-borrow-with-return-date`. This
  change only adds the Borrow **button** and the `onBorrow` hook point.
- Toasts, loading skeletons, error boundary, dedicated mobile polish pass —
  deferred to the v1.5 polish change.
- Petition list, popular tab, community page, profiles — out of v1 scope.
- Any backend/API/schema change. Catalog and detail read the existing
  `GET /games` and `GET /games/{id}/history` endpoints unchanged.

## User Impact

- Members get a cover-first, filterable catalog and a detail page where borrowing
  is the obvious next step.
- Non-members (and search-engine visitors arriving at the existing `/ludoteca`
  URL) can browse the collection read-only without an account.

## Compatibility

- No public API change. No data change. Pure frontend.
- New dependency: `@radix-ui/react-slider` (headless/unstyled — consistent with
  the "no UI component framework" non-goal per archived-plan finding F4).
- Routing: `/prestamos/*` behaviour is preserved; `/ludoteca` is **added**.

## Rollback

Standalone PR on `development`; revert the merge commit. The old `GameCard`,
`CatalogPage`, `GameDetailPage`, and custom slider are replaced in the same PR,
so a revert restores them atomically. Removing the `/ludoteca` route has no data
side effects.
