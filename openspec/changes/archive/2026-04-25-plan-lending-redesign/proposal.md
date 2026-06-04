## Why

The current lending app at `/prestamos` was built standalone with a utilitarian look (Tailwind-blue `#2563eb`, system fonts) that does not match the rest of the club site (`refugiodelsatiro.es` — Oswald headings, Open Sans body, `#BE0000` primary red). As we merge the lending section into the main club site, we have a high-fidelity TFM (Ariadna Ortega Rams, UOC 2024) that defines a polished, brand-aligned UX for the same flow. We adopt that look-and-flow but tuned to the club's existing typography and color so the lending section reads as part of one product, not two.

This change is the **planning artifact** for the v1 redesign: it captures scope, target user flows, and a phased work breakdown. Implementation will land in follow-up changes that reference the specs created here.

## What Changes

- **Replace design tokens** in `frontend/src/tokens.css` with the TFM/club palette (`#BE0000` primary red, `#1F1F1F` headings, `#333333` body, neutral surfaces) and self-hosted Oswald + Open Sans font stack. **BREAKING** for any inline `#2563eb` references in component CSS.
- **Extract shared UI primitives** to `frontend/src/ui/`: `<Button>`, `<Input>`, `<Select>`, `<Chip>`, `<Badge>`, `<Card>`, `<Dialog>`. Replace ad-hoc `.btn` usage and inline form styles across pages. Add a `<PageLayout>` matching the club site shell.
- **Rebuild the catalog**: cover-first `<GameCard>` with availability/rating overlay badges; `CatalogPage` filters in a side panel + chip row; replace the custom dual-slider with an accessible primitive (Radix / Reach UI).
- **Rebuild game detail** (`GameDetailPage`) with a prominent Borrow CTA, optional tabs (Info / History), and the existing loan history table.
- **Add a borrow date dialog**: when borrowing, the member picks a return date via calendar + preset chips (1 week / 2 weeks). The existing `POST /loans` endpoint accepts a new `expected_return_date` field; existing data without the field continues to work.
- **Rebuild `MyLoansPage`** as cards with a countdown to due date; reuse the existing return endpoint.
- **Restyle `AdminMembersPage`** to the new design system (structure unchanged — low risk).
- **Defer to v1.5 / v2** (out of scope for this plan): toast/feedback system, loading skeletons, mobile pass, a11y pass, notify-me wishlist, request-new-game, admin home dashboard, admin BGG sync UI, community page, events management, badges, RPG books. Each is called out in `tasks.md` as deliberately deferred.

## Capabilities

### New Capabilities

- `lending-design-system`: Shared design tokens (TFM/club palette + Oswald/Open Sans), primitive UI components, and `<PageLayout>` shell. Foundation for every other lending screen.
- `lending-catalog-redesign`: Visual and interaction rebuild of catalog browsing — cover-first cards, side-panel filters with chip row, accessible dual slider, redesigned game detail with prominent Borrow CTA.
- `lending-borrow-return-flow`: Member-facing borrow flow with return-date selection (calendar + preset chips), and `MyLoansPage` rebuilt as cards with countdown to due date. Backed by an extension to `POST /loans` accepting `expected_return_date`.
- `lending-admin-members-restyle`: `AdminMembersPage` restyled to the new design system, structure and endpoints unchanged.

### Modified Capabilities

(none — `openspec/specs/` is currently empty; this change introduces the first specs for the lending UI layer)

## Impact

- **Frontend**: New `frontend/src/ui/` primitives directory; rewritten `tokens.css`; rebuilt `CatalogPage`, `GameCard`, `GameDetailPage`, `MyLoansPage`; restyled `AdminMembersPage`; new self-hosted fonts under `frontend/public/fonts/`. The current i18n scaffolding is dropped per resolved decision (Spanish only).
- **Backend**: `POST /loans` (BorrowRequest) accepts an optional `expected_return_date`; the `Loan` entity and SQLite schema gain a nullable `expected_return_date` column via a new migration. `LoanResponse` and `ActiveLoanResponse` expose the field. No changes to the existing return flow.
- **Dependencies**: Add an accessible slider primitive (Radix UI or Reach UI) to replace the custom dual-slider; self-hosted Oswald + Open Sans font files under `frontend/public/fonts/` (no Google Fonts hot-link, GDPR).
- **Data**: New migration `00X_loan_expected_return_date.sql` adding the nullable column; existing rows remain valid (NULL = no due date, treated as "no countdown").
- **Out of scope (deferred)**: Notify-me wishlist, request-new-game, admin home dashboard, BGG sync UI, community page, events, badges, RPG books, polish phases (toasts/skeletons/a11y/mobile passes), i18n.
- **Open questions** (tracked in `tasks/lending-redesign/plan-lending-redesign.md` §Open questions): L1 reservation states, L2 wishlist persistence, L3 request moderation, L4 admin events vs announcements, L5 BGG sync cadence, L6 mobile-first confirmation, L7 WCAG target, L9 Figma access, L10 illustration assets. None block v1 as scoped above; they gate later phases.
