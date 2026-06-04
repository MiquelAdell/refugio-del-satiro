# site-shell Specification

## Purpose

Defines the single page shell — header, top navigation with the Préstamos submenu, footer, and the layout that composes them — used by every page rendered by the React app. The shell visually mirrors the scraped club site (`frontend/public/content-mirror/`) and routes both static-content destinations and lending-app destinations from a single nav. The static content pages themselves are still served by Caddy from the content mirror; this capability owns only the React side of the shell. The top-level nav items for static pages are **data-driven**: the scraper writes `_nav.json` and the React shell fetches it at boot, so editorial changes on the source site flow through automatically on the next scrape.

## ADDED Requirements

### Requirement: PageLayout composes header, main, footer

The system SHALL provide a `<PageLayout>` component at `frontend/src/components/PageLayout/` that composes `<SiteHeader />`, a `<main>` element with the page-content container, and `<SiteFooter />`. Every authenticated lending route SHALL render inside `<PageLayout>`.

#### Scenario: PageLayout structure
- **WHEN** `<PageLayout>` renders
- **THEN** its DOM SHALL contain `<SiteHeader />`, `<main>`, and `<SiteFooter />` in that order
- **AND** children passed to `<PageLayout>` SHALL render inside `<main>`

#### Scenario: Authenticated routes wrap with PageLayout
- **WHEN** the catalog (`/`), my-loans (`/my-loans`), game-detail (`/games/:id`), admin members (`/admin/members`), or admin content (`/admin/content`) routes render
- **THEN** their top-level JSX SHALL be `<PageLayout>...</PageLayout>`

### Requirement: Scraper writes _nav.json

The scraper SHALL extract the top-level navigation from the scraped root page's `<header>` (after internal-href rewriting) and write `frontend/public/content-mirror/_nav.json` with the shape `{ "version": 1, "generated_at": ISO8601, "items": [{ "label": string, "href": string, "children"?: [{ "label": string, "href": string }, ...] }] }`. For each top-level `<li>`, the first descendant `<a>` is the parent and any later `<a>` descendants in the same `<li>` are serialised as `children`. The `"children"` key SHALL be omitted when the list is empty. Items whose `href` equals `/prestamos` or starts with `/prestamos/` SHALL be excluded; the same rule SHALL apply to children. Fragment-only hrefs (`#…`) and absolute external URLs SHALL be excluded (at both levels). Top-level items and children SHALL each be deduplicated by `(label, href)` preserving source order. The file SHALL be written atomically (write to a temp file, then `os.replace`). The write SHALL run only when the scraper processes the canonical root page; other pages do not trigger it.

#### Scenario: Happy-path extraction
- **WHEN** the scraper processes the canonical root page and the header contains top-level items pointing at `/`, `/calendario`, `/eventos`, and `/prestamos`
- **THEN** `_nav.json` SHALL contain `items` with three entries (root, calendario, eventos) in source order
- **AND** the `/prestamos` entry SHALL be excluded

#### Scenario: L2 submenu children preserved
- **WHEN** a top-level `<li>` contains additional `<a>` descendants after its parent anchor (e.g. an `Eventos` parent with `Diürnes del Sàtir`, `Festa Major`, `24h Juegos de Mesa` children)
- **THEN** the serialised item for `Eventos` SHALL include a `"children"` array carrying those entries in source order
- **AND** each child SHALL be a `{ "label", "href" }` object with the same skip rules applied

#### Scenario: children key omitted when empty
- **WHEN** a top-level item has no L2 anchors
- **THEN** its serialised JSON SHALL NOT include a `"children"` key

#### Scenario: Préstamos boundary
- **WHEN** a scraped item has `href = "/prestamos-info"`
- **THEN** the item SHALL be kept (the exclusion rule matches only `/prestamos` exactly or `/prestamos/…` prefixed paths)

#### Scenario: Extraction failure leaves previous file untouched
- **WHEN** the scraper fails to locate the nav container, or extraction returns an empty list
- **THEN** `_nav.json` SHALL NOT be overwritten
- **AND** a warning SHALL be emitted

#### Scenario: Atomic write
- **WHEN** the scraper writes `_nav.json`
- **THEN** the write SHALL go to a temporary file and be promoted via atomic rename
- **AND** a partial / truncated `_nav.json` SHALL never be observable on disk

### Requirement: SiteHeader fetches nav data once at boot

The React shell SHALL provide a `useNavItems()` hook (and a sibling `<SiteNavProvider>`) that fetches `/_nav.json` exactly once at App boot, validates the response shape, and exposes `{ items, status }` (status: `loading | ready | error`). `<SiteHeader>` SHALL consume this hook. On HTTP failure, JSON parse failure, schema mismatch, or empty items, the hook SHALL return `status: "error"` with `items: []`; the header SHALL still render with only the Préstamos parent. The fetch SHALL use `cache: "no-store"` so a freshly-rescraped nav is picked up on next page load. Re-mounting `<SiteHeader>` SHALL NOT re-fetch — the request is owned by the App-level provider.

#### Scenario: Happy-path render
- **WHEN** `/_nav.json` returns valid items `[{label: "Inicio", href: "/"}, {label: "Calendario", href: "/calendario"}]`
- **THEN** `<SiteHeader>` SHALL render Inicio and Calendario as `<a>` elements in order
- **AND** the Préstamos parent SHALL appear after them

#### Scenario: Missing nav file
- **WHEN** `/_nav.json` returns 404
- **THEN** `<SiteHeader>` SHALL render only the Préstamos parent (no static items)
- **AND** no error SHALL be visible to the user

#### Scenario: Schema mismatch
- **WHEN** `/_nav.json` returns a body that does not validate against the expected shape
- **THEN** the hook SHALL return `status: "error"`, `items: []`
- **AND** the header SHALL behave as in the missing-nav-file scenario

#### Scenario: Single fetch at App boot
- **WHEN** the App mounts and any number of `<SiteHeader>` instances render
- **THEN** exactly one network request SHALL be made for `/_nav.json` per App lifetime

### Requirement: SiteHeader top-level navigation

`<SiteHeader>` SHALL render the club logo plus a horizontal top-level navigation. The static-page items SHALL be exactly those returned by `useNavItems()`, in the order returned. After those items, a Préstamos parent SHALL be appended.

#### Scenario: Top-level items rendered
- **WHEN** `<SiteHeader>` renders on a viewport ≥ 768 px with `useNavItems` returning items `A, B, C` and status `ready`
- **THEN** it SHALL render those items in order
- **AND** Préstamos SHALL appear as the last top-level item

#### Scenario: Static-page items are plain anchor tags
- **WHEN** any fetched nav item renders
- **THEN** it SHALL be an `<a href="...">` element (not a React Router `<Link>`)
- **AND** clicking it SHALL cause a full-page navigation

#### Scenario: Fetched item with children renders as a dropdown
- **WHEN** a fetched nav item has a non-empty `children` array
- **THEN** the top-level anchor SHALL render with a chevron indicator and `aria-haspopup="menu"`
- **AND** a `<ul role="menu">` SHALL contain each child as an `<a href="...">` wrapped in a `role="menuitem"` element
- **AND** hovering or focusing the parent (desktop ≥ 768 px) SHALL reveal the dropdown
- **AND** tapping the parent inside the burger drawer (< 768 px) SHALL expand the children inline

#### Scenario: Fetched item without children renders without a dropdown
- **WHEN** a fetched nav item has no `children` (or an empty `children` array)
- **THEN** no chevron, no `aria-haspopup`, and no submenu `<ul>` SHALL render for that item

#### Scenario: Préstamos and its submenu items are React Router links
- **WHEN** the Préstamos parent or any of its submenu items renders (excluding action items like Cerrar sesión)
- **THEN** it SHALL be a React Router `<Link to="...">` element
- **AND** clicking it SHALL be handled client-side without a full-page navigation

### Requirement: Préstamos submenu

The `Préstamos` parent SHALL link to `/prestamos/` and reveal a submenu when hovered (desktop), focused (keyboard), or tapped (mobile). The submenu contents are auth-gated as defined below.

#### Scenario: Submenu opens on hover (desktop)
- **WHEN** a user with viewport ≥ 768 px hovers the Préstamos parent
- **THEN** the submenu SHALL be visible

#### Scenario: Submenu opens on focus (keyboard, desktop)
- **WHEN** a user tabs into the Préstamos parent or any of its submenu items
- **THEN** the submenu SHALL be visible (via `:focus-within` or equivalent)

#### Scenario: Submenu opens on tap (mobile)
- **WHEN** a user with viewport < 768 px taps the Préstamos parent inside the burger drawer
- **THEN** the submenu SHALL expand inline below the parent
- **AND** tapping the parent again SHALL collapse the submenu

#### Scenario: Guest sees Catálogo + Iniciar sesión
- **WHEN** an unauthenticated visitor opens the Préstamos submenu
- **THEN** the submenu SHALL contain exactly `Catálogo` (`/prestamos/`) and `Iniciar sesión` (`/prestamos/login`)
- **AND** `Mis préstamos`, `Cerrar sesión`, and `Administración` SHALL NOT appear in the DOM

#### Scenario: Non-admin member sees Catálogo + Mis préstamos + Cerrar sesión
- **WHEN** an authenticated member with `is_admin === false` opens the Préstamos submenu
- **THEN** the submenu SHALL contain exactly `Catálogo`, `Mis préstamos`, and `Cerrar sesión`, in that order
- **AND** `Iniciar sesión` and `Administración` SHALL NOT appear in the DOM

#### Scenario: Admin sees all items including nested Administración
- **WHEN** an authenticated member with `is_admin === true` opens the Préstamos submenu
- **THEN** the submenu SHALL contain `Catálogo`, `Mis préstamos`, `Administración` (nested parent), and `Cerrar sesión`
- **AND** the `Administración` item SHALL itself reveal a nested submenu with `Miembros` (`/prestamos/admin/members`) and `Contenido` (`/prestamos/admin/content`)

#### Scenario: Nested Administración submenu open/close
- **WHEN** an admin hovers/focuses `Administración` on desktop, or taps it on mobile
- **THEN** the nested submenu with `Miembros` and `Contenido` SHALL appear
- **AND** on mobile, tapping `Administración` again SHALL collapse the nested submenu

#### Scenario: Cerrar sesión invokes logout
- **WHEN** an authenticated user activates the `Cerrar sesión` submenu item
- **THEN** the auth context's `logout()` action SHALL be invoked
- **AND** the user SHALL be navigated to a guest-appropriate page

### Requirement: Active-route highlighting

`<SiteHeader>` SHALL apply an `active` styling class to the nav item whose route matches the current location: the `Préstamos` parent when the path starts with `/prestamos/`, exact-path matching for Préstamos submenu items, and exact-path matching (against `window.location.pathname`) for fetched static-page items.

#### Scenario: Préstamos parent active under any /prestamos/ path
- **WHEN** the current path is `/prestamos/`, `/prestamos/my-loans`, `/prestamos/admin/members`, `/prestamos/games/42`, or any path starting with `/prestamos/`
- **THEN** the Préstamos parent nav item SHALL have the `active` class

#### Scenario: Submenu item active on exact match
- **WHEN** the current path is `/prestamos/my-loans`
- **THEN** the `Mis préstamos` submenu item SHALL have the `active` class
- **AND** `Catálogo` and the nested `Administración` parent SHALL NOT have the `active` class

#### Scenario: Fetched item active on exact match
- **WHEN** the fetched items include an entry with `href = "/calendario"` and the current path is `/calendario`
- **THEN** that nav item SHALL have the `active` class
- **AND** no other top-level item SHALL have the `active` class

### Requirement: Mobile burger drawer below 768 px

`<SiteHeader>` SHALL collapse the top-level navigation into a hamburger control on viewports < 768 px. Tapping the control SHALL open a drawer containing the same nav items (fetched items + Préstamos parent), with `Préstamos` rendered as an expandable parent whose submenu nests inline. The drawer SHALL be dismissible via the Escape key, body scroll SHALL be locked while it is open, and the hamburger button SHALL expose `aria-expanded` and `aria-controls`.

#### Scenario: Burger control visible below breakpoint
- **WHEN** the viewport width is < 768 px
- **THEN** the horizontal nav SHALL be hidden
- **AND** a hamburger control SHALL be visible in the header

#### Scenario: Drawer opens on tap
- **WHEN** the user taps the hamburger control
- **THEN** the drawer SHALL open
- **AND** it SHALL contain the same nav items in the same order

#### Scenario: Préstamos submenu nested in drawer
- **WHEN** the drawer is open and the user taps `Préstamos`
- **THEN** the submenu SHALL expand inline beneath the parent
- **AND** tapping `Préstamos` again SHALL collapse the submenu

#### Scenario: Fetched item with children nested in drawer
- **WHEN** the drawer is open and the user taps a fetched item whose `children` array is non-empty
- **THEN** that item's children SHALL expand inline beneath it as a list of `<a href="...">` links
- **AND** tapping the parent again SHALL collapse the children

#### Scenario: Escape closes the drawer
- **WHEN** the drawer is open and the user presses Escape
- **THEN** the drawer SHALL close and focus SHALL return to the hamburger button

### Requirement: SiteFooter mirrors scraped footer minus language selector

The `<SiteFooter>` component SHALL visually match the scraped club site's footer (`frontend/public/content-mirror/index.html` footer markup is the visual reference) and SHALL preserve all of its content **except the language selector**, which SHALL NOT appear in the new footer.

#### Scenario: Language selector absent
- **WHEN** `<SiteFooter>` renders
- **THEN** the DOM SHALL NOT contain a language selector control or its associated UI
- **AND** no `LanguageSelector` component SHALL be imported

#### Scenario: Other scraped-footer content preserved
- **WHEN** `<SiteFooter>` renders
- **THEN** it SHALL contain the copyright line, social links, and any other content present in the scraped footer (modulo the language selector)

### Requirement: MinimalPageLayout for auth funnel pages

The system SHALL provide a `<MinimalPageLayout>` component (logo only, no nav, no footer) used for `LoginPage`, `ForgotPasswordPage`, and `SetPasswordPage`.

#### Scenario: MinimalPageLayout structure
- **WHEN** `<MinimalPageLayout>` renders
- **THEN** the DOM SHALL contain the club logo and the children only
- **AND** there SHALL be no `<SiteHeader>` or `<SiteFooter>` in the rendered tree

#### Scenario: Auth pages use the minimal layout
- **WHEN** the routes `/login`, `/forgot-password`, or `/set-password` render
- **THEN** the top-level JSX SHALL be `<MinimalPageLayout>...</MinimalPageLayout>`

### Requirement: Bespoke NavBar removed

The lending app's previous bespoke navigation component SHALL be removed once the new shell is in place.

#### Scenario: NavBar files deleted
- **WHEN** the directory `frontend/src/components/` is listed
- **THEN** there SHALL be no `NavBar.tsx`, `NavBar.css`, or `NavBar.test.tsx` file

### Requirement: Site-shell embed on static content-mirror pages

**Resolves design.md S-Q4.** Every static content-mirror page SHALL include the React SiteHeader via a standalone IIFE embed bundle, so Préstamos and the auth-aware user actions are accessible from any page on the domain.

The scraper SHALL inject, into every page it writes:

1. `<div id="site-shell-root"></div>` as the first child of `<body>` — the React mount point.
2. A `data-gs-header="1"` attribute on the original Google Sites `<header>` element — used by the bundle to hide it via CSS.
3. `<script src="/_assets/site-shell.js" defer></script>` before `</body>` — loads the IIFE bundle.

The injection SHALL be idempotent (safe to apply twice).

A standalone `vite build --config vite.config.site-shell.ts` SHALL produce `frontend/public/content-mirror/_assets/site-shell.js` as a single, self-contained IIFE bundle (React bundled in, CSS injected at runtime). Caddy SHALL serve this file with `Cache-Control: public, max-age=300` (not immutable).

#### Scenario: Shell mount point injected
- **WHEN** the scraper writes any page
- **THEN** the output HTML SHALL contain `<div id="site-shell-root">` as the first child of `<body>`
- **AND** the original `<header>` SHALL have `data-gs-header="1"`
- **AND** `<script src="/_assets/site-shell.js" defer>` SHALL appear before `</body>`

#### Scenario: Injection is idempotent
- **WHEN** inject_site_shell() is called twice on the same document
- **THEN** exactly one `#site-shell-root` div SHALL exist
- **AND** exactly one `/_assets/site-shell.js` script SHALL exist

#### Scenario: Guest on static page sees Iniciar sesión
- **WHEN** an unauthenticated user visits a static content-mirror page (e.g. `/calendario/`)
- **THEN** `#site-shell-root` SHALL be visible in the DOM
- **AND** an "Iniciar sesión" link pointing to `/prestamos/login` SHALL be visible
- **AND** `[data-gs-header]` SHALL be hidden

#### Scenario: Member on static page sees display name and Cerrar sesión
- **WHEN** an authenticated member visits a static content-mirror page
- **THEN** the member's display name SHALL be visible in the header actions area
- **AND** a "Cerrar sesión" button SHALL be visible
- **AND** no source file under `frontend/src/` SHALL import a component named `NavBar`
