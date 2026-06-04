# Lending UX move + borrower-name privacy

## Goals

- Move borrow / return actions out of the catalog list and into the game detail page, matching the TFM Figma proto where the catalog is a browse surface and the lending interaction lives on the detail screen.
- Prevent anonymous (logged-out) visitors from seeing **who** has a game lent to them. Anonymous users may only see whether a game is available or not.
- Keep the borrower's name visible to authenticated members on the game detail page so they know who to contact.

## Non-goals

- Changing the borrow / return endpoints themselves (`POST /api/loans`, `PATCH /api/loans/{id}/return`).
- Reservations, due dates, or notifications — still excluded per project non-goals.
- Hiding borrower identity from authenticated members. The privacy boundary is anonymous vs. authenticated, not member vs. member.

## User impact

- **Anonymous visitors** lose the borrower name everywhere (today they see it on the catalog and on the detail page). They keep the available / lent status signal so they can still decide whether to come pick a game up.
- **Authenticated members** can no longer borrow or return from the catalog list — they must open the game's detail page first. This is one extra click but produces a single primary CTA per screen, which the Figma indicates is the intended flow. Borrower names remain visible to them on the detail page.
- **Catalog cards** become quieter: thumbnail, name, year, players, time, rating, and a status badge. No buttons, no names.

## Compatibility

- API response shape is unchanged. `borrower_display_name` and `loan_id` on `/api/juegos` and `/api/juegos/{slug}`, plus `member_display_name` on `/api/juegos/{slug}/history`, become `null` for anonymous responses but the fields themselves remain present.
- The frontend already treats `borrower_display_name` and `loan_id` as nullable (`string | null`, `number | null`) in `frontend/src/types/game.ts`, so existing clients deserialize without changes.
- `member_display_name` on history entries flips from `string` to `string | null`. Frontend type and rendering adapt; no third-party consumers are known.

## Rollback plan

- Code is reversible by reverting the merge commit. No DB schema changes, no migrations, no irreversible data modifications.
- If the privacy enforcement is found to break a downstream consumer, the backend filter can be toggled off in `backend/api/routes/games.py` independently from the frontend changes — both layers degrade gracefully (backend always returns the field, frontend renders the no-name fallback when null).
