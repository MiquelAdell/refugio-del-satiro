# Lending capability

## Borrower-name visibility

- **GET /api/juegos**, anonymous request: every entry has `borrower_display_name = null` and `loan_id = null`, regardless of whether the game is currently lent. The `status` field still reflects reality (`"available"` or `"lent"`).
- **GET /api/juegos**, authenticated request: each lent game returns the real borrower's `borrower_display_name` and the real `loan_id`. Available games return `null` for both.
- **GET /api/juegos/{slug}**, anonymous request: returns `borrower_display_name = null` and `loan_id = null`. Authenticated request returns the real values.
- **GET /api/juegos/{slug}/history**, anonymous request: every entry returns `member_display_name = null`. Dates remain.
- **GET /api/juegos/{slug}/history**, authenticated request: every entry returns the real `member_display_name`.

The privacy rule is enforced server-side. Client code must not be the only thing that hides borrower identity.

## Catalog list UI

- The catalog list shows a status badge per card: "Disponible" when available, "Prestado" when lent.
- The catalog list never displays the borrower's name, regardless of who is viewing it. Borrower identity is reserved for the game detail screen.
- The catalog cards do not expose borrow or return action buttons. The card is a navigation surface only; clicking it opens the detail page at `/juegos/{slug}`.

## Game detail UI

- When the game is available and the viewer is an authenticated member, the detail page shows a primary "Tomar prestado" CTA that triggers `POST /api/loans` after a confirmation dialog.
- When the game is lent and the viewer is either the borrower or an admin, the detail page shows a "Devolver" CTA that triggers `PATCH /api/loans/{loan_id}/return` after a confirmation dialog.
- When the game is lent and the API returned a non-null `borrower_display_name`, the detail page shows "Prestado a {name}". Otherwise it falls back to "Prestado".
- After a successful borrow or return, the detail page refreshes its data without a full page reload.

## Loan history UI

- The detail page renders the loan history. When a history entry's `member_display_name` is null (anonymous viewer), the entry shows a generic placeholder ("Socio"). Dates are always shown.
