# lending-catalog-redesign Specification

## Purpose
TBD - created by archiving change plan-lending-redesign. Update Purpose after archive.
## Requirements
### Requirement: Cover-first GameCard

The system SHALL render each game in the catalog as a card where the game cover image is the dominant visual element, with a rating block, description excerpt, meta column (age/time/players), and a single tag pill below.

#### Scenario: Card visual hierarchy
- **WHEN** a `GameCard` renders for a game
- **THEN** the cover image SHALL occupy the top portion of the card
- **AND** a red square block with the BGG rating (one decimal) SHALL hang over the cover/body boundary on the left
- **AND** the game title SHALL render as the card heading, clamped to two lines with an ellipsis when needed, with the game description below it clamped to three lines
- **AND** a vertical meta column SHALL show minimum age ("8+"), playing time ("30min"), and player range ("3-8"), hiding any item whose value is missing
- **AND** a single tag pill SHALL render bottom-right: the game's primary BGG subdomain mapped to a Spanish label (Familiar, Estrategia, Fiesta, Temático, …), falling back to the game's most common own category, or no pill when neither exists

#### Scenario: Available game card
- **WHEN** a game is currently available
- **THEN** no status overlay SHALL render on the cover

#### Scenario: Lent game card
- **WHEN** a game is currently lent
- **THEN** a diagonal ribbon reading "EN PRÉSTAMO" SHALL be overlaid on the cover's bottom-right corner

### Requirement: RPG cards share the catalog card design

The system SHALL render each RPG book in the RPG catalog with the same
cover-first card design as `GameCard` (shared `CatalogCard` component),
adapted to book data: the meta column SHALL show a book icon labelled
"Manual" for rulebook-style publication types (Core Rules, Sourcebook,
Campaign Setting, Quick Start), a quill icon labelled "Aventura" for
scenario/adventure publication types, and the publication year; the tag
pill SHALL be the item's most common own RPGGeek category, with known
category families mapped to Spanish labels (Fantasía, Horror,
Ciencia Ficción, Mitología, …). The RPG catalog page SHALL share the
board game catalog layout: "Catálogo" heading, catalog type toggle,
Buscador/Filtros box, results count, and the persisted grid/list view
toggle.

#### Scenario: RPG book covers are never cropped
- **WHEN** an RPG card renders a tall portrait cover
- **THEN** the cover SHALL be letterboxed inside the shared cover frame, not force-cropped

#### Scenario: Lent RPG card
- **WHEN** an RPG item is currently lent
- **THEN** the same diagonal "EN PRÉSTAMO" ribbon SHALL be overlaid on the cover's bottom-right corner

### Requirement: Readable responsive list cards

The system SHALL render board-game and RPG list cards with a prominent cover
column and rating block, a left-aligned title, a description clamped to two
lines, and horizontal metadata. On narrow screens, the cover and rating SHALL
use compact sizes without overflowing. RPG covers SHALL remain letterboxed in
both desktop and compact list layouts.

#### Scenario: Desktop list view
- **WHEN** the user selects list view on a desktop viewport
- **THEN** each card SHALL show an approximately 180 px cover column and 56 px rating block
- **AND** the title, two-line description, and horizontal metadata SHALL remain readable

#### Scenario: Compact list view
- **WHEN** a list card renders on a narrow viewport
- **THEN** it SHALL use an approximately 96 px cover column and 40 px rating block
- **AND** the card SHALL not overflow its container
- **AND** an RPG cover SHALL remain uncropped

### Requirement: Catalog filters in a tabbed search-and-filters box

The system SHALL render the catalog search and filters inside a centred tabbed
box above the results (Figma `Search & filters box`): a **Buscador** tab
containing the search input and a **Filtros** tab containing the filter
controls. Active search text and filters SHALL remain visible as a chip row
below the box, individually removable. Sorting SHALL be separate from filtering
and SHALL appear beside the grid/list view toggle in the results bar.

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

#### Scenario: Search text visible as a chip
- **WHEN** the user enters non-blank search text
- **THEN** a removable chip labelled `Palabra clave: “<text>”` SHALL appear below the box

#### Scenario: Removing a filter via its chip
- **WHEN** the user clicks the close affordance on a chip
- **THEN** the corresponding filter SHALL be cleared from the catalog query
- **AND** the catalog grid SHALL re-render with the updated result set

#### Scenario: Clear search and filters without resetting sort
- **WHEN** any search text or filter is active
- **THEN** the system SHALL show a `Limpiar búsqueda y filtros` action
- **AND WHEN** the user activates it
- **THEN** search text and all filters SHALL return to their defaults
- **AND** the selected sort order SHALL be preserved

#### Scenario: Sorting remains available across tabs
- **WHEN** either the Buscador or Filtros tab is active
- **THEN** the `Ordenar por` control SHALL remain available beside the grid/list toggle

### Requirement: Board-game player-age filter

The board-game catalog SHALL offer an `Edad, a partir de` filter with ages from
3 through 18. Selecting age X SHALL include only games with a known minimum age
greater than zero and less than or equal to X. The RPG catalog SHALL not expose
this board-game-specific filter.

#### Scenario: Game is suitable for the selected age
- **WHEN** the player-age filter is set to 8
- **AND** a game has minimum age 8 or lower
- **THEN** the game SHALL remain in the results

#### Scenario: Game requires an older player
- **WHEN** the player-age filter is set to 8
- **AND** a game has minimum age greater than 8
- **THEN** the game SHALL be excluded from the results

#### Scenario: Game has no known minimum age
- **WHEN** any player-age filter is active
- **AND** a game's minimum age is missing or zero
- **THEN** the game SHALL be excluded from the results

### Requirement: Catalog location reflects the BGG collection comment

The system SHALL synchronize each imported item's location from its BGG
collection comment, assigning **Armario** by default. When the comment contains
`Sótano` or `Sotano` as a standalone, case-insensitive word, the system SHALL
assign it to **Sótano** on that import.
The location filter SHALL offer Todos, Armario, and Sótano, showing the
matching subset for each specific location.

#### Scenario: Sótano marker surrounded by comment text
- **WHEN** a collection comment is `foo, Sótano, bar`
- **THEN** the imported item SHALL be assigned to Sótano

#### Scenario: Marker text embedded in another word
- **WHEN** a collection comment is `foosotanobar`
- **THEN** the imported item SHALL remain assigned to Armario

### Requirement: Accessible player-range slider

The system SHALL replace the existing custom dual-slider for the player-range filter with an accessible primitive built on Radix UI (or equivalent headless library) supporting full keyboard control.

#### Scenario: Keyboard control
- **WHEN** the player-range slider has focus
- **THEN** the user SHALL be able to move each handle with arrow keys
- **AND** `Home` / `End` SHALL move a handle to its respective extreme

#### Scenario: ARIA attributes present
- **WHEN** the slider renders
- **THEN** each handle SHALL expose a valid `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`

### Requirement: Game detail with prominent Borrow CTA

The system SHALL render the game detail page with a prominent primary-action Borrow button visible without scrolling on standard viewports, the game cover, description, BGG link, availability, and the existing loan history.

#### Scenario: Borrow CTA is the primary action
- **WHEN** an authenticated member visits a game detail page for an available game
- **THEN** a primary-style Borrow button SHALL be rendered above the fold
- **AND** clicking the Borrow button SHALL open the borrow date dialog (see `lending-borrow-return-flow`)

#### Scenario: Lent game shows status, not Borrow CTA
- **WHEN** an authenticated member visits a game detail page for a currently-lent game
- **THEN** the Borrow button SHALL be replaced by a non-actionable "Prestado" status indicator
- **AND** the loan history SHALL still be visible

#### Scenario: Guest visit
- **WHEN** an unauthenticated visitor opens a game detail page
- **THEN** the Borrow button SHALL be replaced by a "Iniciar sesión" link to the login page

### Requirement: Public read-only catalog at `/ludoteca`

The system SHALL render the catalog component at the public path `/ludoteca` in a guest-mode variant that omits Borrow controls and replaces them with a login link, while continuing to render the full member experience at `/prestamos`.

#### Scenario: Public catalog has no Borrow controls
- **WHEN** an unauthenticated visitor opens `/ludoteca`
- **THEN** the catalog grid SHALL render
- **AND** no `GameCard` SHALL show a Borrow button
- **AND** the page header SHALL link to `/prestamos/login` for member access

#### Scenario: Authenticated member sees private catalog
- **WHEN** an authenticated member opens `/prestamos`
- **THEN** the same catalog component SHALL render with Borrow controls available on each available `GameCard`
