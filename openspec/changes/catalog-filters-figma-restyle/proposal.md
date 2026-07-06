# Proposal — catalog-filters-figma-restyle

## Why

The implemented catalog filters (side panel on desktop, drawer on mobile, chip
row above the grid — `frontend/src/pages/CatalogPage.tsx` +
`frontend/src/components/FilterPanel.tsx`) do not match the TFM Figma design.
The Figma prototype (*Desktop breakpoint - millorat*, e.g. frame
`Inici - Jocs de taula` 810:21948) places a **centred tabbed "Search & filters"
box** above the results instead:

- Two full-width tabs, **Buscador** and **Filtros** (Figma component
  `Search & filters box`, variants `Tipo=Buscador` 66:7339 / `Tipo=Filtros`
  66:7341). Active tab reads as part of the white box; the inactive tab is grey
  (`#efefef`) with brand-red text.
- **Buscador** tab: a large search input (48px tall, leading magnifier) with a
  brand-red "Buscar" button.
- **Filtros** tab: the filter controls laid out horizontally inside the box —
  players slider, time slider, category multiselect, and an apply/action
  button (Figma: 4 columns, gap 30, padding 20/15, box radius 4px, drop shadow
  `0 2px 2px rgba(0,0,0,0.25)`).
- The grid/list **view selector** sits between the box and the results, and a
  results count ("Mostrando N de M") heads the result section.

## What Changes

- Replace the desktop sidebar + mobile filter drawer with the tabbed
  Buscador/Filtros box, centred above the results, on both `CatalogPage` and
  `RpgCatalogPage`.
- Move the existing `FilterPanel` controls (sort, availability, location,
  players range, time, min rating) into the **Filtros** tab; move the
  `SearchBar` into the **Buscador** tab.
- Keep the `ActiveFilterChips` row (below the box) so applied filters remain
  visible and individually removable — a deliberate deviation kept from the
  current implementation; the Figma frames do not show chips but they preserve
  a spec'd accessibility affordance.
- No API, hook, or filtering-logic changes: same query params, same results.

## Goals

- The catalog toolbar visually matches the Figma `Search & filters box`
  component (tabs, box, control layout) at desktop width.
- All existing filter capabilities remain functional and keyboard-accessible.

## Non-Goals

- No new filter types (the Figma "Categoría" multiselect maps to the existing
  location/category filters we already have — no new taxonomy work).
- No changes to result cards, pagination, or sorting semantics.
- No mobile redesign beyond stacking the box controls vertically (< 768px).
