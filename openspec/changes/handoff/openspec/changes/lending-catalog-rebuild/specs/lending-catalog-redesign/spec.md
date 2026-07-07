# Spec delta — lending-catalog-redesign

> This change **implements** the `lending-catalog-redesign` capability. The full
> requirements live in `openspec/specs/lending-catalog-redesign/spec.md`
> (cover-first GameCard, side-panel + chip-row filters, accessible player-range
> slider, game detail with Borrow CTA, public `/ludoteca`). The deltas below are
> the **implementation-time refinements** resolved while building this change.
> Keep this file lean — do not restate the canonical requirements.

## ADDED Requirements

### Requirement: Catalog view mode with persistence

The catalog SHALL offer a grid/list view toggle and SHALL remember the member's
choice across reloads (resolves DQ-2).

#### Scenario: Toggle persists
- **WHEN** the member switches the catalog to list view and reloads the page
- **THEN** the catalog SHALL render in list view
- **AND** the stored preference SHALL be read from `localStorage`

#### Scenario: Default view
- **WHEN** a member with no stored preference opens the catalog
- **THEN** the catalog SHALL default to grid view (the heat-map-preferred default, style-guide §9)

### Requirement: Covers render without forced crop

`GameCard` SHALL display each BGG/RPGGeek cover at its natural aspect ratio
inside a neutral frame, capped by a maximum height token, never force-cropped to
a uniform ratio (resolves DQ-3; style-guide §6.4).

#### Scenario: Portrait RPG cover
- **WHEN** a card renders a tall portrait cover
- **THEN** the cover SHALL be shown uncropped within the card frame
- **AND** the card height SHALL adapt to the cover up to the max-height cap

#### Scenario: Rating badge placement is consistent
- **WHEN** a BGG rating badge is shown on a cover
- **THEN** it SHALL use the single placement chosen in DQ-1 across every card
- **AND** it SHALL sit on a semi-transparent scrim so it stays legible over any artwork
