# Lending Admin Members Restyle

## ADDED Requirements

### Requirement: AdminMembersPage uses the design system

The system SHALL restyle `AdminMembersPage` to use the primitives and tokens from `lending-design-system` without changing the page's structure, columns, actions, or backing endpoints.

#### Scenario: All controls use ui/ primitives
- **WHEN** `AdminMembersPage.tsx` is inspected
- **THEN** every button SHALL be rendered via `Button` imported from `frontend/src/ui/Button`
- **AND** every text input SHALL be rendered via `Input` imported from `frontend/src/ui/Input`
- **AND** the create-member form SHALL render inside a `Card`

#### Scenario: No new columns or actions
- **WHEN** the restyled page is compared with the pre-redesign page
- **THEN** the table columns SHALL be the same (member number, name, email, phone, admin flag, active flag, active loan count)
- **AND** the available actions SHALL be the same (toggle active, send link, resend link, delete)
- **AND** no API endpoint under `/admin/members*` SHALL be added or removed

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
