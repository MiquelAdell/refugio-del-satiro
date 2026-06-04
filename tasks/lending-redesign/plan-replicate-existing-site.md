# Plan: replicate the existing Refugio del Sátiro website

Status: **draft, pending user approval / answers to open questions**
Owner: Miquel (solo) · target: 2026-Q2

## Context

Today the club has two online presences:

1. **`www.refugiodelsatiro.es`** — public site, hosted on **Google Sites**.
2. **`refugiosatiro.pythonanywhere.com`** — a small Flask/Bootstrap app
   embedded into Sites on two pages:
   - `/socios/ludoteca` → board-game + RPG catalog pulled from
     BoardGameGeek (BGG). 226 board games + 100 RPG books.
   - `/Validacion-Membresia` → member-number lookup, reading data from
     a Google Drive source.

Our repo `refugio-del-satiro` currently only hosts the lending app
(`/prestamos`). The decision is to **merge everything into this repo** so
the RackNerd VPS serves the entire club site, and then redirect
`www.refugiodelsatiro.es` to it.

## Goals

- Reproduce every Sites page as a first-class page in our app.
- Replace the PythonAnywhere Ludoteca with a native catalog whose data
  comes from our DB (seeded from BGG, kept in sync).
- Replace the PythonAnywhere member-validation page with a native
  endpoint backed by our members table (or by reading the Drive source
  if we decide not to own it).
- Keep the existing visual identity (see `style-guide.md` once it lands;
  meanwhile: Oswald headings, Open Sans body, `#BE0000` primary red,
  white/neutral surfaces).

Out of scope of this plan (but related):
- The lending-flow redesign itself (covered in
  `plan-lending-redesign.md`).
- Member-facing account management beyond what the Sites today exposes.

## Inventory of pages to replicate

| Current URL | Type | Content | Notes |
|---|---|---|---|
| `/inicio` | static | Hero photos, about, WhatsApp, socials | straightforward MDX/JSX page |
| `/calendario` | iframe | Google Calendar embed, `#F83A22` branding | keep as `<iframe>` in MVP |
| `/juegos-de-rol` | static | RPG activities intro | MDX/JSX |
| `/juegos-de-rol/campañas` | static | Campaign listings | content, occasionally updated |
| `/juegos-de-rol/oneshots` | static | One-shot listings | content |
| `/juegos-de-mesa` | static | Board-game activities intro | MDX/JSX |
| `/juegos-de-mesa/dias-de-juegos` | static | Game days info | content |
| `/eventos` | static | Events index | 3 sub-pages |
| `/eventos/diurnes-satir` | static | Event descriptor | content |
| `/eventos/festa-major` | static | Event descriptor | content |
| `/eventos/24h-mesa` | static | Event descriptor | content |
| `/faq` | static | FAQ entries | Q&A list |
| `/faq/normas-de-conducta` | static | Code of conduct | long text |
| `/socios` | static | Members info | content |
| `/socios/entidades-amigas` | static | Friend clubs | list of partner logos/links |
| `/socios/ludoteca` | dynamic | Game catalog | **reimplement** (see below) |
| `/Validacion-Membresia` | dynamic | Member lookup | **reimplement** |

Captured screenshots of these pages live under
`tasks/lending-redesign/existing-site/*.png`.

## Proposed architecture

Two kinds of pages share one layout:

- **Content pages** — the static Sites pages. Stored as MDX (or plain
  JSX) files in `frontend/src/content/...`, rendered by a common
  `<ContentPage>` layout. Minimal logic, maximum simplicity.
- **App pages** — Ludoteca catalog, game detail, member validation,
  plus everything under `/prestamos` (the lending flow). These already
  consume the FastAPI backend; we extend it.

### Routing

**Canonical URL map** (used by both plans; all three docs MUST agree):

| Path | Type | Notes |
|---|---|---|
| `/` | content | Home (Inicio) |
| `/calendario` | content | Google Calendar iframe |
| `/juegos-de-rol` · `/campanas` · `/oneshots` | content | RPG activities |
| `/juegos-de-mesa` · `/dias-de-juegos` | content | Board-game activities |
| `/eventos` · `/eventos/:slug` | content | Events |
| `/faq` · `/faq/normas-de-conducta` | content | FAQ + code of conduct |
| `/socios` · `/socios/entidades-amigas` | content | Members info |
| `/ludoteca` | app (public) | Catalog (read-only for guests) — **same React page as** `/prestamos/`, served in guest mode when unauthenticated. Replaces `/socios/ludoteca`. |
| `/ludoteca/:id` | app (public) | Game detail (read-only for guests) |
| `/validacion` | app (public) | Member lookup. Replaces `/Validacion-Membresia`. |
| `/prestamos/...` | app (private) | The full lending flow — borrow, return, my-loans, admin. **Keeps the existing `/prestamos` path** so existing bookmarks, Caddyfile rules, and the current React basename don't change. See `plan-lending-redesign.md`. |
| `/login` · `/forgot-password` · `/set-password` | auth | |
| `/admin/*` | app (admin) | Admin-gated |

Relationship between `/ludoteca` and `/prestamos`: one React catalog
component renders both. When the viewer is unauthenticated, borrow
buttons are hidden and the page is reachable via `/ludoteca`; when
authenticated, the same component mounts at `/prestamos/` with borrow
actions enabled. This avoids duplicating code.

Keep 301 redirects for every old Sites slug:
`/socios/ludoteca` → `/ludoteca`,
`/Validacion-Membresia` → `/validacion`,
`/juegos-de-rol/campa%C3%B1as` → `/juegos-de-rol/campanas`, etc.

### Ludoteca reimplementation

Today's PythonAnywhere app has:
- Two catalogs: `Boardgame` and `RPGame` (indexed by internal id).
- Filters: players (range), min age (range), category (select),
  publisher (select).
- Per-item: cover image (from BGG CDN), description, category, BGG
  rating, age rating, BGG link.

Our lending app already has a board-game catalog and detail with BGG
link + rating. We extend it to:

1. **Public-readable Ludoteca page** at `/ludoteca` (no auth). Reuses
   the redesigned catalog from the lending redesign. Borrow actions are
   hidden for guests and visible for authenticated members.
2. **RPG books catalog** as a new section. Schema addition:
   `rpg_books` table (id, bgg/rpg-geek id, title, system, genre,
   description, cover_url, min_players, max_players, year). Ingestion
   script pulls from BGG's RPG category or a manually curated CSV.
3. **BGG sync job** — a periodic task that refreshes descriptions,
   covers, ratings. Initial implementation: on-demand admin button
   "Refresh catalog from BGG"; later: cron.

Data migration: we don't import existing data from PythonAnywhere; we
re-ingest from BGG. Current `prestamos.db` is the source of truth for
board-game inventory (already has the correct 200-ish games).

### Member validation reimplementation

Current PythonAnywhere flow: single text field ("Buscar socio/a por
número…") → returns "yes/no" + member's display name, validity dates.
Source of truth = a Google Drive spreadsheet.

Option A (preferred): the app's `members` table is the source of truth.
Each member has a number, a name, and an active/expiry flag. We add a
public endpoint `GET /api/members/validate?number=1234` returning
`{ active: true, displayName: "A. Socio", validUntil: "2026-12-31" }`
or 404. The `/validacion` page renders the result.

Option B: keep reading from Google Drive via a service account and
expose the same endpoint. Adds a dependency but avoids the data-entry
burden.

See open question Q4.

## Content pipeline

**Decided in `decisions.md` Decision 1**: scrape Google Sites
periodically. Editors keep editing Sites; our VPS serves the mirrored
HTML + assets. See `decisions.md` for the trade-off analysis.

Implementation shape (to be built in a dedicated follow-up session):
- A scraper (Python, headless browser if Sites' JS rendering is
  required) that enumerates the ~15 public pages, captures the
  rendered HTML + images, rewrites absolute URLs to relative, and
  writes to a mirror directory.
- Trigger: on-demand via CLI or admin button, *and* a scheduled run
  (cadence TBD — weekly by default, adjust once we observe editing
  frequency).
- Storage: the scraped output committed to the repo on each run
  (simple; content history = git history) OR written to a VPS data
  volume (faster, no commit noise). Default: committed. Revisit if
  noise is excessive.
- Images: re-host locally (copy from `googleusercontent.com` into
  the mirror directory).

If scraping Sites' JS-heavy HTML becomes brittle, escalate to
Decision 1 Option 3 (live reverse proxy) or Option 4 (headless CMS).

## Phasing

**Phase 0 — foundations (already possible in parallel with redesign)**
- Adopt the style tokens from `style-guide.md` (fonts Oswald + Open
  Sans, color scale, spacing, buttons).
- Build a `<ContentPage>` layout with header, sidebar for sub-nav
  (Sites uses L2 nav per section), and a footer with socials.
- Consolidate the nav into a single top bar matching the existing site.

**Phase 1 — replicate static content**
- MDX pages for the 13 static Sites pages.
- Calendar iframe page.
- 301 redirects for old slugs.
- Publish to a staging URL for visual parity review.

> **TODO (Phase 1 follow-up):** when the static content pages are ported to
> React, the scraper-driven `_nav.json` mechanism becomes redundant —
> replace it with a React-resident nav config and remove `nav_extractor` /
> `_nav.json`. Until then, members reach the lending app via direct URL or
> bookmark.

**Phase 2 — native Ludoteca**
- Public `/ludoteca` (reuse redesigned catalog, read-only for guests).
- BGG sync button (admin).
- Add `rpg_books` entity + admin list.

**Phase 3 — native member validation**
- Decide Option A vs B (Q4).
- Add endpoint + page.

**Phase 4 — DNS cutover**
- Point `www.refugiodelsatiro.es` to the VPS.
- Keep a fallback to the Sites page for a week in case of rollback.

**Phase 5 — lending redesign**
- Ship the redesigned `/prestamos/*` flow (separate plan:
  `plan-lending-redesign.md`). Phases A–B (tokens, primitives, catalog
  restyle) can run **in parallel** with Phases 1–2 here — they share
  the same component library. Phases C–F only make sense once the
  content merge (Phase 1) is live.

## Operations (applies to both plans)

These items live outside any phase but have to be in place before
DNS cutover:

- **Deploy pipeline.** Docker Compose stack already runs on the
  RackNerd VPS (see `memory/project_infrastructure.md`). Add a GitHub
  Actions workflow that, on merge to `main`, builds images and pushes
  to a registry; a server-side `git pull && docker compose up -d`
  tops it off. Keep `development` branch for previews.
- **CI checks.** Every PR must run Ruff + Black + pytest + Vitest +
  tsc. Lighthouse CI run against a preview URL for home, catalog,
  detail, my-loans.
- **Staging.** Expose the VPS build at `nou.refugiodelsatiro.es`
  (sub-domain) while the main domain still points at Google Sites.
  Use this for pre-cutover QA.
- **SEO preservation.**
  - Write 301 redirects for every old Sites slug (see Routing table).
  - Generate a `sitemap.xml` listing the new canonical URLs.
  - Add `<link rel="canonical">` on every page.
  - Preserve `og:title`, `og:description`, `og:image` on each page.
  - If the Google Sites site is indexed, submit the sitemap to
    Google Search Console after cutover.
- **Analytics.** None today. Decide before launch: Plausible (privacy
  friendly, self-hostable) vs Umami vs nothing. The lending app is
  small enough that nothing is a valid choice.
- **GDPR.** The Calendar iframe sets Google cookies. Add a minimal
  cookie banner that defers the iframe's `src` until the user
  accepts (or use a placeholder image with "click to load"). Do not
  reuse Google Sites' banner — build a small local one.
- **Email delivery.** The lending app already sends password-reset
  emails. Document SMTP provider, from-address, and failure behaviour
  before new flows (notify-me, request-new-game) go live.
- **Backups.** Nightly dump of `prestamos.db` to off-box storage.
  Keep ≥14 days. Test a restore once.
- **Monitoring.** At minimum: a cron that pings the home + catalog
  + `/api/games` and alerts on failure.
- **Secret management.** `.env.production` should not live in Git; it
  already doesn't, but verify. Document which envs are needed
  (`SECRET_KEY`, SMTP creds, BGG cache dir if any).
- **Rate limit** the new public `/api/members/validate` endpoint
  (e.g. 30 requests/min per IP) — it's the only public lookup for
  member data and could be abused.

## Resolved decisions (answered 2026-04-21)

- **Routing**: keep `/prestamos` private, expose `/ludoteca` as public
  read-only (same component).
- **v1 scope**: confirmed (see `plan-lending-redesign.md`).
- **Languages**: Spanish only for now (main site is ES; drop CA/EN
  scaffolding from the merged app).
- **Member validation source of truth**: our DB (Option A). The Drive
  spreadsheet becomes an input for a one-off import, not an ongoing
  read.
- **DNS cutover**: soft launch at `https://test.refugiodelsatiro.es/`
  before swapping the apex.

## Open questions still outstanding

- **Q2. Calendar.** Keep Google Calendar iframe (with a cookie banner)
  or rebuild as a native events component backed by our DB? Native
  allows event pages but costs admin effort.
- **Q3. Content editing.** After launch, who edits the content pages?
  Options: (a) Markdown in Git + PRs — same as devs; (b) a tiny admin
  CMS (risky scope creep). I'd default to (a).
- **Q5. URL structure.** All slugs in Spanish, confirmed. Final list
  in the Routing table; keep 301s from old Sites paths.
- **Q7. RPG books catalog.** Is the current set (100 items on the
  PythonAnywhere app) something we want to carry over 1:1, or
  curate down? Who maintains it? (Deferred to v2, but need to know
  whether to preserve the existing DB rows during migration.)

## Risks and mitigations

- **Visual parity drift.** Oswald + Open Sans + red (#BE0000) is a
  simple palette, but the existing photography-heavy feel is hard to
  replicate without asset access. Mitigation: re-use the Sites photos;
  get originals from you.
- **Breaking old URLs / SEO.** Mitigation: write 301s for every old
  slug before DNS cutover.
- **BGG throttling / outage.** Mitigation: cache cover images and
  descriptions locally; sync is incremental.
- **Content rot.** If content pages live in Git, non-technical updates
  require a dev. Mitigation: keep content modular and cheap to edit;
  revisit in 6 months if friction is high.

## Exit criteria

- Every URL from the current Sites site resolves (directly or via 301)
  on the new deployment.
- Ludoteca lists ≥226 board games with filters working.
- Member validation returns identical results to the current flow for a
  sample of 20 known members.
- Lighthouse performance ≥90 on home, catalog, and detail pages.
- Visual parity sign-off from you.
