# lending-borrow-return-flow Specification

## Purpose
TBD - created by archiving change plan-lending-redesign. Update Purpose after archive.
## Requirements
### Requirement: Borrow confirmation

The system SHALL ask an authenticated member to confirm before borrowing an
available board game or RPG book. Loans SHALL not have a return deadline.

#### Scenario: Member confirms a loan
- **WHEN** an authenticated member clicks the borrow action on an available item
- **THEN** a confirmation dialog SHALL open
- **AND** confirming SHALL create the loan

#### Scenario: Member cancels the dialog
- **WHEN** the member opens the borrow dialog and clicks Cancel or presses Escape
- **THEN** no loan SHALL be created
- **AND** the dialog SHALL close and focus SHALL return to the Borrow button

### Requirement: Loan timestamps

The system SHALL store when each loan is created and, once returned, when it
was returned. Loan API responses SHALL expose both timestamps.

#### Scenario: Active loan timestamps
- **WHEN** a loan is created
- **THEN** `borrowed_at` SHALL contain its creation timestamp
- **AND** `returned_at` SHALL be null

#### Scenario: Returned loan timestamp
- **WHEN** a loan is returned successfully
- **THEN** `returned_at` SHALL contain the return timestamp

### Requirement: MyLoansPage as cards

The system SHALL render `MyLoansPage` as a list of cards, one per active loan,
showing the game cover, title, borrow date, and a Return button. The cover and
title SHALL link to the correct board-game or RPG detail page. The Return button
SHALL open a confirmation dialog and call the existing return endpoint.

#### Scenario: Active loan card content
- **WHEN** an authenticated member opens `/ludoteca/my-loans`
- **THEN** each active loan SHALL render as a card with the game cover, title, borrowed date, and a Return button
- **AND** the cover and title SHALL link to that item's detail page

#### Scenario: Loan reaches 30 complete days
- **GIVEN** an active loan has been open for at least 30 complete elapsed days
- **WHEN** the member opens `/ludoteca/my-loans`
- **THEN** the loan card SHALL show an informational marker
- **AND** the marker SHALL NOT set a return deadline or restrict the loan

#### Scenario: Returning a game
- **WHEN** the member clicks Return on a loan card and confirms in the dialog
- **THEN** the system SHALL call the existing `PATCH /loans/{id}/return` endpoint
- **AND** on success the card SHALL be removed from the list

### Requirement: Empty state

The system SHALL show a friendly empty state on `MyLoansPage` when the member has no active loans.

#### Scenario: Member with no loans
- **WHEN** an authenticated member with zero active loans opens `/ludoteca/my-loans`
- **THEN** the page SHALL display `No tienes ningún juego en préstamo.`

### Requirement: Responsible-use feedback after borrowing

The system SHALL display an accessible status message after a board game or RPG
book is borrowed successfully, explaining that the loan has no deadline and
asking the member to return it after playing or when they no longer plan to use
it.

#### Scenario: Successful borrow
- **WHEN** an authenticated member successfully borrows an available board game or RPG book
- **THEN** the detail page SHALL expose the responsible-use guidance through a polite live status

#### Scenario: Member reviews active loans
- **WHEN** an authenticated member opens `/ludoteca/my-loans`
- **THEN** the page SHALL explain that loans have no deadline
- **AND** it SHALL ask the member to return items responsibly

### Requirement: Return wording reflects who owns the loan

The detail page SHALL label a member returning their own loan `Devolver`. When
an administrator returns another member's loan, both the action and its
confirmation SHALL be labelled `Forzar devolución`. A non-administrator who is
not the borrower SHALL not receive either action.

#### Scenario: Borrower returns their own loan
- **WHEN** the current member is the borrower, including when that member is an administrator
- **THEN** the return action and confirmation SHALL be labelled `Devolver`

#### Scenario: Administrator returns another member's loan
- **WHEN** an administrator views a board game or RPG book borrowed by another member
- **THEN** the return action and confirmation SHALL be labelled `Forzar devolución`

#### Scenario: Unauthorised member views another member's loan
- **WHEN** a non-administrator views a board game or RPG book borrowed by another member
- **THEN** neither `Devolver` nor `Forzar devolución` SHALL be available

### Requirement: Forced-return notification is best effort

After an administrator returns another member's loan, the system SHALL try to
email the borrower. The return SHALL remain registered whether the email is
sent or fails. The detail page SHALL tell the administrator which outcome
occurred.

#### Scenario: Borrower email is sent
- **WHEN** an administrator successfully forces the return of another member's loan
- **AND** the borrower email is sent
- **THEN** the loan SHALL remain returned
- **AND** the detail page SHALL confirm that the borrower was notified

#### Scenario: Borrower email cannot be sent
- **WHEN** an administrator successfully forces the return of another member's loan
- **AND** the borrower email is unavailable or cannot be sent
- **THEN** the loan SHALL remain returned
- **AND** the detail page SHALL warn that the notification failed

#### Scenario: Member returns their own loan
- **WHEN** a member returns their own loan
- **THEN** the system SHALL NOT send a forced-return email
