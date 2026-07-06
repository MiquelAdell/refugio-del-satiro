# Design — catalog-filters-figma-restyle

Exact values decoded from the Figma source file (`.fig`, page *Desktop
breakpoint - millorat*). Component GUIDs are Figma `node-id`s for reference.

## Anatomy (Figma `Search & filters box`, 66:7339 / 66:7341)

```
+--------------------------------------------------------------+
|      Buscador (tab)        |        Filtros (tab)            |  50px tall
+--------------------------------------------------------------+
|                                                              |
|  [ Buscador ]  🔍 Buscar juego por nombre…   [ Buscar ]      |  box: white,
|                                                              |  1px border,
|  [ Filtros ]   players ─── time ─── categoría ▾  [button]    |  4px radius,
|                                                              |  shadow
+--------------------------------------------------------------+
   Chips row (kept from current implementation)
   [view selector]                          Mostrando N de M
   results grid / list
```

## Values

| Element | Figma value | Token mapping |
|---|---|---|
| Box | white, radius 4, drop shadow `0 2px 2px rgba(0,0,0,.25)` | `--color-surface`, `--radius-sm`, literal shadow |
| Box content padding | 20px vertical, 15px horizontal, gap 15–30 | `--space-md`/`--space-lg` |
| Tabs | 2 × 50% width, 50px tall, text 24px Open Sans regular | `--font-size-xl`, `--font-weight-regular` |
| Active tab | white bg, dark text (continuous with box) | `--color-surface`, `--color-text-heading` |
| Inactive tab | `#efefef` bg, brand-red text | `--color-surface-alt`, `--color-brand` |
| Search input | 48px tall, radius 4, leading magnifier, shadow `0 0 2px rgba(0,0,0,.25)` | extend existing `SearchBar` |
| Buscar / action button | brand-filled, 36px tall, radius 4, padding 6/18 | `ui/Button` primary, size `md` |
| Filter dropdowns | white, 1px `#efefef` border, radius 4, 41px tall | existing `ui/Select` |
| Sliders | 562px track (flexible), red range | existing Radix slider from `FilterPanel` |

## Component plan

- New `components/SearchFiltersBox/` (TSX + CSS): renders the tab pair and one
  of two panels. Tabs are buttons with `aria-selected` / `role="tab"`
  (Radix Tabs is already a transitive dep via radix-ui — use `@radix-ui/react-tabs`
  if available, otherwise a small controlled tab pair).
- `FilterPanel` content is reused **as-is** inside the Filtros panel; only its
  container CSS changes from vertical sidebar card to horizontal row
  (`flex-wrap`, columns collapse to vertical below `--bp-md`).
- `CatalogPage` / `RpgCatalogPage`: drop the sidebar/drawer wiring
  (`filter-drawer`, `useMediaQuery` open/close state), render
  `SearchFiltersBox` above `ActiveFilterChips` + results.
- State stays where it is today (page-level filter state passed down); the box
  is purely presentational.

## Risks

- The sidebar removal touches `CatalogPage.css` significantly — verify the
  ≥1024px layout no longer reserves the left column.
- Filter controls in a horizontal row can overflow at 768–1024px; allow
  `flex-wrap` and test that width range explicitly.
