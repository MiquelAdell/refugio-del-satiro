# lending-catalog-redesign Specification

## Purpose
TBD - created by archiving change plan-lending-redesign. Update Purpose after archive.
## Requirements
### Requirement: Cover-first GameCard

The system SHALL render each game in the catalog as a card where the game cover image is the dominant visual element, with availability and rating shown as overlay badges and the game title and core stats below.

#### Scenario: Card visual hierarchy
- **WHEN** a `GameCard` renders for a game
- **THEN** the cover image SHALL occupy the top portion of the card
- **AND** an availability badge SHALL be overlaid on the cover (e.g. top-left)
- **AND** a BGG rating badge SHALL be overlaid on the cover (e.g. top-right)
- **AND** the game title, year, player range, and playing time SHALL render below the cover

#### Scenario: Available game card
- **WHEN** a game is currently available
- **THEN** the availability badge SHALL display "Disponible" with the success state styling

#### Scenario: Lent game card
- **WHEN** a game is currently lent
- **THEN** the availability badge SHALL display "Prestado" with the warning/lent state styling

### Requirement: Catalog filters as side panel + chip row

The system SHALL render the catalog filters in a side panel on desktop and a chip row of active filters above the grid; selected filter values SHALL be visible at a glance and individually removable.

#### Scenario: Active filters visible as chips
- **WHEN** the user selects a filter (e.g. "2–4 players", "Disponibles")
- **THEN** the active filter SHALL appear as a removable chip in the chip row above the grid

#### Scenario: Removing a filter via its chip
- **WHEN** the user clicks the close affordance on a chip
- **THEN** the corresponding filter SHALL be cleared from the catalog query
- **AND** the catalog grid SHALL re-render with the updated result set

#### Scenario: Side panel on desktop
- **WHEN** the viewport width is ≥ 1024 px
- **THEN** the filter panel SHALL be visible as a fixed left column
- **AND** the catalog grid SHALL render to the right of it

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

