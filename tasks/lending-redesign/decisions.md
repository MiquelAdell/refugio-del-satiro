# Decisions to take with Ariadna

Meeting prep for the Refugio del Sátiro website merge + lending
redesign. Date: TBD.

The goal is to walk out of the meeting with enough decisions made that
implementation can start without further blocking. Everything marked
"decision needed" is something that changes the plan materially
depending on the answer. Everything in the parking lot has already been
decided and is here only for context.

---

## Context in one paragraph

Today the club has two disconnected web presences:
`www.refugiodelsatiro.es` (Google Sites, edited by several club
collaborators) and `refugiosatiro.pythonanywhere.com` (Ariadna's Flask
app, embedded into Sites on two pages). Our repo `refugio-del-satiro`
currently ships only the lending app mounted at `/prestamos`. The
direction of travel is "everything under `www.refugiodelsatiro.es`":
the club site's content pages *plus* the lending flow, served from
one origin. The merge raises a content-workflow question that only
Ariadna can answer with us, plus a handful of smaller questions that
should not be left implicit.

---

## Decision 1 (main) — How do we preserve the Google Sites editing experience?

### The constraint

- Several collaborators already edit the Google Sites pages and are
  comfortable with the Sites editor.
- A full domain cut-over to a VPS-served app would force those
  collaborators to learn a different editor — or stop editing and rely
  on a dev.
- Google Sites' custom-domain mapping is all-or-nothing at the apex:
  we can't tell Google to serve `/prestamos` to the VPS and everything
  else to Sites.

### Options

**Option 1 — Scrape Google Sites to VPS (Miquel's first option).**
Editors keep editing Sites. A sync job (manual trigger or nightly cron)
downloads the rendered HTML + assets, stores them in our repo (or on
disk), and the VPS serves them as static files. The VPS also serves
`/prestamos` from the React app. `www.refugiodelsatiro.es` points at the
VPS.
- Pros: editors unchanged; single origin for everything; simple URL
  routing (all of `/` is just static files from the VPS).
- Cons: lag between edit and live (bounded by sync frequency); scraping
  is sensitive to Sites HTML changes; harder-than-expected edge cases
  (Calendar embed, cookie banner, dynamic Sites elements).
- Effort: ~1–2 days for v1 scraper + deploy glue; low ongoing.

**Option 2 — Build our own CMS with user management (Miquel's second
option).**
Replace Google Sites. Build a WYSIWYG editor, media library, role
system, versioning, review/approval workflow. Re-train editors.
- Pros: full control; one coherent system; no external dependency.
- Cons: massive scope (easily 3–6 months for a solo dev even with a
  library); ongoing maintenance of a CMS we own; re-training cost on
  editors who already know Sites.
- Effort: large. Probably the wrong use of time for a club of this
  size.

**Option 3 — Reverse-proxy Google Sites live.**
`www.refugiodelsatiro.es` points at the VPS (Caddy). Caddy routes
`/prestamos/*` to the React app; everything else reverse-proxies to
`sites.google.com/view/refugiodelsatiro/...`, rewriting absolute URLs
in the response body. No scraping, edits go out instantly.
- Pros: editors unchanged; no lag; nothing to re-train.
- Cons: Google Sites serves absolute URLs, sets CSP/CORS headers, and
  may change its response format without notice. Proxy rewriting is
  historically fragile — people have done it, but it tends to break
  quarterly.
- Effort: ~1 day to prototype; unknown long-tail maintenance cost.

**Option 4 — Swap Google Sites for a lightweight headless CMS (Decap
CMS, Sanity, Directus, Strapi).**
Editors get a web UI that looks similar to Sites. Content is stored as
Markdown/JSON (Git-backed for Decap; cloud DB for Sanity). Our VPS
serves everything.
- Pros: friendlier than raw Git for non-technical editors; modern stack;
  no scraping fragility.
- Cons: we still have to migrate content out of Sites once; editors
  have to learn a new tool; another dependency.
- Effort: ~3–5 days to pick + wire + migrate content.

### Recommendation

**Start with Option 1 (scrape).** It unblocks the merge with the least
change-management cost (editors keep editing Sites). Build the scraper
as a GitHub Action or a small cron on the VPS: trigger nightly *and* on
demand via a button we give to the editors. If Sites changes their HTML
too often, we escalate to Option 3 (proxy) or Option 4 (CMS) later
— we're not locked in.

Avoid Option 2. The scope is incommensurate with the value.

### What we need from Ariadna in the meeting

- Does she agree that "editors stay on Sites" is the right constraint
  for v1? Her experience with the editors will sharpen this.
- Any Sites pages that contain content the scraper will trip on
  (embedded forms, dynamic widgets, signed-in-only sections)?
- How often do editors edit, in practice? (Cadence informs whether
  nightly sync is enough, or we need on-demand triggers.)

---

## Decision 2 — Spanish only for `/prestamos` v1?

### Context

The main Google Sites pages are primarily Spanish, with Catalan tokens
for local event names ("Diürnes del Sàtir", "Festa Major"). The
existing lending app ships CA/ES/EN scaffolding but the Spanish strings
are the ones shipped to production.

### Options

- **A.** Spanish only. Remove the CA/EN scaffolding entirely. Ship
  faster, less text to maintain.
- **B.** Spanish as default, keep the CA/EN scaffolding active but
  lightly maintained. Pros: future-proof; costs a bit more churn on every
  string change.
- **C.** Full CA/ES/EN parity. Costs a lot of translation and QA effort.

### Recommendation

**Option A for v1.** Matches the main site's de facto language and is
the lightest lift. If a member demand appears for Catalan, add it as a
v2 item — the scaffolding to re-introduce it is not expensive compared
to the cost of maintaining it now.

### What we need from Ariadna

- Is there a political expectation that the app is Catalan-first given
  the club's Sabadell context? If yes, we flip the default and keep A
  as the content direction (ES + CA).

---

## Decision 3 — Who owns which part of the site going forward?

### Context

Once the merge is live, there are three content/software surfaces, and
editorial ownership should be explicit:

1. **Sites content** (home, FAQ, events, members info).
2. **Ludoteca catalog** (BGG-backed).
3. **Lending flow** (`/prestamos`).

### Options & recommendation

**Assumed model** (confirm in the meeting):
- Sites content → existing collaborators, via Google Sites, on their
  current cadence.
- Ludoteca catalog → admins of the `/prestamos` app (and eventually,
  Nora persona from the TFM). Board games are added to the BGG source
  list; our app syncs.
- Lending flow & admin UI → admins only.
- Product/tech direction → Miquel. Ariadna as design advisor for the
  redesigned lending surfaces.

### What we need from Ariadna

- Confirm her availability as design advisor during the redesign
  build-out (v1 Phases A–E in `plan-lending-redesign.md`).
- Does she want to stay involved in the Flask code (port to our
  FastAPI) or prefer a clean handoff?

---

## Decision 4 — Ariadna's code: port or reference only?

### Context

The private repo `refugio-del-satiro-legacy-pythonanywhere` contains
~210 files: Flask app, Models/, Repository/, Services/, Utils/,
ExternalClient/ (BGG+RPGGeek), templates/, and assets (Oswald +
OpenSans fonts, category icons, age/player/duration SVGs). The
architecture is recognisably clean (Repository pattern, Services).

### Options

- **A. Port the business logic** (BGG/RPGGeek client, game sync, data
  model) to our Python backend. Re-use the assets. Drop Jinja templates
  and replace with our React UI.
- **B. Reference only.** Rewrite everything from scratch in our stack,
  using Ariadna's code as a specification.

### Recommendation

**Option A** for the BGG/RPGGeek client and the ingestion logic — those
are non-trivial and already debugged. **Option B** for the UI layer —
Jinja templates don't map to React.

Reuse the asset library (Oswald/OpenSans fonts, minage/players/playtime
SVG icons) wholesale — they already match the style guide we wrote.

### What we need from Ariadna

- Heads-up / consent on porting her BGG client + models.
- Are the assets (icons, especially) hers to relicence, or were they
  pulled from Flaticon/SVG Repo? (Matters for attribution.)

---

## Decision 5 — Calendar: Google Calendar iframe or native?

### Context

`/calendario` today is a Google Calendar embed. Keeping the iframe is
zero effort; building a native events module is real work.

### Options

- **A.** Keep the iframe. Add a cookie banner that defers loading the
  iframe until the user accepts (GDPR).
- **B.** Native events module backed by our DB, with admin UI.

### Recommendation

**Option A for v1.** The TFM already scopes admin "event management"
(Flow E) to v2 — when we build that, we can consider native.

### What we need from Ariadna

- Any known pain points with the current iframe?

---

## Decision 6 — Admin auth model

### Context

The lending app today uses email + password with a one-time invitation
link for new admins. The members CSV has email addresses for many but
not all members. Google OAuth would be natural for the collaborators
(they already have Google accounts to edit Sites) but is heavier to
wire.

### Options

- **A.** Keep email + password.
- **B.** Email magic-link (no password at all).
- **C.** Google OAuth (only for admins).
- **D.** Any of the above + 2FA for admins.

### Recommendation

**Option B** (magic-link) as the v1 default. It's simpler to operate
than passwords (no reset flow needed) and friendlier for non-technical
admins. Revisit for Option C in v2 if admins push for it.

### What we need from Ariadna

- Opinion from the TFM persona research: did "Nora" (admin) complain
  about passwords?

---

## Decision 7 — Email delivery provider

### Context

The app needs to send transactional email (magic links, password
resets, optionally "notify me when game returns" in v2). The club has
`refugiodelsatiro@gmail.com`. Using Gmail SMTP directly is possible but
fragile (rate-limited, requires app passwords, banned on free-tier
VPSs for some outbound ranges).

### Options

- **A.** Gmail SMTP with an app password.
- **B.** Transactional email service (SendGrid / Mailgun / Resend /
  Postmark). Most have free tiers up to 100/day which is plenty.
- **C.** Self-hosted (Postfix on the VPS). Deliverability nightmare.

### Recommendation

**Option B — pick one service**. Resend or Postmark have the best
developer ergonomics for a small app like this. Free tier covers us.

### What we need from Ariadna

- Any existing service the club pays for that we should reuse?

---

## Decision 8 — BGG sync: manual, cron, or both?

### Context

The legacy app has an admin screen to trigger a BGG sync manually (see
TFM "Gestión de ludoteca"). A cron would keep the catalog fresh without
admin intervention.

### Options

- **A.** Manual-only.
- **B.** Nightly cron only.
- **C.** Both — cron + a "sync now" button.

### Recommendation

**Option C** with weekly cron default, plus on-demand button. A board
game's metadata rarely changes faster than weekly.

### What we need from Ariadna

- Any BGG rate-limit issues she ran into, so we size the sync window
  right.

---

## Decision 9 — What does `/validacion` reveal?

### Context

The current Sites flow lets anyone type a member number and learn if
the member is valid. The Google Sheet has 17 columns including PII
(DNI, address, phone, email). We need to decide the public payload.

### Options

- **A.** Minimal: just "socio válido" / "no socio" + name.
- **B.** Minimal + expiry date + membership type.
- **C.** Rich: everything except PII.

### Recommendation

**Option B.** Enough to be useful at the club door, nothing
identifiable beyond the member's existing public name. Rate-limit the
endpoint (30 req/min/IP).

### What we need from Ariadna

- What info does the club door staff actually need?

---

## Decision 10 — PII retention + GDPR posture

### Context

The members Sheet holds DNI, address, phone, email. GDPR requires a
lawful basis, retention policy, and a right-to-erasure process.

### Options

- **A.** Keep PII exactly as the Sheet does, admin-read-only in our
  DB, retention = until member cancels + 1 year.
- **B.** Minimize: store only what's needed for `/validacion` + loan
  flow. Drop DNI and address in our DB. Keep in the Sheet as the
  registration record.
- **C.** No PII in our DB at all — each validation hits the Sheet via
  the service account.

### Recommendation

**Option B.** Minimizes data on the VPS; keeps the Sheet as the
authoritative registration ledger; still lets the lending flow work.

### What we need from Ariadna

- Has the club documented a privacy policy for members? If yes, use it.
  If no, we need to draft one before go-live.

---

## Decision 11 — Mobile-first or desktop-first for the redesign?

### Context

The TFM prototype is desktop-only. Members at the club usually have a
phone in hand; borrowing may happen at home on a computer.

### Options

- **A.** Desktop-first; mobile as follow-up polish (matches TFM).
- **B.** Mobile-first; desktop as a width-scaled version.

### Recommendation

**Option A** (desktop-first) for v1, paired with a mandatory mobile
pass in Phase E5–E6. Rationale: the TFM is desktop, so "faithful
implementation" is cheaper; the mobile pass is still cheap because we
control the design tokens.

### What we need from Ariadna

- Did her user testing cover mobile at all, or only desktop?

---

## Decision 12 — Analytics

### Options

- **A.** None.
- **B.** Plausible (hosted, privacy-friendly, ~€9/mo for a small site).
- **C.** Umami (self-hostable; ~0 cost after we already run a VPS).
- **D.** Simple server logs + Goaccess for occasional review.

### Recommendation

**Option D or A** for v1. The club doesn't run campaigns; detailed
analytics are overkill. Revisit when we have a question analytics can
actually answer.

### What we need from Ariadna

- Does she or the collaborators ever look at current Sites analytics?

---

## Parking lot — already decided (carried forward)

- **Routing**: single canonical table in
  `plan-replicate-existing-site.md`. `/prestamos` stays for private
  flow; `/ludoteca` is the public read-only view of the same catalog.
- **v1 scope for lending**: catalog + borrow/return + game detail +
  member validation + admin members restyle. Everything else
  (notify-me, requests, community, badges, events, RPG books, BGG
  sync UI) is v2.
- **Member-validation source of truth**: our DB (imported from the
  Sheet once).
- **Languages**: Spanish only (see Decision 2 — confirm in the
  meeting).
- **Staging**: soft launch at `https://test.refugiodelsatiro.es/`
  before apex DNS cutover.
- **Fonts**: self-host Oswald + Open Sans (GDPR).
- **Brand red**: `#BE0000`.
- **Credentials**: MySQL password and Google service account will be
  replaced by new env-var-managed values when we build our side. The
  old values remain on PythonAnywhere because the legacy app is still
  live; not rotating (user's call).

---

## Meeting checklist

Bring the following artefacts to the meeting:

- `tasks/lending-redesign/plan-replicate-existing-site.md`
- `tasks/lending-redesign/plan-lending-redesign.md`
- `tasks/lending-redesign/style-guide.md`
- 3–4 mockup PNGs from `tasks/lending-redesign/mockups/` (catalog, game
  detail, borrow dialog, admin home).
- This file.

Aim to walk out with:

- A decision (or firm preference) on Decision 1.
- A "confirmed" marker on Decisions 2, 3, 4, 6, 9, 11.
- An owner and rough timeline for Decisions 5, 7, 8, 10, 12.
