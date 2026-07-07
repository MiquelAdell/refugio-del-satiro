## Why

Borrowing today is a bare action with no due-date intent, and `MyLoansPage`
is a flat list. The TFM treats picking a return date as a core part of the
borrow gesture, and shows active loans as cards with a countdown
(`tasks/lending-redesign/style-guide.md` §5.10–5.11, §5.14, §8.1 Flow A/B). This
change implements the **`lending-borrow-return-flow`** capability
(`openspec/specs/lending-borrow-return-flow/spec.md`): a borrow dialog with
preset + calendar return-date selection, the supporting backend field, and a
rebuilt `MyLoansPage`.

Per archived-plan Decision **D1**, the return date is a **soft** target — no
reminders, no enforcement, no overdue blocking. We only capture member intent.

## What Changes

**Backend (Clean Architecture, all layers):**

- `Loan` entity (`backend/domain/entities/loan.py`) gains
  `expected_return_date: date | None`.
- `borrow_game` use case + the loan repository Protocol/SQLite impl accept and
  persist the new field.
- `POST /loans` `BorrowRequest` accepts optional `expected_return_date`
  (`YYYY-MM-DD`); `LoanResponse` and `ActiveLoanResponse` expose it as an ISO
  string (or `null`).
- New forward-only migration adds a **nullable `expected_return_date TEXT`**
  column to `loans` (ISO `YYYY-MM-DD`, matching the existing TEXT date convention
  — archived-plan finding **F2**). Existing rows get `NULL`.

**Frontend:**

- **Borrow dialog** opened by the `GameDetailPage` Borrow CTA (the hook point
  added by `lending-catalog-rebuild`): built on the `ui/Dialog` primitive with
  preset chips ("1 semana", "2 semanas", default **2 semanas** = today+14) and a
  calendar for custom dates. Confirm submits `expected_return_date`; Cancel/Escape
  creates no loan and returns focus to the opener.
- **Rebuild `MyLoansPage`** as cards: cover, title, borrowed date, expected
  return date (when set), and a countdown ("vence en N días" / "vencido" in brand
  red when past, purely informational). Return button → confirm dialog → existing
  `PATCH /loans/{id}/return`. Friendly empty state linking to the catalog.

## Goals

- Capture an optional return date at borrow time and surface it as a non-blocking
  countdown, with zero new external services and full backwards compatibility.
- Reuse the existing return endpoint untouched.

## Non-Goals

- Reminders, emails, overdue enforcement, reservation/waitlist states (explicit
  project non-goals — the date is soft).
- The catalog/detail rebuild (sibling change `lending-catalog-rebuild`).
- A reusable date-picker primitive for the whole app — scope the picker to the
  borrow dialog; promote to `ui/` only if a second consumer appears.

## User Impact

- Borrowing becomes a two-tap gesture (preset → confirm) with an optional custom
  date. Members see at a glance when each game is due back. Nothing breaks if a
  date passes.

## Compatibility

- **Public interface change** — `POST /loans` request grows an **optional** field;
  `LoanResponse`/`ActiveLoanResponse` grow `expected_return_date`. Old callers and
  old rows (NULL) keep working; clients that ignore the field are unaffected.
- Backend + frontend ship together so the dialog and the field land in one PR.

## Rollback

Standalone PR on `development`; revert the merge commit. The migration is
reversible by dropping the nullable column — no data depends on its presence
(NULL = "no countdown").
