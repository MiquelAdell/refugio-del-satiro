# Tasks — catalog-filters-figma-restyle

Branch: `feature/catalog-filters-figma` (from `development`). Conventional
Commits. Definition of Done: specs updated, code matches specs, tests pass,
lint + typecheck clean, browser smoke test at 1280px and 375px.

## 1. SearchFiltersBox component

- [ ] 1.1 [FE] Create `components/SearchFiltersBox/` — tabbed box per
      `design.md` (Buscador / Filtros tabs, white 4px-radius box with shadow;
      active tab white + dark text, inactive grey + red text, 24px Open Sans).
- [ ] 1.2 [FE] Buscador panel: existing `SearchBar` at 48px height plus a
      primary `ui/Button` "Buscar" (submit still filters live on typing —
      the button is an explicit affordance, not new behaviour).
- [ ] 1.3 [FE] Filtros panel: mount the existing `FilterPanel` controls in a
      horizontal `flex-wrap` row; collapse to a vertical stack below 768px.
- [ ] 1.4 [FE] Component test: both tabs render, panel switches on click and
      with arrow keys, `role="tab"`/`aria-selected` correct.

## 2. Page integration

- [ ] 2.1 [FE] `CatalogPage`: remove the desktop sidebar and the mobile filter
      drawer; render `SearchFiltersBox` above `ActiveFilterChips` and the
      results. Keep view toggle + "Mostrando N de M" between box and grid.
- [ ] 2.2 [FE] `RpgCatalogPage`: same integration.
- [ ] 2.3 [FE] Delete now-dead drawer CSS/state (`CatalogPage.css` sidebar
      rules, drawer media queries); Boy Scout the files touched.
- [ ] 2.4 [FE] Update page tests: filters reachable via the Filtros tab, chips
      still appear/removable, search still filters from the Buscador tab.

## 3. Verification & specs

- [ ] 3.1 [FE] `vitest` + `tsc` + lint clean.
- [ ] 3.2 [FE] Browser smoke test (member + guest): search a game, apply a
      players filter, remove it via chip, switch grid/list, at 1280px and
      375px; console free of new errors.
- [ ] 3.3 [CR] Apply the spec delta in
      `specs/lending-catalog-redesign/spec.md` (this folder) to
      `openspec/specs/lending-catalog-redesign/spec.md`.
- [ ] 3.4 [CR] `openspec validate catalog-filters-figma-restyle` → no errors.
