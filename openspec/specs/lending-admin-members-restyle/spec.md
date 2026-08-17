# lending-admin-members-restyle Specification

## Purpose
TBD - created by archiving change plan-lending-redesign. Update Purpose after archive.
## Requirements
### Requirement: AdminMembersPage uses the design system

The system SHALL restyle `AdminMembersPage` to use the primitives and tokens from `lending-design-system` without changing the page's structure, columns, actions, or backing endpoints.

#### Scenario: All controls use ui/ primitives
- **WHEN** `AdminMembersPage.tsx` is inspected
- **THEN** every button SHALL be rendered via `Button` imported from `frontend/src/ui/Button`
- **AND** every text input SHALL be rendered via `Input` imported from `frontend/src/ui/Input`
- **AND** the create-member form SHALL render inside a `Card`

#### Scenario: No new columns or actions
- **WHEN** the restyled page is compared with the pre-redesign page
- **THEN** the table SHALL retain the existing member, status, and active-loan information
- **AND** the available actions SHALL be the same (toggle active, send link, resend link, delete)
- **AND** no API endpoint under `/admin/members*` SHALL be added or removed

### Requirement: Member roles are visible

The admin member table SHALL include a `Rol` column. Each row SHALL display
`Administrador` for administrators and `Socio` for other members. The `Rol`
header SHALL provide a keyboard-operable sort control and expose its current
direction through `aria-sort`.

#### Scenario: Administrator row
- **WHEN** an administrator views a member whose `is_admin` value is true
- **THEN** the row's `Rol` cell SHALL display `Administrador`

#### Scenario: Member row
- **WHEN** an administrator views a member whose `is_admin` value is false
- **THEN** the row's `Rol` cell SHALL display `Socio`

#### Scenario: Sort by role in both directions
- **WHEN** an administrator activates the `Rol` sort control for the first time
- **THEN** `Administrador` rows SHALL appear before `Socio` rows
- **AND** the column header SHALL expose `aria-sort="ascending"`
- **WHEN** the administrator activates the same control again
- **THEN** `Socio` rows SHALL appear before `Administrador` rows
- **AND** the column header SHALL expose `aria-sort="descending"`
- **AND** both activations SHALL be available by keyboard

### Requirement: Wraps in PageLayout

The system SHALL render `AdminMembersPage` inside the shared `<PageLayout>` so its header, navigation, and footer match the rest of the lending app.

#### Scenario: Layout consistency
- **WHEN** `AdminMembersPage` renders
- **THEN** its outermost element SHALL be `<PageLayout>`
- **AND** the page SHALL show the same header and footer as `CatalogPage` and `MyLoansPage`

### Requirement: Confirmation dialogs use the new Dialog primitive

The system SHALL use the new `Dialog` primitive (with focus trap and Escape-to-close) for confirmation prompts on destructive admin actions (e.g. delete member, deactivate member).

#### Scenario: Delete member confirmation
- **WHEN** an admin clicks Delete on a member row
- **THEN** a `Dialog` SHALL open asking for confirmation
- **AND** focus SHALL be trapped inside the dialog until it is dismissed or confirmed
- **AND** pressing Escape SHALL cancel the action

#### Scenario: Deactivate member confirmation
- **WHEN** an admin toggles a member to inactive
- **THEN** a `Dialog` SHALL open asking for confirmation
- **AND** the member SHALL be deactivated only after the admin confirms in the dialog

### Requirement: CSV import reconciles the active membership list

The system SHALL treat a valid members CSV upload as the source of truth for
active membership without deleting member records or loan history.

#### Scenario: Missing member is disabled
- **GIVEN** an active member exists and the importing administrator is different
- **WHEN** a valid CSV omits that member and no more than 50% of the other active members are missing
- **THEN** the omitted member SHALL be disabled
- **AND** the member record and loan history SHALL remain stored
- **AND** the import result SHALL report the disabled count

#### Scenario: Suspicious upload skips bulk deactivation
- **WHEN** a CSV has no valid email addresses or omits more than 50% of the active members other than the importing administrator
- **THEN** no missing member SHALL be disabled
- **AND** the import result SHALL include a safety warning

#### Scenario: Importing administrator remains active
- **WHEN** the importing administrator is absent from the CSV
- **THEN** that administrator SHALL remain active and retain administrator access

#### Scenario: Malformed CSV is atomic
- **WHEN** a CSV has malformed row structure or an invalid member number
- **THEN** the request SHALL fail with HTTP 400
- **AND** no member SHALL be created, updated, or disabled
