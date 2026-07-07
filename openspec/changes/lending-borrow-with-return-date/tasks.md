# Tasks — lending-borrow-with-return-date (Phase B4 + C1)

Branch from `development` as `feature/lending-borrow-with-return-date`.
Conventional Commits. Backend + frontend land together. Definition of Done:
specs updated, code matches specs, tests pass, lint + typecheck clean.

## 1. Database

- [ ] 1.1 [DB] Add `backend/migrations/00X_loan_expected_return_date.sql`: `ALTER TABLE loans ADD COLUMN expected_return_date TEXT;` (nullable, no backfill). Register it with the migration runner's version sequence.
- [ ] 1.2 [DB] Data-layer test (SQLite `:memory:`): migration adds the nullable column, existing rows read back `NULL`, no other column altered.

## 2. Domain

- [ ] 2.1 [BE] Add `expected_return_date: date | None = None` to the `Loan` frozen dataclass (`domain/entities/loan.py`).
- [ ] 2.2 [BE] Thread the optional date through `borrow_game` (`domain/use_cases/`) and the loan repository **Protocol** (`domain/repositories/loan.py`).
- [ ] 2.3 [BE] Unit test (in-memory fake repo): borrow with a date persists it; borrow without → `None`.

## 3. Data layer

- [ ] 3.1 [BE] Update the SQLite loan repository (`data/repositories/loan.py`) to write/read `expected_return_date` as ISO `YYYY-MM-DD` ⇄ `date | None`.
- [ ] 3.2 [BE] Integration test: round-trip a loan with and without a date.

## 4. API layer

- [ ] 4.1 [BE] `BorrowRequest` (`api/routes/loans.py`) accepts optional `expected_return_date: str` parsed to `date | None`.
- [ ] 4.2 [BE] Add `expected_return_date` (ISO string | null) to `LoanResponse` and to `ActiveLoanResponse` (`api/routes/members.py`).
- [ ] 4.3 [BE] API tests (TestClient): `POST /loans` with the field persists & echoes it; without the field → `null`; `GET /my-loans` exposes it.

## 5. Borrow dialog (frontend)

- [ ] 5.1 [FE] Build `BorrowDialog` on `ui/Dialog`: preset chips "1 semana"/"2 semanas" (default 2 = today+14) + calendar for custom dates; confirm submits `expected_return_date`.
- [ ] 5.2 [FE] Provide the `onBorrow(gameId)` handler consumed by `GameDetailPage` (and the catalog borrow control during transition); on success refresh `useMyLoans`.
- [ ] 5.3 [FE] Focus trap, Escape-to-close, focus restore to opener; Cancel/Escape creates no loan.
- [ ] 5.4 [FE] (Optional, DQ-4) Disable club-closed days in the calendar if open-days data is available; else allow any future date and record the deferral.
- [ ] 5.5 [FE] Vitest: default preset = today+14; custom date overrides preset; Cancel/Escape → no `POST`.

## 6. MyLoansPage rebuild (frontend)

- [ ] 6.1 [FE] Rebuild `pages/MyLoansPage.tsx` + `.css` as `LoanCard` list: cover, title, borrowed date, expected return date (if set), countdown indicator.
- [ ] 6.2 [FE] Countdown: future → "vence en N días"; null → none; past → "vencido" in brand red (informational only — no reminder/restriction).
- [ ] 6.3 [FE] Return button → confirm `Dialog` → existing `PATCH /loans/{id}/return`; remove card on success.
- [ ] 6.4 [FE] Empty state: "No tienes préstamos activos" + "Ver el catálogo" link.
- [ ] 6.5 [FE] Vitest: card content with/without date; countdown future/past/null; empty state renders link.

## 7. End-to-end & specs

- [ ] 7.1 [FE] Playwright: borrow with default preset → game appears in My Loans with a countdown → return removes it.
- [ ] 7.2 [CR] Update `specs/lending-borrow-return-flow/spec.md` (the delta in this folder) if implementation refines any scenario; record the DQ-4/DQ-5 outcomes.
- [ ] 7.3 [CR] `openspec validate lending-borrow-with-return-date` → no errors; run pytest (+cov), frontend lint + typecheck + test.
