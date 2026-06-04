## Context

Two visual identities live on the same domain today:

- **Static content pages** at `/`, `/calendario`, `/eventos/...`, `/juegos-de-mesa/...`, `/juegos-de-rol/...`, `/socios/...`, `/faq/...` — served by Caddy from `frontend/public/content-mirror/`, scraped from `www.refugiodelsatiro.es` (the public Google Sites). Header is the club's existing dark-bar nav with the satyr shield logo. Footer carries social links, copyright, and (originally) a language selector.
- **Lending React SPA** at `/prestamos/*` — uses the bespoke `frontend/src/components/NavBar.tsx` with its own (currently light, currently to-be-restyled-by-Phase-A) styling. No footer.

The user explicitly asked to land on a single shell that visually matches the scraped club site, with the lending-app routes folded into it under a new top-level **Préstamos** menu (submenu: Catálogo / Mis préstamos / Administración). The existing-site replication track (`tasks/lending-redesign/plan-replicate-existing-site.md` Phase 0) already calls this out as a foundation step.

This change covers only the **lending React app's wrap**. Porting the static content pages to React (so they share this same shell at the component level) is a later step in the replicate-existing-site track.

## Goals / Non-Goals

**Goals:**
- A single React shell (`<PageLayout>` = `<SiteHeader>` + `<main>` + `<SiteFooter>`) that visually matches the scraped club site.
- New top-level nav item **Préstamos** with a submenu of Catálogo / Mis préstamos / Administración. Administración is role-gated to admin members.
- Active-route highlighting: parent active when path starts with `/prestamos/`, submenu items active on exact match.
- Mobile burger menu (< 768 px) with the submenu nested inside.
- Drop the language selector from the footer (Spanish-only per Decision D6).
- Delete the lending app's bespoke `NavBar` once the new shell is in place.

**Non-Goals:**
- Porting the static content pages to React. They keep being served by Caddy from `frontend/public/content-mirror/`. Their nav still points at the same paths it does today.
- Reintroducing the language selector.
- Multi-level submenus deeper than one level (the submenu under Préstamos is the only submenu in the new shell — the other top-level items are flat links for now, even though the scraped site has L2 sub-nav for some sections; that L2 nav lives within each static content page and stays there).
- Updating the static content pages' own nav so it lists Préstamos. That requires a re-scrape with a transform layer or a switch to React-rendered content pages — both belong to the replicate-existing-site track.
- Routing-level integration with the static content pages. Clicking "Calendario" in the new React shell still does a full-page navigation to the Caddy-served HTML (an `<a href>`, not a React Router link), because those routes are not part of the React app.

## Decisions

### S1. Visual fidelity by clean React rebuild, not by literal HTML embedding

**Decision:** `SiteHeader` and `SiteFooter` are hand-written React components styled to **visually match** the scraped club site. We do **not** embed the scraped HTML verbatim via `dangerouslySetInnerHTML`.

**Why over literal embedding:** the scraped pages contain Google Sites' obfuscated class names (`yDmH0d`, `BuY5Fd`, ...) and a `jsaction`/`jscontroller` attribute soup that runs Sites' own JS. None of that is meaningful to us, and it actively prevents us from inserting the new Préstamos submenu cleanly. A clean rebuild lets us own the markup and evolve the nav structure.

**How we keep visual fidelity:** the rendered scraped page (`frontend/public/content-mirror/index.html`) is the *visual reference*. There is **no** `content.css` file — Sites injects all styles inline in `<style>` blocks in the page, so visual values are sampled via DevTools rather than read from a stylesheet. The sampled values feed the new header tokens (`--color-header-bg`, `--color-header-fg`, `--color-header-fg-hover`, `--color-header-fg-active`, `--color-header-divider`, `--header-height`, `--header-z`) added to `tokens.css`. Fonts (Oswald, Open Sans) are already self-hosted in `tokens.css` — do not add the Google Fonts `<link>`. Logo asset: `frontend/public/content-mirror/_assets/200953ee27cc922e.png`, ~40 px header height, left-aligned.

### S1b. Top-level nav items are data-driven from `_nav.json`

**Decision:** The static-page nav items (`Inicio`, `Calendario`, `Eventos`, `Juegos de Mesa`, …) are not hardcoded in `<SiteHeader>`. The scraper extracts the top-level `<header>` nav from the canonical root page on each run and writes `frontend/public/content-mirror/_nav.json` with `{version, generated_at, items: [{label, href}]}`. The React shell fetches that file once at App boot via `useNavItems()` (provider-cached) and renders the items in order, then appends the Préstamos parent.

**Why over hardcoding:** the source Google Sites nav changes occasionally (Sites editors add or rename items). A hardcoded list silently drifts; a fetched list stays in sync after every scrape. The cost is one extra HTTP request per session and a small atomic-write helper in the scraper.

**Failure mode:** if `_nav.json` is missing, returns an unexpected shape, or fails to parse, the hook returns `status: "error"` with `items: []` and `<SiteHeader>` renders with only the Préstamos parent. The user sees a degraded but functional header, never a broken page. The scraper's atomic-write helper guarantees that a partial `_nav.json` never reaches disk: a previous valid file remains in place across failed re-scrapes.

**Boundary rule:** items whose `href` is exactly `/prestamos` or starts with `/prestamos/` are excluded by the extractor — the React shell owns that branch via the Préstamos parent. `/prestamos-info` (hypothetical sibling) is kept because the exclusion is anchored to the exact-or-trailing-slash prefix.

**Dev parity:** in production Caddy serves `_nav.json` from `frontend/public/content-mirror/_nav.json` at `/_nav.json`. In dev under Vite, we proxy `/_nav.json` to Caddy (`http://localhost:8080`) via `vite.config.ts`, so the fetch path is identical in both environments.

### S2. Keep the static content pages on Caddy; cross-link via plain `<a>`

**Decision:** Top-level nav items that point at static content pages (`Inicio`, `Calendario`, `Eventos`, `Juegos de Mesa`, `Juegos de Rol`, `Socios`, `FAQ`) render as plain `<a href="/path">` elements. They cause a full-page navigation out of the React app and back into Caddy-served HTML. Only `/prestamos/*` items use React Router `<Link>`.

**Why over making the React app the single SPA for everything:** porting 19 scraped pages to React (with their L2 sub-navs and embedded calendars/iframes) is a multi-week project. That's the existing-site replication track's Phase 1, not this change. Until then, splitting navigation between SPA and static pages is the honest behavior.

**Trade-off:** users get a brief navigation flicker when crossing between `/prestamos/*` and other paths. Acceptable because the visual identity is the same on both sides.

### S3. Préstamos as a CSS-driven submenu on desktop, state-driven on mobile

**Decision:** On desktop (≥ 768 px), the Préstamos submenu opens on `:hover` of the parent and on `:focus-within` (so keyboard users get it too). No JavaScript state. Implementation: parent `<li>` has `position: relative`, child `<ul>` is `position: absolute; display: none` and toggled to `display: block` via the `:hover` / `:focus-within` selectors.

On mobile (< 768 px), the burger drawer renders the parent as an expandable item. Tapping it toggles a `useState` boolean that opens/closes the nested list inline.

**Why over a headless menu library (Radix Menu):** the surface here is small — one parent, three children, no keyboard arrow navigation across siblings, no checkable items. CSS + a single `useState` is enough. Adding `@radix-ui/react-navigation-menu` would be ~15 KB of behavior we don't need. If the nav grows another submenu, we can revisit.

### S4. Préstamos submenu shape is auth-gated and nested

**Decision:** The Préstamos submenu is computed declaratively from `useAuth()`:

- Guest: `Catálogo`, `Iniciar sesión` (`/prestamos/login`).
- Member (`is_admin === false`): `Catálogo`, `Mis préstamos`, `Cerrar sesión` (action → `logout()`).
- Admin (`is_admin === true`): `Catálogo`, `Mis préstamos`, `Administración` (nested parent), `Cerrar sesión`. The nested `Administración` reveals a second-level submenu with `Miembros` (`/prestamos/admin/members`) and `Contenido` (`/prestamos/admin/content`).

`Iniciar sesión` replaces the bespoke `NavBar`'s standalone login button. `Cerrar sesión` lives inside the submenu (default) for symmetry with `Iniciar sesión`; an alternative — a separate `<Button>` outside the submenu — is documented but not chosen.

**Why:** consolidates auth actions in one entry point, makes the visible-item set predictable per role, and the single auth-gated entry plus the nested admin branch keeps `<SiteHeader>` declarative — the rendered list is a pure `filter` over a static config keyed by role.

### S4b. Nested Administración submenu

**Decision:** The nested Administración submenu reuses the same opening pattern as its parent — CSS-only `:hover` / `:focus-within` on desktop, `useState`-driven expand on mobile. No third level beyond `Administración → {Miembros, Contenido}`.

**Why over a flat admin section:** keeps admin-only routes hidden one level deeper, matching the existing privilege boundary in the lending app and reducing visual clutter for non-admin users who never see this branch anyway.

### S5. Login / forgot / set-password pages use a minimal shell

**Decision:** `LoginPage`, `ForgotPasswordPage`, `SetPasswordPage` continue to render without the full `PageLayout`. They get a minimal layout: just the club logo centered, no nav, no footer.

**Why:** these pages are unauthenticated funnel pages. Showing the full nav (with `Mis préstamos`, possibly `Administración`) when the user isn't logged in invites confusion. A minimal layout matches what most product sites do for auth pages.

**Implementation:** introduce a `<MinimalPageLayout>` component (logo only) and route those three pages through it. Both layouts can later be unified if needed.

### S6. Active-route highlighting via React Router `useMatch`

**Decision:** `SiteHeader` consumes `useMatch` from `react-router-dom` to compute active state. `Préstamos` parent is active when `useMatch("/prestamos/*")` matches. Submenu items use `useMatch` with their exact path. Static-page items use `window.location.pathname` since they are not React Router routes.

**Why:** `useMatch` is the canonical React Router primitive and avoids string-comparison footguns. The static-page case is a real edge — falling back to `window.location.pathname` is OK because those routes never change inside the SPA.

### S7. Mobile breakpoint: 768 px

**Decision:** The breakpoint between desktop nav and burger drawer is **768 px**, declared as a token (`--bp-md`) in Phase A's `tokens.css`.

**Why:** matches the club site's own breakpoint per the scraped CSS, and aligns with the project's mobile-first decision (D8 in the archived plan-lending-redesign).

### S8. Footer drops the language selector; everything else preserved

**Decision:** The new `<SiteFooter>` reproduces the scraped club site's footer (copyright line, social icons, club address if present, repo / contact links if present) **minus** the language selector. All other content is preserved as-is.

**Why:** Decision D6 — Spanish only. The selector has no purpose now and would mislead users.

## Risks / Trade-offs

- **Visual drift between scraped HTML and our React shell** → since the React shell is hand-rebuilt, the source site can drift from us as Sites editors change things. Mitigation: when the scraper next runs and the manifest diff shows header/footer markup changes, we read the diff and decide whether to mirror the change in `SiteHeader`/`SiteFooter`. Document this responsibility in the scraper README.
- **Two navigation experiences (SPA submenu and static-page top-level link)** → users moving between `/prestamos` and `/calendario` get a full-page reload. Acceptable for now; the existing-site replication track's Phase 1 unifies them.
- **The static content pages' nav still doesn't list "Préstamos"** → leave a TODO in `tasks/lending-redesign/plan-replicate-existing-site.md` so this is fixed when the static pages move to React. In the meantime, members reach the lending app via existing bookmarks or the explicit `/prestamos` URL.
- **Role-gated submenu item depends on `AuthContext` being available at render time** → `<SiteHeader>` is rendered inside `<PageLayout>` which is rendered inside `<AuthProvider>` (existing). Verified by writing `SiteHeader.test.tsx` against an in-test `<AuthProvider>` mock for both "guest", "member", "admin" cases.
- **Keyboard accessibility of the Préstamos submenu** → `:focus-within` handles tab-into-submenu on desktop. We test with the keyboard during manual smoke. WCAG 2.1 AA target (Decision D9 in archived plan).
- **Mobile burger contrast on long pages** → the burger control has the same dark-bar background; if a page scrolls and the burger remains stuck/sticky, contrast stays consistent. We pin the header sticky on top.

## Migration Plan

Single PR on `development`, branch `feature/site-shell-from-scraped-html`, sequenced after `lending-design-tokens-and-primitives` is merged so the tokens and `<Button>` primitive exist:

1. Sketch `SiteHeader` and `SiteFooter` markup against `frontend/public/content-mirror/index.html` rendered locally (Caddy on the dev box, or just `open frontend/public/content-mirror/index.html` for a static read).
2. Build `<SiteFooter>` first (smaller surface — copyright, social links, drop language selector). Test it renders without the language selector.
3. Build `<SiteHeader>` desktop layout — flat top-level links. Active highlighting via `useMatch` for `/prestamos/*`, `window.location.pathname` for others. Test active state for each item.
4. Add the Préstamos submenu (CSS hover + `:focus-within`). Test desktop hover/focus opens it; submenu items are reachable by keyboard.
5. Add role gating on `Administración`. Test guest/member/admin variants.
6. Add the mobile burger drawer with nested-expand for Préstamos. Test < 768 px viewport.
7. Build `<PageLayout>` composing the three. Test it renders header, main, footer.
8. Build `<MinimalPageLayout>` (logo only). Wrap `LoginPage`, `ForgotPasswordPage`, `SetPasswordPage`.
9. Update `App.tsx`: wrap authenticated routes in `<PageLayout>`, wrap auth funnel routes in `<MinimalPageLayout>`. Remove the global `<NavBar />` mount.
10. Delete `frontend/src/components/NavBar.tsx` + `NavBar.css` + `NavBar.test.tsx`.
11. Add a TODO marker to `tasks/lending-redesign/plan-replicate-existing-site.md` Phase 1 about updating the static pages' nav to include `Préstamos` once they are React.
12. Run the gauntlet: `npm run typecheck && npm run lint && npm test && npm run build && cd ../e2e && npx playwright test`.
13. Manual side-by-side: open `frontend/public/content-mirror/index.html` and the dev server's `/prestamos/` in two windows. Confirm visual parity for header (logo, font, color, spacing) and footer (layout, social links, copyright).

Rollback: revert the merge commit. The bespoke `NavBar` reappears.

## Open Questions

### Resolved 2026-04-25

- ~~**S-Q1.**~~ Preserve **all** scraped footer content (copyright, social links, contact, addresses, repo links — whatever is in the scraped HTML). Drop **only** the language selector. No exceptions.
- ~~**S-Q2.**~~ No logo-variant work needed. The new `<SiteHeader>` mirrors whatever logo + background the scraped page uses for that surface — if the scraped header is dark, our header is dark and uses the same logo asset; if light, light. The scraped tree already includes whatever variants it needs (`frontend/public/content-mirror/_assets/`), and we reference those rather than shipping new SVGs.
- ~~**S-Q3.**~~ Préstamos parent is **clickable** — `<Link to="/prestamos/">`. Hover/focus still reveals the submenu. Revisit if pure-trigger turns out cleaner in practice.

### Still outstanding

- **S-Q4.** When a static page is loaded, the React shell isn't rendering — the user sees the scraped page's own header/footer. Does that matter for v1? Default: no, that's the documented split until replicate-existing-site Phase 1.
