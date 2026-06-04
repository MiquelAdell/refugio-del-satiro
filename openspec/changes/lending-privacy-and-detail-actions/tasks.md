# Tasks

## Backend

- [x] [BE] Inject `OptionalMember` into `list_games`, `get_game`, and `get_game_history` route handlers (`backend/api/routes/games.py`).
- [x] [BE] When the request is unauthenticated, force `borrower_display_name=None` and `loan_id=None` on every `GameResponse`.
- [x] [BE] Change `LoanHistoryEntryResponse.member_display_name` to `str | None`. When the request is unauthenticated, set it to `None` for every entry.
- [x] [BE] Add API tests covering anonymous vs authenticated responses for `/api/juegos`, `/api/juegos/{slug}`, and `/api/juegos/{slug}/history`, asserting concrete values for the privacy-sensitive fields.

## Frontend

- [x] [FE] Strip lending state, handlers, and buttons from `frontend/src/components/GameCard.tsx`. Remove the `onAction` prop. Replace the borrower-name status text with a name-less "Prestado" badge.
- [x] [FE] Drop the `onAction` prop from `<GameCard>` consumers (`frontend/src/pages/CatalogPage.tsx`); remove the post-action refetch wiring tied to it.
- [x] [FE] Refactor `frontend/src/hooks/useGameHistory.ts` to expose a `refetch` function alongside `{ game, history, loading, error }`.
- [x] [FE] In `frontend/src/pages/GameDetailPage.tsx`, lift the borrow / return logic from the old GameCard. Render a primary CTA in the header that fires the relevant action through a `ConfirmDialog` and calls `refetch` on success. When the API returned `borrower_display_name = null`, show the no-name "Prestado" badge.
- [x] [FE] Update `frontend/src/types/loan.ts` so `LoanHistoryEntry.member_display_name` is `string | null`. Update `frontend/src/components/LoanHistoryEntry.tsx` to render "Socio" when null.
- [x] [FE] Remove the now-unused `.game-card-actions` CSS rules in `frontend/src/components/GameCard.css`.
- [x] [FE] Add `test` and `typecheck` scripts to `frontend/package.json`.

## Tests

- [x] [FE] Add GameCard tests: assert no buttons rendered, no borrower name in any state, status badge shows the no-name copy when lent, link uses the slug-based URL.
- [x] [FE] Add GameDetailPage tests: borrow CTA shown only when status is `available` and a member is logged in; return CTA shown only to the borrower or an admin; confirm flow calls the API and triggers a refetch; when `borrower_display_name` is null the page shows the no-name fallback.

## Specs

- [ ] [BE/FE] After implementation, archive this change folder into `openspec/specs/lending/` per the openspec-archive-change flow.
