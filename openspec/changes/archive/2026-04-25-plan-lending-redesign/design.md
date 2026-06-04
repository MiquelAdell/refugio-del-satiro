## Context

The lending app at `/prestamos` is a working React + FastAPI SPA (catalog, borrow, return, my-loans, admin members) styled with a utilitarian Tailwind-blue token palette and system fonts. The wider club site (`refugiodelsatiro.es`) uses Oswald headings, Open Sans body, and a `#BE0000` brand red. A UOC TFM (Ariadna Ortega Rams, June 2024) produced a high-fidelity redesign of the same lending flow with a polished editorial look that already adopts the club's typography and color. Working files referenced throughout:

- `tasks/lending-redesign/plan-lending-redesign.md` — running plan, scope triage, open questions.
- `tasks/lending-redesign/style-guide.md` — distilled visual + interaction reference (~990 lines).
- `tasks/lending-redesign/current-state.md` — inventory of existing pages, components, routes, endpoints.
- `tasks/lending-redesign/decisions.md` — decision log driving scope cuts.
- `tasks/lending-redesign/mockups/` — 11 exported PNGs from the TFM.
- `references/aortegarams_R4.pdf`, `references/Presentació TFM.pdf`.
- Figma prototype (public, viewable, starting node included): https://www.figma.com/proto/75YAWEkSnwNWAbB0jJARnZ/TFM---Servei-de-pr%C3%A9stec-digital?page-id=810%3A21946&node-id=810-21986&starting-point-node-id=810%3A21986&show-proto-sidebar=1 — use this for any hover/animation/transition state the PDFs don't make obvious.

This change is a **planning artifact**: it freezes scope, target user flows, and a phased work breakdown so that follow-up changes (one per phase) can implement against stable specs. Implementation does not happen in this change.

## Goals / Non-Goals

**Goals:**
- Adopt the TFM look-and-flow tuned to the club's existing typography (`Oswald`, `Open Sans`) and color (`#BE0000`).
- Land a v1 that is feature-parity with today plus the visual rebuild: catalog, game detail, borrow with return date, return from "my loans", admin members restyle.
- Establish a small, reusable UI primitives layer (`frontend/src/ui/`) so subsequent screens stop reinventing buttons, inputs, and dialogs.
- Self-host fonts (no Google Fonts hot-link) for GDPR posture.
- Replace the custom dual-slider with an accessible primitive.
- Keep the existing SQLite-only persistence model and Clean Architecture layering — no new data store, no new external service.

**Non-Goals:**
- Notify-me wishlist, request-new-game, admin home dashboard, admin BGG sync UI, community page, events management, badge/insignia system, RPG books catalog. All deliberately deferred to v2 mini-projects.
- Toast system, loading skeletons, global error boundary, mobile pass, a11y pass — deferred to v1.5 polish phase, tracked but not in v1 scope.
- i18n. Decision 2 (resolved 2026-04-21): Spanish only. Existing CA/EN scaffolding will be removed.
- Reservation / waitlist / overdue enforcement. Even though we add an `expected_return_date`, it is a soft target (no reminders, no blocking, no enforcement). See Decision 1 below.
- New auth model. Existing JWT cookie + bcrypt + member validation stays.

## Decisions

### D1. Add `expected_return_date` to the loan domain (overriding the original non-goal)

**Decision:** The `Loan` entity gains an optional `expected_return_date: date | None`. The borrow dialog asks the member to pick one (calendar + preset chips for "1 week" and "2 weeks"). `MyLoansPage` shows a countdown to that date.

**Why over the alternative ("don't add due dates at all"):** The TFM treats return-date selection as a core part of the borrow gesture — without it the dialog becomes a one-button confirmation and we lose the editorial feeling of the new flow. The cost is small: one nullable column, one new field on `BorrowRequest`/`LoanResponse`, no enforcement logic. The project's stated non-goal ("no due dates, no overdue tracking, no reminders") is preserved in spirit because (a) the field is **soft** — nothing fails if it passes, (b) there are no reminders, (c) overdue tracking is not introduced. We are only capturing user intent.

**Migration:** New SQL migration adding the nullable column. Existing loans get NULL, treated by the UI as "no countdown" (renders neutrally without a due-date pill).

### D2. UI primitives in `frontend/src/ui/`, plain CSS Modules — no component framework

**Decision:** Create `<Button>`, `<Input>`, `<Select>`, `<Chip>`, `<Badge>`, `<Card>`, `<Dialog>` as small, styled-with-CSS-Modules components under `frontend/src/ui/`. No Tailwind, no styled-components, no Material/Chakra/MUI.

**Why over the alternatives:**
- Tailwind utility classes would compete with the existing CSS Modules approach and bloat HTML.
- A full component framework (MUI, Chakra) brings ~150–300 KB of JS for a club app with ~100 members and ~200 games. Lifetime maintenance is heavier than the wins.
- The project's documented non-goal explicitly forbids "CSS-in-JS or UI component framework". This decision aligns with that.

**Trade-off:** We hand-roll a date picker and a dual-slider. Mitigation: use **Radix UI primitives** (unstyled, accessible) for the slider and the dialog focus management — they ship as headless logic only, not as a UI framework. This is a narrow, surgical dependency.

### D3. Self-host Oswald + Open Sans

**Decision:** Download Oswald and Open Sans from Google Fonts as static files, ship under `frontend/public/fonts/`, declare with `@font-face` in `tokens.css`. No `<link>` to fonts.googleapis.com.

**Why:** GDPR — hot-linking Google Fonts leaks visitor IPs to Google. The TFM was built for an `iframe`-embedded PythonAnywhere context; we are running on our own VPS where this is easy to do right.

**Trade-off:** ~150 KB extra in the bundle. Acceptable; we serve from Caddy with long-cache headers.

### D4. Routing — keep `/prestamos`, expose `/ludoteca` as a public read-only alias

**Decision** (already resolved in `plan-replicate-existing-site.md`, restated here): the lending React app remains mounted at `/prestamos` for the authenticated/private flow. The catalog component is **also** rendered at `/ludoteca` for guests, in a read-only variant (no Borrow CTA — Login link instead). Same React app, two basenames + a guest-mode flag.

**Why:** the existing club site already has a `/ludoteca` URL that members find via Google. We preserve discoverability. We keep `/prestamos` because internal docs, bookmarks, and admin habits all point there.

### D5. Phased delivery, each phase is its own follow-up change

**Decision:** This change does not produce code. Implementation lands in follow-up changes scoped to one phase each:

- `lending-design-tokens-and-primitives` (Phase A1–A3)
- `lending-catalog-rebuild` (Phase B1–B3)
- `lending-borrow-with-return-date` (Phase B4 + C1)
- `lending-admin-members-restyle` (Phase D1)

The v1.5 polish phases (E, F) are tracked in `tasks/lending-redesign/plan-lending-redesign.md` and proposed as one or two more changes once v1 is live.

**Why:** the TFM has ~24 screens; a single mega-PR would block on review and lose context. PR-sized phases let us merge incrementally behind feature flags or per-route swaps.

### D6. Drop the existing CA/EN i18n scaffolding

**Decision:** Resolved 2026-04-21 — Spanish only. The current `LanguageSelector`, translation files, and i18n hooks come out as part of Phase A.

**Why:** The TFM mockups are Spanish-only. Members are Spanish/Catalan bilingual but use Spanish in club contexts. Maintaining three locales for a club app is overhead with no measured benefit. Reintroducing later is cheap if member demand materialises.

### D7. Member validation source of truth

**Decision** (already resolved 2026-04-21, restated): the lending app's SQLite database is the source of truth for member validation. The Drive spreadsheet is imported once via the existing `refugio import-members` CLI; afterwards the spreadsheet is read-only history.

**Why:** unifying on SQLite means borrow/return logic, admin actions, and member queries all live in one transactional store. The previous "spreadsheet as truth" model required a network round-trip per validation and was fragile.

### D8. Mobile-first for v1 catalog and borrow flow

**Decision** (resolved 2026-04-25): Phase B builds against narrow viewports first (≤ 480 px), then layers up to tablet and desktop. The catalog filter UI defaults to a bottom-sheet / drawer affordance on mobile and a fixed side panel on desktop (≥ 1024 px). Borrow date dialog renders as a bottom sheet on mobile and a centered modal on desktop.

**Why:** members mostly interact with the lending app from their phones at the club (consistent with the TFM's persona research and the post-pandemic mobile-skew across club traffic). A desktop-first build would require a re-pass for what is the primary medium.

### D9. Accessibility baseline: WCAG 2.1 AA

**Decision** (resolved 2026-04-25): every v1 screen targets WCAG 2.1 Level AA. Concretely this means:

- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and non-text UI components.
- Keyboard reachability for every interactive control (no mouse-only affordances).
- Visible focus indicators on every focusable element.
- Form inputs paired with explicit `<label>` elements (or `aria-labelledby`).
- Status changes (borrow success, return success, errors) announced via `aria-live` regions.
- The player-range slider (Decision D2 / Radix) exposes valid `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`.
- The dialog primitive (Decision D2 / Radix) traps focus, is dismissable with Escape, and returns focus to the opener on close.

**Why over AAA:** AAA contrast (7:1) and other AAA criteria are disproportionate for a club app and would force significant brand-color compromises on `#BE0000`. AA is the de-facto standard for non-government EU sites and matches what auditing tools (axe-core, Lighthouse) target by default. Lighthouse a11y ≥ 90 (Exit criterion in `tasks/lending-redesign/plan-lending-redesign.md`) maps cleanly to AA.

### D10. v1 illustrations: reuse only

**Decision** (resolved 2026-04-25): no new illustration work for v1. Where the TFM mockups show the Flaticon-sourced admin tile illustrations or other decorative imagery, v1 either reuses the same assets if they are still available under the original Flaticon license or omits the decoration. No commissioned art, no AI generation, no asset hunt. Illustrations re-enter scope only if a v2 plan calls for them.

**Why:** the v1 scope is feature-parity + visual rebuild — illustrations are nice-to-have, not load-bearing. Solo-dev cycle time is the limiting factor.

## Risks / Trade-offs

- **Scope creep on the TFM** → keep the v1.5 / v2 list visible in `tasks.md` and refuse to pull items forward without explicit approval. The plan document at `tasks/lending-redesign/plan-lending-redesign.md` is the canonical scope record.
- **Token drift (two palettes side-by-side during Phase A → B transition)** → A1 is a hard cutover. We replace `tokens.css` in one PR; any component still referencing old `#2563eb` hex codes is updated in the same PR or fixed as a Boy Scout edit in Phase B.
- **Custom dialogs/sliders are an a11y minefield** → use Radix UI primitives for the dual slider and the dialog (focus trap + escape + portal). Document keyboard expectations in the spec.
- **Solo-dev cycle time** → ship per phase, keep old pages live until replaced. Each phase can be reverted independently if it regresses.
- **Backend touch is small but mandatory** (the `expected_return_date` migration) → ship the migration in the same change as the borrow dialog (Phase B4/C1). NULL backfill on existing rows means zero data risk; rollback is a column drop.
- **Open questions** L1 (reservation states), L2 (wishlist persistence), L3 (request moderation), L4 (admin events vs announcements), L5 (BGG cadence) **do not block v1** as scoped here. They gate v2 phases and will be revisited before launching the v2 plan. L6 / L7 / L9 / L10 were resolved 2026-04-25 (see Decisions D8–D10 and the Context section's Figma URL).

## Migration Plan

Per phase, on `development`:

1. **Phase A** — `feat(ui): replace tokens, self-host fonts, add ui/ primitives, drop i18n`. Atomic; touches every page lightly. Old buttons/inputs left in place where unchanged are still readable but get a free restyle from the new token values.
2. **Phase B** — `feat(catalog): rebuild GameCard, CatalogPage filters, GameDetailPage`. Replaces the dual-slider with Radix. Old catalog removed in the same PR.
3. **Phase B4 + C1** — `feat(loans): borrow with return date + MyLoansPage rebuild`. Includes the migration. Backend + frontend land together.
4. **Phase D** — `feat(admin): restyle AdminMembersPage`. Pure CSS-level change, lowest risk, can ship before or after Phase B/C.

Rollback: each phase is a standalone PR on `development`. Revert the merge commit. Migration in Phase B4/C1 is reversible by dropping the column (no data depends on it being present).

## Phase A i18n removal inventory

Confirmed 2026-04-25 — Spanish-only is final (Decision D6). Phase A's follow-up change (`lending-design-tokens-and-primitives`) must remove the following:

**Files to delete:**
- `frontend/src/i18n/` (the whole directory: `ca.json`, `en.json`, `es.json`, `index.ts`)
- `frontend/src/components/LanguageSelector.tsx`
- Any `*.test.tsx` for `LanguageSelector`

**`useTranslation()` calls to inline as Spanish literals** (13 files):
- `frontend/src/App.tsx`
- `frontend/src/components/NavBar.tsx`
- `frontend/src/components/FilterControl.tsx`
- `frontend/src/components/ConfirmDialog.tsx`
- `frontend/src/components/LoanHistoryEntry.tsx`
- `frontend/src/components/GameCard.tsx`
- `frontend/src/components/SearchBar.tsx`
- `frontend/src/pages/CatalogPage.tsx`
- `frontend/src/pages/GameDetailPage.tsx`
- `frontend/src/pages/MyLoansPage.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/ForgotPasswordPage.tsx`
- `frontend/src/pages/SetPasswordPage.tsx`
- `frontend/src/pages/AdminMembersPage.tsx`

**Dependencies to remove from `frontend/package.json`:**
- `i18next`
- `i18next-browser-languagedetector`
- `react-i18next`

Use `es.json` as the source of truth for Spanish copy when inlining.

## Apply-time findings

Captured while running `/opsx:apply` against this change (2026-04-25). These do not invalidate the plan; they are footnotes the implementer should know.

- **F1.** `openspec/config.yaml` line 108 still reads "i18n infrastructure (UI is Catalan-only in V1)". Decision D6 supersedes that — the redesign is **Spanish-only**. Either update the project context line (preferred) or accept the contradiction documented here. Until the line is updated, the design doc is authoritative.
- **F2.** Existing date/datetime columns (`borrowed_at`, `returned_at`, `created_at`, `expires_at`) are stored as ISO strings in `TEXT` columns (see `001_initial.sql`). The new `expected_return_date` column should follow the same convention: store as `TEXT` (ISO date `YYYY-MM-DD`), not SQLite-native `DATE`. The spec under `lending-borrow-return-flow` has been adjusted accordingly (column type `TEXT`, parsed as `date | None` in the `Loan` entity).
- **F3.** The exported mockup set covers the v1 scope for catalog, game cards, game detail, and the loan date dialog. **There is no dedicated TFM mockup for `MyLoansPage` or `AdminMembersPage`.** Phase C1 (MyLoansPage redesign) and Phase D1 (admin members restyle) will need to be built from the style guide alone, not from a mockup PNG. Acceptable risk — both are list-style screens that the primitives + tokens fully describe.
- **F4.** Radix UI primitives (Decision D2) are headless behavior libraries (focus management, keyboard handling, ARIA wiring) and ship no styling. They are not a "UI component framework" in the sense of the project non-goal at config.yaml line 110 — that wording targets MUI/Chakra-class libraries. The carve-out is consistent with the spirit of the non-goal; this footnote records the rationale so reviewers don't mis-bounce a Phase B PR.

## Open Questions

Unresolved questions that do not block v1 but should be answered before opening v2 plans:

- **L1.** Are reservation/pickup/finalise three states or two? v1 sticks with two (active/returned). v2 may revisit when we touch the borrow flow again for notify-me.
- **L2.** Wishlist persistence: anonymous (email capture, GDPR work) or members-only (no GDPR delta)?
- **L3.** Request-new-game moderation: public + upvote, or private + admin-only?
- **L4.** Admin events vs `/calendario`: same entity or separate "announcements"?
- **L5.** BGG sync: button-only v1, nightly cron v2, or both? Curated subset or full BGG?

### Resolved 2026-04-25

- ~~**L6.**~~ Mobile-first → see D8.
- ~~**L7.**~~ WCAG 2.1 AA → see D9.
- ~~**L9.**~~ Figma access → URL recorded in Context.
- ~~**L10.**~~ Illustrations → reuse-only for v1, see D10.
