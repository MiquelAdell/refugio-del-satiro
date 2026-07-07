# Spec delta — catalog-filters-figma-restyle

## MODIFIED Requirements

### Requirement: Catalog filters in a tabbed search-and-filters box

The system SHALL render the catalog search and filters inside a centred tabbed
box above the results (Figma `Search & filters box`): a **Buscador** tab
containing the search input and a **Filtros** tab containing the filter
controls. Active filters SHALL remain visible as a chip row below the box,
individually removable.

#### Scenario: Tabbed box replaces the side panel
- **WHEN** the catalog page renders at any viewport width
- **THEN** the search input and filter controls SHALL be inside the tabbed box above the results
- **AND** no fixed left filter column SHALL be reserved

#### Scenario: Switching tabs
- **WHEN** the user activates the Filtros tab (click or keyboard)
- **THEN** the filter controls SHALL replace the search input inside the box
- **AND** previously applied search text and filters SHALL remain applied

#### Scenario: Active filters visible as chips
- **WHEN** the user selects a filter (e.g. "2–4 players", "Disponibles")
- **THEN** the active filter SHALL appear as a removable chip below the box

#### Scenario: Removing a filter via its chip
- **WHEN** the user clicks the close affordance on a chip
- **THEN** the corresponding filter SHALL be cleared from the catalog query
- **AND** the catalog grid SHALL re-render with the updated result set
