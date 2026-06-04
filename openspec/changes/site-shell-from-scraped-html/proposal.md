## Why

The lending React app currently renders a bespoke `NavBar` and no footer. The wider club site (`refugiodelsatiro.es`, mirrored at `frontend/public/content-mirror/` and served by Caddy at `/`, `/calendario`, ...) has its own header and footer. Having two visual identities on the same domain is jarring and undercuts the Phase A token unification.

This change builds a single page shell — a `<PageLayout>` with the existing site's header and footer — and wraps the lending React routes in it. The top-level nav is **data-driven**: the scraper extracts the live top-level nav items from the scraped `<header>` — including their L2 submenu children — and writes a small `_nav.json` file alongside the content mirror. The React `<SiteHeader>` fetches that file at boot and renders the items, rendering any item with `children` as a hover/focus/tap-revealed dropdown that mirrors the source site's submenus, and appending a Préstamos parent (with auth-gated submenu of `Catálogo`, `Mis préstamos`, `Iniciar sesión` / `Cerrar sesión`, and admin-only `Administración` → `Miembros` / `Contenido`) as the last item. This replaces the lending app's bespoke nav and keeps the React shell automatically in sync with the source site's nav.

Scope is **only the lending React routes**. The static content pages (`/`, `/calendario`, `/eventos`, ...) remain served by Caddy from the content mirror in this change; their port to React is a later concern owned by the existing-site replication track (`tasks/lending-redesign/plan-replicate-existing-site.md` Phase 1).

## What Changes

- **Add `<PageLayout>`** at `frontend/src/components/PageLayout/{PageLayout.tsx, PageLayout.module.css, PageLayout.test.tsx, index.ts}` composing `<SiteHeader />` + `<main>` + `<SiteFooter />`.
- **Add `<SiteHeader>`** that visually matches the scraped club site's header (logo + horizontal nav, dark-bar variant per style-guide §5.1) and renders a top-level nav whose static-page items are **fetched from `/_nav.json`** (emitted by the scraper). Each fetched item may carry an optional `children` array; when present, the item renders with a chevron and a hover/focus-revealed dropdown listing each child as an `<a href>` (mobile: tap-to-expand inside the drawer). After the fetched items, append **`Préstamos`** (React Router `<Link to="/prestamos/">`) with an auth-gated submenu:
  - `Catálogo` → `/prestamos/` — always visible.
  - `Mis préstamos` → `/prestamos/my-loans` — visible only when a member is logged in.
  - `Iniciar sesión` → `/prestamos/login` — visible only when **not** logged in.
  - `Cerrar sesión` → action — visible only when logged in.
  - `Administración` (nested parent) — visible only when `member?.is_admin === true`. Contains `Miembros` → `/prestamos/admin/members` and `Contenido` → `/prestamos/admin/content`.
  
  The `Préstamos` parent links to `/prestamos/` on click; hovering or focusing it reveals the submenu (mobile: tap-to-expand). If `_nav.json` is missing or malformed, the header still renders with only the `Préstamos` parent.
- **Add `<SiteFooter>`** that visually matches the scraped club site's footer markup, **without the language selector** (we are Spanish-only for now). Other footer content (copyright, social links, addresses if present in the scraped footer) is preserved.
- **Wrap authenticated lending routes** in `frontend/src/App.tsx` with `<PageLayout>`: `/`, `/games/:id`, `/my-loans`, `/admin/members`, `/admin/content`. Login / forgot / set-password keep a minimal layout (decision S5).
- **Delete the lending app's bespoke `NavBar`** (`frontend/src/components/NavBar.tsx` and `NavBar.css`) once `<SiteHeader>` is wired in. Strip the `.btn`/`.btn-primary`/`.btn-secondary` classes that lived in `NavBar.css` (Phase A's group 7 already migrated every consumer to `<Button>`).
- **Active-route highlighting**: the `Préstamos` top-level item is rendered as active when the current path starts with `/prestamos/`. Submenu items are active when their exact path matches. Fetched static-page items are active when `window.location.pathname` matches their `href` exactly.

- **Scraper nav extraction**: the scraper (Python, `scraper/`) gains a `nav_extractor` module that parses the top-level `<header>` of the scraped root page and writes `frontend/public/content-mirror/_nav.json` with the shape `{ version: 1, generated_at, items: [{label, href, children?: [{label, href}, ...]}] }`. Each top-level `<li>`'s first descendant `<a>` is the parent; any later `<a>` descendants in the same `<li>` are serialised as `children` (L2 submenu items). Items whose `href` is exactly `/prestamos` or starts with `/prestamos/` are excluded (the React shell owns that branch); the same skip rule applies to children. The `children` key is omitted when empty. The file is written atomically; on extraction failure the previous file is left in place.
- **Mobile burger menu**: viewports < 768px collapse the nav into a hamburger control; the `Préstamos` submenu becomes a nested expandable inside the drawer. Fetched items that carry `children` likewise expand inline inside the drawer.
- **Cross-link from static pages**: leave a TODO marker (in code or in `tasks/lending-redesign/plan-replicate-existing-site.md`) for the eventual update of the scraped/content-mirror pages so their nav also points at the lending app's routes once the static pages are themselves React. **Out of scope here**.

## Capabilities

### New Capabilities

- `site-shell`: The single page shell (header, top nav with role-aware submenus, footer) used by every page rendered by the React app. Owns the visual identity that mirrors the scraped club site, plus the routing-aware active-state behavior. Future static-content pages (replicate-existing-site Phase 1) will compose this same shell.

### Modified Capabilities

- `lending-design-system`: The `<PageLayout>` and "PageLayout shell" requirements that originally lived here are now satisfied by `site-shell`. This change MODIFIES the `<PageLayout>` requirement so that its scenarios point at `site-shell` as the implementing capability.

## Impact

- **Frontend**:
  - **Add**: `frontend/src/components/PageLayout/`, `frontend/src/components/SiteHeader/`, `frontend/src/components/SiteFooter/`. Each is a folder with `.tsx`, `.module.css`, `.test.tsx`, `index.ts`.
  - **Delete**: `frontend/src/components/NavBar.tsx`, `NavBar.css`, `NavBar.test.tsx` (if any).
  - **Modify**: `frontend/src/App.tsx` (route wrapping), every page that imported `<NavBar />` directly (none currently — `NavBar` was rendered globally inside `App.tsx`).
- **Dependencies**: none added or removed. The `Préstamos` submenu uses native CSS `:hover`/`:focus-within` for desktop and a small piece of state for mobile burger; no headless-menu library required for this scope.
- **Backend**: scraper module gains `scraper/nav_extractor.py` (pure transform), a write helper for `_nav.json` in `scraper/writer.py`, an orchestrator hook that runs the extractor on the root page, an optional `nav_sha256` field in `scraper/manifest.py`, and a Caddy cache header for `/_nav.json` in the `Caddyfile`.
- **Tests**: snapshot + behavior tests for `SiteHeader` (active highlighting, submenu open/close, role-gated `Administración` visibility, mobile burger), `SiteFooter` (renders without language selector), `PageLayout` (composes header + main + footer).
- **Visual fidelity reference**: `frontend/public/content-mirror/index.html` is the *visual reference* (note: there is **no** `content.css` — styles live inline in `<style>` blocks in the scraped HTML; sample computed values via DevTools). We do not embed the scraped markup verbatim (Google Sites HTML is obfuscated and the new `Préstamos` submenu can't be added cleanly to it). The React shell renders fetched items as plain `<a href>` and is styled with design-system tokens that match the live header (new tokens `--color-header-bg`, `--color-header-fg`, `--color-header-fg-hover`, `--color-header-fg-active`, `--color-header-divider`, `--header-height`, `--header-z` added to `tokens.css`).
- **Out of scope**:
  - Porting the static content pages (`/`, `/calendario`, `/eventos`, ...) to React — they keep being served by Caddy from the content mirror.
  - Updating those static pages' own nav to include the lending app — TODO for replicate-existing-site Phase 1.
  - Reintroducing a language selector.
- **Rollback**: revert the merge commit on `development`. The lending app then reverts to the bespoke `NavBar`.
