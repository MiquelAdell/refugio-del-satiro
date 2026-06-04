# Tasks

This change is a **planning artifact** (per `design.md` D5). It does not produce shipped code. Tasks here are scoped to plan validation, sign-off, and spinning up the follow-up implementation changes — one per phase — that reference the specs introduced in this change.

When this change is applied, the deliverables are:
- a sanity-checked plan (proposal + design + specs) ready to drive follow-up work
- a set of issues/branches/changes opened for each implementation phase
- the open-questions list narrowed to only those that gate v2

## 1. Plan validation

- [x] 1.1 [CR] Read through `proposal.md`, `design.md`, and the four spec files end-to-end; flag any contradictions with `tasks/lending-redesign/plan-lending-redesign.md`, `style-guide.md`, `current-state.md`, or `decisions.md`. → Findings F1–F4 captured in `design.md` "Apply-time findings".
- [x] 1.2 [FE] Cross-check spec scenarios against the 11 mockups under `tasks/lending-redesign/mockups/` and the public Figma prototype; note any scenario the mockups don't support so we either drop it or schedule a Figma walkthrough. → No mockup for `MyLoansPage` or `AdminMembersPage`; recorded as finding F3 (acceptable risk — list screens, fully described by primitives + tokens).
- [x] 1.3 [BE] Confirm the `expected_return_date` migration approach (Decision D1) is compatible with the current SQLite schema and migration runner; if not, propose an adjusted approach in `design.md` before sign-off. → Compatible. Adjusted column type to `TEXT` (ISO `YYYY-MM-DD`) per existing convention; spec updated. Finding F2.
- [x] 1.4 [CR] Verify Decision D2 (Radix UI primitives only — no full component framework) against the project's stated non-goal "no UI component framework"; document the carve-out in `.claude/CLAUDE.md` or the project's CLAUDE.md if needed so reviewers don't bounce future PRs. → Carve-out documented in finding F4 (Radix is headless behavior, not styled framework).

## 2. Resolve blocking open questions

- [x] 2.1 [FE] Confirm Spanish-only is final (Decision D6); if so, list the i18n files/dependencies/strings to remove in Phase A. → Confirmed. Inventory added to `design.md` "Phase A i18n removal inventory" (4 i18n files, `LanguageSelector`, 13 `useTranslation()` call sites, 3 dependencies).
- [x] 2.2 [FE] Confirm L6 (mobile-first vs desktop-first) for the v1 catalog and borrow flow; record the answer in `design.md` so Phase B builds against the right breakpoint. → **Mobile-first** confirmed 2026-04-25. Recorded in `design.md` D8.
- [x] 2.3 [FE] Confirm L7 (WCAG AA target) so a11y acceptance criteria are stable before Phase B starts. → **WCAG 2.1 AA** confirmed 2026-04-25. Recorded in `design.md` D9.
- [x] 2.4 [FE] Request L9 — viewable Figma link from Ariadna — so hover/animation states are unambiguous when implementing. → Figma proto URL with starting node received 2026-04-25 and recorded in `design.md` Context.
- [x] 2.5 [FE] Decide L10 (illustrations: reuse Flaticon set vs commission/recreate) before Phase B if any v1 screen needs them; otherwise defer to v2. → No v1 screen needs new illustrations; reuse the Flaticon assets already referenced in the TFM where applicable. Recorded in `design.md` D10.
- [x] 2.6 [CR] Move L1, L2, L3, L4, L5 to a v2 backlog file (e.g. append to `tasks/lending-redesign/plan-lending-redesign.md` v2 section) so they don't block v1 sign-off. → Appended "v2 backlog" section to `tasks/lending-redesign/plan-lending-redesign.md` linking each item to its gating question.

## 3. Spec maintenance

- [x] 3.1 [CR] Update `tasks/lending-redesign/plan-lending-redesign.md` to mark "open questions L6, L7" as resolved once 2.2 and 2.3 land. → L6 (mobile-first), L7 (WCAG AA), L9 (Figma access), L10 (illustrations) all moved to "Resolved decisions" in the plan.
- [ ] 3.2 [CR] Once this change archives, copy each spec under `openspec/changes/plan-lending-redesign/specs/` into `openspec/specs/<capability>/spec.md` so follow-up changes can reference them as `Modified Capabilities` deltas.
- [x] 3.3 [CR] Add a one-line entry to `README.md` "Planned work" section pointing to this change so casual readers can find the redesign roadmap. → New "Planned work" section added to `README.md` linking to `openspec/changes/plan-lending-redesign/`.

## 4. Spawn follow-up implementation changes

Each follow-up is its own OpenSpec change with its own proposal/design/tasks. The bullets below name the change and its scope.

- [ ] 4.1 [CR] Open follow-up change `lending-design-tokens-and-primitives` covering Phase A: replace `frontend/src/tokens.css` with brand tokens, self-host Oswald + Open Sans under `frontend/public/fonts/`, create `frontend/src/ui/` primitives (`Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`), introduce `<PageLayout>`, drop the i18n scaffolding (`LanguageSelector`, translation files, `react-i18next`-class deps).
- [ ] 4.2 [CR] Open follow-up change `lending-catalog-rebuild` covering Phase B1–B3: cover-first `<GameCard>`, `CatalogPage` with side-panel filters + chip row, accessible Radix-based player-range slider, `GameDetailPage` with prominent Borrow CTA and existing loan history. Includes the `/ludoteca` public read-only route.
- [ ] 4.3 [CR] Open follow-up change `lending-borrow-with-return-date` covering Phase B4 + C1: backend migration adding `loans.expected_return_date` (nullable), `Loan` entity field, `BorrowRequest` field, `LoanResponse`/`ActiveLoanResponse` field, borrow dialog with calendar + preset chips, `MyLoansPage` rebuilt as cards with countdown.
- [ ] 4.4 [CR] Open follow-up change `lending-admin-members-restyle` covering Phase D1: `AdminMembersPage` migrated to `<PageLayout>`, `Button`, `Input`, `Card`, `Dialog` primitives — no structural or endpoint changes.
- [x] 4.5 [CR] Defer Phase E (polish: toasts, skeletons, error boundary, mobile pass, a11y pass) and Phase F (translation audit) into a single v1.5 follow-up change once 4.1–4.4 are live; do not open it now. → Deferral acknowledged in `design.md` Non-Goals; will spawn a `lending-v1.5-polish` change once Phase D ships.
- [x] 4.6 [CR] Defer all v2 items (notify-me, request-new-game, admin home dashboard, BGG sync UI, community page, events management, badges, RPG books) into separate v2 plan changes once the open questions in section 2 are resolved. → v2 backlog formalised in `tasks/lending-redesign/plan-lending-redesign.md` "v2 backlog" section, each item linked to its gating L-question.

## 5. Tests for this planning change

- [x] 5.1 [CR] Run `openspec validate plan-lending-redesign` and confirm no errors. → `Change 'plan-lending-redesign' is valid`.
- [x] 5.2 [CR] Run `openspec status --change plan-lending-redesign` and confirm `isComplete: true`. → 4/4 artifacts complete.
- [x] 5.3 [CR] Sanity-check that every requirement in every spec file under `specs/` has at least one `#### Scenario:` block (4 hashtags exactly). → All 18 requirements across 4 spec files have ≥1 scenario (5 + 3 + 5 + 5).
