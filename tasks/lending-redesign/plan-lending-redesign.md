# Plan: lending-flow redesign (`/prestamos/*`)

Status: **draft, pending user approval / answers to open questions**
Owner: Miquel (solo) · target: 2026-Q2/Q3

## Inputs

- **Design source** (authoritative): the three TFM references
  - `references/aortegarams_R4.pdf` (170 pages — master thesis)
  - `references/Presentació TFM.pdf` (43 pages — defence deck)
  - Figma prototype (public, viewable, with starting node):
    `https://www.figma.com/proto/75YAWEkSnwNWAbB0jJARnZ/TFM---Servei-de-pr%C3%A9stec-digital?page-id=810%3A21946&node-id=810-21986&starting-point-node-id=810%3A21986&show-proto-sidebar=1`
    — same screens as the PDFs but clickable; useful during
    implementation to confirm interaction states, hover behaviour, and
    flow transitions. Cover screenshot at
    `mockups/figma-prototype-start.png`.
  Distilled into `tasks/lending-redesign/style-guide.md` and 11 mockup
  screenshots in `tasks/lending-redesign/mockups/`.
- **Current state**: `tasks/lending-redesign/current-state.md` (Explore
  inventory of existing pages, components, routes, endpoints).
- **Visual anchor of the club**: the existing
  `www.refugiodelsatiro.es` + PythonAnywhere embeds — Oswald headings,
  Open Sans body, `#BE0000` primary red, white surfaces. See
  `memory/project_existing_website.md`.

## What the redesign is for

The current lending app (`/prestamos`) was built standalone with a
utilitarian look (Tailwind-blue `#2563eb`, system fonts). We're merging
it into the main club site, and the TFM presents a more polished,
brand-aligned UX for the same flow. We adopt the TFM look & flow, but
tuned to the club's existing typography/color so the lending section
doesn't feel like a different product.

## Target user flows (from the TFM)

Mockup references below point at the exported screenshots in
`tasks/lending-redesign/mockups/`.

1. **Discover** — any visitor browses the catalog
   (`01-catalog-home-052.png`, `02-game-cards-states-049.png`,
   `11-rpg-cards-and-requests-050.png`). Filters shown as chips or a
   side panel; sort dropdown; search.
2. **Game detail** — cover, description, BGG link, availability, loan
   history (`03-game-detail-states-048.png`,
   `08-game-detail-history-and-popular-filters-064.png`).
3. **Borrow** — authenticated member picks a return date via a date
   dialog (`04-loan-date-dialog-053.png`). Confirmation becomes a toast
   + a "My loans" entry.
4. **Return** — member opens "My loans", hits "Return", confirms.
5. **Request a new game** — member proposes a title not yet in the
   ludoteca (`06-search-and-new-game-request-055.png`,
   `11-rpg-cards-and-requests-050.png`).
6. **Notify me** — member opts in to be notified when a currently-lent
   game is returned (`07-error-and-notify-dialog-057.png`).
7. **Admin home** — events, announcements, pending requests
   (`05-admin-home-and-events-054.png`).
8. **Admin Ludoteca sync** — one-click BGG refresh, import status
   (`10-admin-ludoteca-sync-066.png`).
9. **Community / loan history search** —
   `09-loan-search-and-community-065.png`.

The style guide will cover components (cards, buttons, forms, filters,
dialogs) in depth; that file is the working reference for the
implementer.

## Mapping to current pages

| TFM screen / flow | Current page | Change |
|---|---|---|
| Catalog home + filters | `CatalogPage.tsx` | Rebuild visual, replace custom dual-slider with accessible component, move filters into a side panel + chips row. Reuse data fetching. |
| Game cards | `GameCard.tsx` | Redesign card layout (cover-first, overlay badges for availability/rating), keep the same data. |
| Game detail | `GameDetailPage.tsx` | Add prominent Borrow CTA (today borrow happens in catalog), split into tabs (Info / History / Similar?), keep loan history table. |
| Loan date dialog | new | Replace ConfirmDialog-only borrow with a dialog that asks for return date, renders calendar + preset chips (1 week / 2 weeks). |
| My loans | `MyLoansPage.tsx` | Redesign list as cards; add "Renew" request if TFM includes it (check style guide), countdown to due date. |
| Notify-me | new | New modal + backend: wishlist for currently-unavailable games. |
| Request new game | new | New form + backend: member-submitted suggestions, admin-moderated queue. |
| Admin home | new | Dashboard that aggregates counts (overdue, pending requests, inventory total), plus event/announcement widgets. |
| Admin Ludoteca sync | new | Button + progress UI wired to a BGG sync task. |
| Admin members | `AdminMembersPage.tsx` | Apply new styling but keep structure; low risk. |

New backend capabilities implied:
- `POST /api/game-requests` + admin moderation endpoints.
- `POST /api/games/:id/notify-when-available` + `DELETE ...`.
- `POST /api/admin/bgg-sync` (idempotent; returns a job id if long).
- Possibly `PATCH /api/loans/:id/extend` if the designs show renewals.

## Visual direction (short summary — details in style-guide.md)

- **Typography**: Oswald for display / H1–H3 (matches club's existing
  site). Open Sans for body. Larger hierarchy than today — screens
  feel editorial, not utilitarian.
- **Color**: primary `#BE0000` (club red) for CTAs and active states.
  Neutral surfaces (`#FFFFFF`, `#F5F5F5`), heading text `#1F1F1F`,
  body `#333333`. Semantic: success green, warning amber; error uses
  the same brand red — always paired with an icon + text label so
  state is not colour-only. (Matches style-guide §2.1–2.3.)
- **Components**: cards with generous whitespace; avatar/cover-image
  first; chips for categories, badges for status. Dialogs are
  bottom-sheet on mobile, centered on desktop.
- **Illustration**: satyr motif as occasional decoration (header,
  empty states). Confirm in style guide once agent is done.

## v1 scope triage

The TFM defines ~24 screens. That's too much for a solo dev in one
cycle. Proposed cut (confirm in Q+L items below):

- **Must (v1)** — catalog (grid + list), game detail, borrow (with
  date dialog), return from "my loans", member validation, admin
  members page restyled. This is feature-parity with today + the
  redesigned visuals.
- **Should (v1.5)** — toast/feedback system, loading skeletons,
  mobile pass, a11y pass. Ships continuously once "must" is live.
- **Later (v2)** — notify-me wishlist, request-new-game, community
  page, admin home dashboard, admin BGG sync UI, events
  management, badges/insignias, RPG books ingestion. Each is a
  separate mini-project.

Anything in "Later" is deliberately dropped from the phases below.

## Work breakdown

Grouping by risk/independence. Each item is a PR-sized chunk.

### Phase A — groundwork
A1. Replace design tokens (`frontend/src/tokens.css`) with TFM/club
   palette and typography. **Self-host** Oswald + Open Sans under
   `frontend/public/fonts/` (see style-guide §3.1 — avoids hot-linking
   Google Fonts for GDPR).
A2. Extract `<Button>`, `<Input>`, `<Select>`, `<Chip>`, `<Badge>`,
   `<Card>`, `<Dialog>` primitives to `frontend/src/ui/`. Replace
   inline `.btn` usage in NavBar + pages.
A3. New `<PageLayout>` with header/nav/footer matching the wider
   club site (see `plan-replicate-existing-site.md`).

### Phase B — catalog + detail
B1. Rebuild `<GameCard>` (cover-first, badges).
B2. Rebuild `CatalogPage` filters panel and chip row; replace dual
   slider with accessible library (e.g. `@reach/slider` or Radix).
B3. Rebuild `GameDetailPage` with tabs + prominent borrow CTA.
B4. Borrow dialog with date picker; wire to existing
   `POST /loans` (adding `expected_return_date` if the design shows
   it).

### Phase C — member flows (v1)
C1. Rebuild `MyLoansPage` with countdown to due date.

### Phase D — admin (v1)
D1. Admin members page restyling (structure unchanged).

### Phase E — polish (v1.5)
E1. Toast system (success/error feedback after mutations).
E2. Global error boundary + friendly error screens.
E3. Loading skeletons for lists.
E4. Empty states with illustration.
E5. Accessibility pass (keyboard, focus, color contrast, aria-live for
   toasts).
E6. Mobile pass (bottom sheets, sticky filter button, swipeable).

### Phase F — i18n + content (v1.5)
F1. Audit every new string for CA/ES/(EN?) translations (see Q1 in
   the site-replication plan).

### v2 (deferred — separate plan when we get there)
- Notify-me wishlist (backend + frontend).
- Request-new-game (backend + frontend).
- Admin home dashboard + counts endpoint.
- Admin BGG sync UI + backend task.
- Moderation queues for game-requests / notify-me.
- Community page (Socios / Próximos Eventos / Gustos Compartidos).
- Event management (admin).
- Badge/insignia system.
- RPG books catalog (ingestion + UI).

## Resolved decisions

Answered 2026-04-21:

- Routing: keep `/prestamos` for private flow, expose same component at
  `/ludoteca` for public read-only browsing.
- v1 scope triage above (catalog + borrow/return + detail + member
  validation + admin members restyle) — confirmed.
- Languages: Spanish only. Drop the current CA/EN i18n scaffolding.
- Member validation: our DB is the source of truth; import the Drive
  spreadsheet once.

Answered 2026-04-25:

- **L6 — Mobile-first** for v1 catalog and borrow. Phase B builds for
  ≤480 px first, layers up to ≥1024 px with the side-panel filter
  layout. Borrow date dialog is a bottom sheet on mobile, centered
  modal on desktop. (See `openspec/changes/plan-lending-redesign/design.md` D8.)
- **L7 — WCAG 2.1 AA** as the accessibility baseline. Lighthouse a11y
  ≥90 (already an exit criterion below) maps to AA. (See design.md D9.)
- **L9 — Figma access**: viewable proto URL with starting node
  recorded in the design doc Context section.
- **L10 — Illustrations**: no new illustration work for v1. Reuse the
  TFM Flaticon assets where they apply, otherwise omit. (See design.md D10.)

## Open questions still outstanding

These gate v2 work, not v1:

- **L1. Scope of loan flow changes.** The TFM introduces reservation
  vs pickup vs finalise as three states (see style-guide §5.8), plus
  notify-me, petitions/requests, and badges. The v1 scope triage above
  keeps only borrow/return (two states). Confirm this cut, or tell me
  which "Later" item should move to v1.
- **L2. Wishlist / notify-me persistence.** Anonymous wishlist? Or
  members-only? (If anonymous, we need email capture — GDPR
  implications.)
- **L3. Request-new-game moderation.** Do submitted requests become
  public (visible to other members to upvote) or private?
- **L4. Admin event/announcement widgets.** Are events on the admin
  home the same as the calendar events (`/calendario`), or a distinct
  "announcements" entity?
- **L5. BGG sync frequency.** Manual (button only) v1? Or also a
  nightly cron? Ingest all of BGG or only a curated subset?
- ~~**L8. Keeping the existing `/prestamos` path.**~~ Resolved in
  `plan-replicate-existing-site.md`.

## Risks

- **Scope creep**: the TFM is an academic exercise and may show more
  screens than we want to ship v1. Mitigation: triage screens into
  "must, should, later" once the style guide is complete.
- **Token drift**: if we don't retire the old token file fully, we'll
  end up with two palettes. Mitigation: A1 is a hard cutover.
- **Accessibility regressions**: custom sliders and dialogs are easy to
  get wrong. Mitigation: prefer Radix UI / Reach UI primitives.
- **Time**: a 6-phase plan is real work for one person. Mitigation:
  ship per phase behind a feature flag; keep old pages live until
  replaced.

## Exit criteria

- All TFM "v1" screens implemented and visually consistent with the
  club site.
- No regressions in existing borrow/return flows (integration tests
  still pass).
- Lighthouse accessibility ≥90 on catalog, detail, my-loans, admin.
- Style guide checked back into the repo and kept in sync with
  implementation.

## v2 backlog

These do not block v1. They are tracked here so they don't get lost
when their gating decisions get answered. Each item references the
corresponding open question (L*) above. Re-promote into a dedicated
v2 plan once the question lands.

- **Notify-me wishlist** (gates on **L2** — anonymous vs members-only
  persistence, GDPR work for email capture).
- **Request a new game** (gates on **L3** — moderation model:
  public + upvotable vs private + admin-only queue).
- **Reservation / pickup / finalise three-state loan flow** (gates on
  **L1** — confirm we want three states or stay with two).
- **Admin home dashboard** (gates on **L4** — events vs announcements:
  reuse `/calendario` entity or add a separate "announcements" entity
  for the admin home widgets).
- **Admin BGG sync UI + backend task** (gates on **L5** — manual button
  only vs nightly cron vs both; ingest all of BGG vs curated subset).
- **Community page** (Socios / Próximos Eventos / Gustos Compartidos).
- **Event management UI for admins**.
- **Badge / insignia system**.
- **RPG books catalog** (ingestion + UI).
