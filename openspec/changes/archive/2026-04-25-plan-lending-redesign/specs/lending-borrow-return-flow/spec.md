# Lending Borrow / Return Flow

## ADDED Requirements

### Requirement: Borrow dialog with return-date selection

The system SHALL ask the member to select an expected return date when borrowing a game, via a dialog that offers preset options ("1 semana", "2 semanas") and a calendar picker for custom dates, defaulting to "2 semanas".

#### Scenario: Member borrows with default preset
- **WHEN** an authenticated member clicks Borrow on an available game
- **THEN** the borrow dialog SHALL open
- **AND** the "2 semanas" preset SHALL be pre-selected
- **AND** the resolved return date SHALL be 14 days from today

#### Scenario: Member borrows with custom date
- **WHEN** the member opens the borrow dialog and picks a date in the calendar
- **THEN** the selected date SHALL replace any preset selection
- **AND** confirming SHALL submit that exact date as `expected_return_date`

#### Scenario: Member cancels the dialog
- **WHEN** the member opens the borrow dialog and clicks Cancel or presses Escape
- **THEN** no loan SHALL be created
- **AND** the dialog SHALL close and focus SHALL return to the Borrow button

### Requirement: Loan domain carries an optional expected return date

The `Loan` domain entity SHALL include an optional `expected_return_date: date | None` field that is captured when a loan is created and exposed on `LoanResponse` and `ActiveLoanResponse`.

#### Scenario: Loan entity field
- **WHEN** the `Loan` frozen dataclass is inspected
- **THEN** it SHALL declare a field `expected_return_date: date | None`

#### Scenario: BorrowRequest accepts the field
- **WHEN** the API receives `POST /loans` with `{"game_id": <id>, "expected_return_date": "YYYY-MM-DD"}`
- **THEN** the loan SHALL be persisted with that date
- **AND** `LoanResponse` SHALL include `expected_return_date` as an ISO date string

#### Scenario: Field is optional and backwards-compatible
- **WHEN** the API receives `POST /loans` without an `expected_return_date`
- **THEN** the loan SHALL be persisted with `expected_return_date = NULL`
- **AND** existing loans created before this change SHALL continue to be readable, with `expected_return_date` rendered as `null` in API responses

### Requirement: Database migration for expected_return_date

The system SHALL ship a forward-only SQL migration that adds a nullable `expected_return_date` column to the `loans` table without altering existing rows. The column SHALL store dates as ISO `YYYY-MM-DD` strings in a `TEXT` column to match the existing date/datetime convention in this codebase (see `001_initial.sql`).

#### Scenario: Migration adds nullable TEXT column
- **WHEN** the migration runner applies the new migration on a database with existing loans
- **THEN** the `loans` table SHALL gain a nullable `expected_return_date TEXT` column
- **AND** all existing rows SHALL have `expected_return_date = NULL`
- **AND** no other columns SHALL be modified

### Requirement: MyLoansPage as cards with countdown

The system SHALL render `MyLoansPage` as a list of cards, one per active loan, each showing the game cover, title, borrow date, expected return date when present, and a countdown indicator (e.g. "vence en 3 días"); a Return button on each card opens a confirmation dialog and calls the existing return endpoint.

#### Scenario: Active loan card content
- **WHEN** an authenticated member opens `/prestamos/my-loans`
- **THEN** for each active loan a card SHALL render with the game cover, title, borrowed date, expected return date (if set), and a Return button

#### Scenario: Countdown indicator with due date
- **WHEN** a loan has an expected return date in the future
- **THEN** the card SHALL show a countdown such as "vence en N días" computed from today's date

#### Scenario: Countdown indicator without due date
- **WHEN** a loan has `expected_return_date = NULL`
- **THEN** the card SHALL not display any countdown indicator
- **AND** the card SHALL still show the borrowed date

#### Scenario: Past-due loan
- **WHEN** a loan's expected return date is before today
- **THEN** the card SHALL show "vencido" styled with the brand red as a non-blocking visual cue
- **AND** no automated reminder, email, or restriction SHALL be triggered (overdue is purely informational)

#### Scenario: Returning a game
- **WHEN** the member clicks Return on a loan card and confirms in the dialog
- **THEN** the system SHALL call the existing `PATCH /loans/{id}/return` endpoint
- **AND** on success the card SHALL be removed from the list

### Requirement: Empty state

The system SHALL show a friendly empty state on `MyLoansPage` when the member has no active loans, including a link to the catalog.

#### Scenario: Member with no loans
- **WHEN** an authenticated member with zero active loans opens `/prestamos/my-loans`
- **THEN** the page SHALL display a message such as "No tienes préstamos activos"
- **AND** SHALL render a link to the catalog labelled "Ver el catálogo"
