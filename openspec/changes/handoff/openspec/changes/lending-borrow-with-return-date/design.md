## Context

This is the only redesign change that crosses the backend. The backend is
Clean Architecture with strict layering (`backend/domain` → `backend/data` →
`backend/api`); dates are stored as **ISO strings in `TEXT` columns**
(`borrowed_at`, `returned_at`, etc. in `001_initial.sql`) — the new column
follows that convention (finding **F2**), not SQLite-native `DATE`.

The frontend borrow dialog attaches to the Borrow CTA hook point
(`onBorrow(gameId)`) added on `GameDetailPage` by `lending-catalog-rebuild`.
This change supplies the actual handler. If `lending-catalog-rebuild` has not
landed yet, the dialog can also be triggered from the existing catalog borrow
control during transition.

Visual reference: style-guide §5.10–5.11 (modal), §5.14 (date picker — disabled
non-club days rendered pale grey and unselectable), §8.1 Flow A/B.

## Data flow through the layers

```
                       ┌──────────────── frontend ────────────────┐
Borrow CTA ─► BorrowDialog (ui/Dialog) ─► POST /loans {game_id, expected_return_date}
                       └───────────────────────────────────────────┘
                                          │
┌──────────────────────────── backend ───┼────────────────────────────────────┐
│ api/routes/loans.py                     ▼                                     │
│   BorrowRequest{game_id, expected_return_date?: str}                          │
│        │ parse YYYY-MM-DD → date|None                                         │
│        ▼                                                                      │
│ domain/use_cases/borrow_game.py  borrow_game(member, game, expected_return_date?)│
│        ▼                                                                      │
│ domain/repositories/loan.py (Protocol)  +  data/repositories/loan.py (SQLite) │
│        ▼                                                                      │
│ Loan(expected_return_date: date | None)  ──► loans.expected_return_date TEXT  │
│        ▲                                                                      │
│ LoanResponse / ActiveLoanResponse expose ISO string | null                    │
└───────────────────────────────────────────────────────────────────────────────┘

GET /my-loans ─ useMyLoans() ─► MyLoansPage ─► LoanCard[] (countdown from today)
Return ─► confirm Dialog ─► PATCH /loans/{id}/return  (UNCHANGED)
```

## Backend specifics

- **Migration** `backend/migrations/00X_loan_expected_return_date.sql`:
  `ALTER TABLE loans ADD COLUMN expected_return_date TEXT;` (nullable; no
  backfill). Bump the migration runner's version sequence.
- **Entity**: frozen dataclass field `expected_return_date: date | None = None`.
- **Use case**: `borrow_game` takes an optional `expected_return_date`; no
  validation beyond "is a valid date" — the date is soft, future-or-past allowed.
- **Serialization**: store/read as ISO `YYYY-MM-DD`; `None` ⇄ SQL `NULL` ⇄ JSON
  `null`.

## Frontend specifics

- **BorrowDialog**: preset chips compute dates client-side (today+7, today+14);
  default selection **2 semanas**. Calendar picks a custom date and clears the
  preset highlight. The "disabled club-closed days" behaviour (style-guide §5.14)
  is a **nice-to-have** — implement only if club-open-days data is available;
  otherwise allow any future date and note it as deferred. Dialog traps focus,
  closes on Escape, restores focus to the Borrow button.
- **MyLoansPage / LoanCard**: countdown computed from `today` vs
  `expected_return_date`; `NULL` → no countdown (still shows borrowed date);
  past-due → "vencido" in brand red, no side effects. Empty state: "No tienes
  préstamos activos" + "Ver el catálogo" link.

## Known constraints / decisions

- Preset values & default are fixed by the canonical spec (1/2 semanas, default 2).
- Club-closed-day disabling depends on data the API may not expose yet — see
  `handoff/DECISIONS_NEEDED.md` DQ-4.
- No reservation/intermediate state — the system is direct borrow → return (the
  TFM's "Reservado/Alquilado" two-step is **not** in v1 scope; see DQ-5).

## Testing strategy

- **Domain** (pytest, in-memory fake repo): `borrow_game` persists the date;
  omitted date → `None`.
- **Data** (pytest, SQLite `:memory:`): migration adds the nullable column;
  round-trip ISO string ⇄ `date`; existing rows read back `None`.
- **API** (TestClient): `POST /loans` with and without the field; `LoanResponse`
  / `ActiveLoanResponse` include `expected_return_date`.
- **Frontend** (Vitest + RTL): default preset = today+14; custom date overrides
  preset; Cancel/Escape creates no loan; countdown future vs past vs null; empty
  state.
- **E2E** (Playwright): borrow with default → appears in My Loans with countdown →
  return removes it.
