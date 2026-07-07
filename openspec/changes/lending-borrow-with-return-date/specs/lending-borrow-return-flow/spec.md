# Spec delta — lending-borrow-return-flow

> This change **implements** the `lending-borrow-return-flow` capability against
> the live codebase (which currently has no return-date concept). The full
> requirements — borrow dialog with presets + calendar, `expected_return_date` on
> the `Loan` entity / `BorrowRequest` / `LoanResponse` / `ActiveLoanResponse`, the
> nullable `TEXT` migration, and `MyLoansPage` cards with countdown — live in
> `openspec/specs/lending-borrow-return-flow/spec.md`. Implement those as written.
> The delta below records the one implementation-time decision (DQ-4). Keep lean.

## ADDED Requirements

### Requirement: Calendar club-closed-day handling is conditional

The borrow dialog's calendar SHALL disable non-club-open days when club-open-day
data is available to the frontend; when it is not, the calendar SHALL allow any
date and the disabled-day behaviour SHALL be deferred (resolves DQ-4). The return
date remains soft in all cases — selecting it triggers no reminder or enforcement.

#### Scenario: Open-days data available
- **WHEN** club-open-day data is available and the member opens the calendar
- **THEN** club-closed days SHALL render pale grey and SHALL NOT be selectable

#### Scenario: Open-days data not available
- **WHEN** no club-open-day data is exposed to the frontend
- **THEN** the calendar SHALL allow selecting any date
- **AND** the disabled-day refinement SHALL be recorded as deferred (not a regression)
