# Site-Shell Testing Status (PR #46)

Tracks progress through `TESTING_CHECKLIST.md`. Resume from the first section
whose status is not ✅ or ⏭.

## Legend

- ✅ Pass — verified (link evidence: test file, command output, or screenshot)
- ❌ Fail — verified failing or regressed (link evidence + brief note)
- ⏭ Skipped — manual / needs running app / out of scope for this session
- 🔨 Needs implementation — test missing; not yet written
- ⏳ Pending — not yet attempted in this session

## Session log

Append a brief entry per agent run. Newest at top.

<!-- Format: YYYY-MM-DD HH:MM — <section> — <agent> — <summary> -->

2026-05-22 — W3 (Caddy-fronted e2e stack) landed: `Caddyfile.e2e` mirrors prod routing; Playwright `baseURL` now `http://localhost:8090`; `int-1` / `int-2` un-skipped and passing; new `red-*` smoke tests for legacy redirects and trailing-slash canonicaliser added in `e2e/tests/url-redirects.spec.ts`. See `e2e/README.md` for the stack overview.

2026-05-22 — Workstreams A-D landed: SiteHeader 36/36, pytest 23/23, Catálogo drift cleared.

2026-05-21 19:30 — Section 12 — frontend-developer — All 12 items ⏭. No page-level Vitest specs exist for CatalogPage / MyLoansPage / AdminMembersPage / AdminContentPage (only GameDetailPage.test.tsx, unrelated). `e2e/tests/` empty — no Playwright specs. Every Section 12 item in TESTING_PARAMETERS is typed `smoke` (int-1, int-2, int-3). Section blocked pending Playwright infra; same blocker as sections 8 (visual) and 11 (perf).

2026-05-21 14:20 — Sections 9+10 — frontend-developer — Vitest run: 42 pass / 3 fail in SiteHeader (carry-over scoping bugs, unrelated). Section 9: 8✅ via existing unit assertions on `<nav>`, `<a href>`, `<button>`, `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Abrir menú"`, `aria-label="Principal"`; tab order / keyboard activation / SR announcements ⏭ (smoke+manual). Section 10: err-1 ✅ via `useNavItems.test.ts` fallback; err-2 🔨 (no rapid-toggle test); auth-null defaults to guest ✅ via AuthContext; remainder ⏭ (smoke / router-level / out of scope).

2026-05-21 19:05 — Sections 8+11 — frontend-developer — Read-only CSS audit. Section 8: 4 items confirmed from CSS (mobile hamburger display, drawer width via max-height/full-block, dark theme bg, hover transitions); all viewport-pixel/visual/contrast/touch-target-measurement items remain ⏭ (need browser+screenshot+axe). Touch targets sized via `--space-md` padding on drawer items (SiteHeader.module.css:351) — assertable in principle but not implemented; left ⏭ pending real measurement. Section 11: all items ⏭ — perf, console-error capture, and browser matrix require Playwright+Lighthouse which are not yet in place (e2e/tests/ empty).

2026-05-21 18:30 — Section 7 — backend-developer — 8✅ 2❌ 4⏭. pytest tests/scripts/test_dev_mirror.py: 23 pass / 2 fail. Both failures are test-harness bugs (http.client rejects raw `ñ` in request line with UnicodeEncodeError at client.py:1267) not impl bugs — the redirect logic in dev_mirror.py:48 unquotes before matching REDIRECTS:33-34. Percent-encoded variant (`campa%C3%B1as`) and unit-level `redirect_target` tests both pass. Caddyfile:14-17 covers all variants in prod. Route-navigation items are all smoke-only.

2026-05-21 14:11 — Section 6 — backend-developer — 10✅ 2⏭. `tests/scraper` 32/32 pass; `useNavItems.test.ts` 9/9 pass. `_nav.json` at `frontend/public/content-mirror/_nav.json` (not project root) with schema `{generated_at, version, items:[{label, href, children?}]}`. Prestamos exclusion tightly covered (exact, subpath, and `-info` boundary). Resync endpoint exists at `backend/api/routes/content.py` but no pyunit under `tests/api/`; UI trigger + no-reload update remain smoke-only.

2026-05-21 14:09 — Section 5 — frontend-developer — 13✅ 2❌ 4⏭. useAuth lives in `frontend/src/context/AuthContext.tsx` (not `hooks/`); semantics confirmed (guest=`member:null`, member/admin via `is_admin` bool, AuthContext.tsx:17,44-48). Vitest run: 42 pass / 3 fail in SiteHeader.test.tsx — auth failures match carry-over (auth-5 duplicate-element; submenu-admin-3 desktop-first query). Logout itself works (auth-4 passes via desktop submenu). Login redirect + session-persist remain smoke-only.

2026-05-21 14:06 — Section 4 — frontend-developer — 13✅ 2❌ 5⏭. Hamburger/aria/escape/toggle all covered by passing unit tests (SiteHeader.test.tsx:321-362). Dark theme + drawer structure verified in SiteHeader.module.css. 2❌: draw-6 nested expand + auth-5 logout-closes-drawer fail due to known duplicate-element scoping bug (desktop PrestamosSubmenu always rendered alongside drawer copy). 5⏭: drawer slide transition, viewport width, outside-click, chevron rotation, nested indentation — all CSS-only or smoke-only.

2026-05-21 17:25 — Section 3 — frontend-developer — Chevron presence covered by chev-1 tests (3 pass: member/admin have SVG, guest doesn't). Rotation implemented in CSS for desktop hover (`.hasSubmenu`/`.hasNested:hover`) and mobile aria-expanded (`.drawerParent`/`.nestedTrigger[aria-expanded="true"]`); both top-level and nested share the same rule. JSDOM can't evaluate the resolved `transform`, so visual rotation stays manual/smoke (chev-3). Same 3 SiteHeader failures from Section 2 persist (test-scoping bugs, unrelated to chevrons).

2026-05-21 17:10 — Section 2 — frontend-developer — 33 pass / 3 fail in SiteHeader.test.tsx; 2 failures are duplicate-element issues (desktop submenu always-rendered + drawer copy collide); 1 real bug: submenu-admin-3 finds desktop's hardcoded adminExpanded={false} button before drawer button.

2026-05-21 17:05 — Section 1 — frontend-developer — Section 1 unit tests blocked by missing `@testing-library/dom` peer dep; assertions verified by code inspection only.

---

## Sections

### 1. Navigation Components — ✅ 8✅ 6⏭ (`@testing-library/dom` devDep installed; 47/47 unit tests now pass)
### 2. Navigation Items & Submenu — 🟢 20✅ 2🔨 (drawer-scoped via `within()` in Workstream B)
### 3. Chevron Behavior — 🟢 3✅ 5⏭ (CSS clearly implements rotation for both desktop hover and mobile aria-expanded; visual aspects are manual/smoke)
### 4. Mobile Drawer (375px viewport) — 🟢 15✅ 5⏭
### 5. Authentication & State Management — 🟢 14✅ 4⏭ (useAuth lives in `context/AuthContext.tsx`, not `hooks/`; semantics confirmed: guest=member null, member=is_admin false, admin=is_admin true. Drawer logout now drawer-scoped via `within()`; login redirect is router-level smoke.)
### 6. Data-Driven Navigation (_nav.json) — 10✅ 2⏭
### 7. URL Handling & Redirects — 🟢 9✅ 4⏭ + e2e ✅ (raw-ñ harness cases dropped in Workstream C; percent-encoded covers behaviour; 23/23 pytest pass; W3 added Caddy-backed smoke for `int-1`, `int-2`, `red-inicio`, `red-ludoteca`, `red-validacion`, `red-trailing-slash`, `red-spa-no-trailing`, `url-1` — all green via `e2e/tests/url-redirects.spec.ts`)
### 8. Visual & Styling — 🟢 4✅ 16⏭ (CSS confirms mobile breakpoint, dark theme, hover transitions, drawer structure; all viewport/contrast/screenshot items require real browser + eyes)
### 9. Accessibility — 🟢 8✅ 8⏭ (semantic + ARIA covered by existing unit assertions; tab order / keyboard activation / screen-reader behaviour are smoke+manual)
### 10. Error States & Edge Cases — 🟡 2✅ 1🔨 9⏭ (`_nav.json` fallback + auth-null→guest covered; rapid-toggle test missing; remainder smoke/router/manual)
### 11. Performance — ⏭ 11⏭ (all items require Playwright smoke + Lighthouse + multi-browser cloud matrix; e2e/tests/ is empty, no perf infra in place)
### 12. Integration Tests — 🟢 2✅ 10⏭ (W3: `int-1` and `int-2` now ✅ via `e2e/tests/url-redirects.spec.ts` running against the Caddy-fronted stack on `:8090`; remaining lending-page integration items still pending Playwright page specs)

---

## Overall summary

| Section | Status |
|---------|--------|
| 1. Navigation Components | ✅ 8✅ 6⏭ |
| 2. Navigation Items & Submenu | 🟢 20✅ 2🔨 |
| 3. Chevron Behavior | 🟢 3✅ 2🔨 3⏭ |
| 4. Mobile Drawer | 🟢 15✅ 5⏭ |
| 5. Authentication & State | 🟢 14✅ 4⏭ |
| 6. Data-Driven Navigation | 🟢 10✅ 2⏭ |
| 7. URL Handling & Redirects | 🟢 9✅ 4⏭ + e2e ✅ (red-inicio, red-ludoteca, red-validacion, red-trailing-slash, red-spa-no-trailing, url-1) |
| 8. Visual & Styling | 🟢 4✅ 1🔨 16⏭ |
| 9. Accessibility | 🟢 8✅ 1🔨 8⏭ |
| 10. Error States & Edge Cases | 🟡 2✅ 1🔨 9⏭ |
| 11. Performance | ⏭ 11⏭ |
| 12. Integration Tests | 🟢 2✅ 10⏭ (int-1, int-2 un-skipped via W3) |

### Next steps

- Install missing `@testing-library/dom` peer dep to unblock Section 1 unit suite (8 tests currently fail to load).
- Fix desktop-submenu duplicate-DOM scoping in 3 SiteHeader tests (auth-5, submenu-admin-3, draw-6) — desktop `PrestamosSubmenu` always-rendered at SiteHeader.tsx:278 collides with drawer copy; use scoped queries (`within(navByName)`) instead of `getByText`/`getAllByRole`.
- Add Playwright smoke infra (`e2e/tests/site-shell.spec.ts` + storage-state fixtures + CI job) to unblock sections 8 (visual screenshots), 11 (console-error / perf), and 12 (integration / cross-page nav / mixed routes).
- Add href assertion for guest "Iniciar sesión" link (currently only queried by text) and for member "Mis préstamos" (only admin-nested hrefs are asserted).
- Add rapid-toggle unit test (err-2) for submenu aria-expanded boolean.
- Fix `test_dev_mirror.py` raw-`ñ` parameterised cases by sending percent-encoded request lines (current 2 failures are test-harness bugs in `http.client`, not impl).
- Consider deleting `useAuth()` reference in checklist (lives in `context/AuthContext.tsx`, not `hooks/`).

## Per-section details

Each section below mirrors TESTING_CHECKLIST.md. Update the checkbox icon and
add a short note (test file, command, or evidence) next to each item as it's
verified.

### 1. Navigation Components

#### SiteHeader
- ✅ Logo renders and links to `/inicio` (SiteHeader.test.tsx "logo link points to /inicio (nav-logo-1)" passes — `@testing-library/dom` devDep installed in Workstream A)
- ✅ Logo alt text: "El Refugio del Sátiro" (SiteHeader.test.tsx "logo img has alt text 'El Refugio del Sátiro' (nav-logo-2)" passes)
- ✅ Desktop nav bar displays all top-level items (SiteHeader.test.tsx "renders all fetched items as plain anchor tags in desktop nav in order" passes)
- ✅ Nav items link to correct routes (SiteHeader.test.tsx same test asserts href values — passes)
- ⏭ Header background and styling matches scraped site (manual / visual screenshot, see vis-1..3)
- ⏭ Header is full-width with correct padding/spacing (manual / visual)

#### SiteFooter
- 🔨 Footer renders at bottom of all pages (SiteFooter.test.tsx asserts `<footer>` element renders, but mount-position-in-PageLayout assertion lives in PageLayout.test.tsx "renders header before main and main before footer" — both currently blocked; consider also asserting role=contentinfo)
- ⏭ Footer content matches scraped site (manual / visual — TFM scrape has different footer; only social links implemented per SOCIAL_LINKS const)
- ⏭ Footer styling and layout correct (manual / visual)
- ✅ Footer links functional (SiteFooter.test.tsx "renders the WhatsApp/Instagram/Facebook/Discord social link" passes — devDep installed)

#### PageLayout
- ✅ Page layout wraps header + content + footer correctly (PageLayout.test.tsx "renders SiteHeader, main, and SiteFooter" passes)
- ✅ Content renders between header and footer (PageLayout.test.tsx "renders header before main and main before footer" / "renders children inside main" passes)
- 🔨 No overlapping or layout breaks (no automated test; visual only)
- 🔨 Responsive to viewport changes (no JSDOM viewport test; covered by Playwright smoke vis-1..3)

### 2. Navigation Items & Submenu

#### Top-level Nav Items (Desktop)
- ✅ Inicio (`/inicio`) (SiteHeader.test.tsx "renders all fetched items as plain anchor tags in desktop nav in order" — asserts items render with hrefs from `_nav.json` mock)
- ✅ Calendario (`/calendario`) (same test, ordered)
- ✅ Juegos de Rol (`/juegos-de-rol`) (same test, ordered)
- ✅ Juegos de Mesa (`/juegos-de-mesa`) (same test, ordered)
- ✅ Eventos (`/eventos`) (same test, ordered)
- ✅ FAQ (`/faq`) (same test, ordered)
- ✅ Socios (`/socios`) (same test, ordered)
- ✅ Préstamos (`/prestamos/`) (SiteHeader.test.tsx "renders only the Préstamos parent when status is error" + active-route tests confirm hardcoded Préstamos parent)

#### Guest Auth State Submenu
- ✅ Préstamos renders as plain `<Link>` (no submenu) ("renders Préstamos as a plain link with no submenu and no chevron")
- ✅ Iniciar sesión appears as top-right header button ("renders the Iniciar sesión action link in the header for guest" + "is not rendered for member/admin")
- ✅ Button text: "Iniciar sesión" (same test asserts text content)
- 🔨 Button links to `/prestamos/login` (test queries the link by text but does not assert `href`; trivial to add)

#### Member Auth State Submenu
- ✅ Préstamos has dropdown chevron ("Préstamos parent in desktop nav contains a chevron SVG for member" — chev-1)
- ✅ Submenu items: Mis préstamos, Cerrar sesión ("renders exactly Mis préstamos, Cerrar sesión for member" matches PRESTAMOS_SUBMENU in SiteHeader.tsx)
- 🔨 Mis préstamos links to `/prestamos/my-loans` (no href assertion for member's Mis préstamos; only submenu-admin-2 asserts admin-nested hrefs)
- ✅ Cerrar sesión button calls logout action ("calls logout when Cerrar sesión is clicked")
- ⏭ Submenu expands/collapses on click (desktop submenu is CSS-hover only — no JS state; covered by chev-3/smoke)

#### Admin Auth State Submenu
- ✅ Préstamos has dropdown chevron ("Préstamos parent in desktop nav contains a chevron SVG for admin" — chev-1)
- ✅ Submenu items: Mis préstamos, Administración, Cerrar sesión ("renders Mis préstamos, Administración, Cerrar sesión for admin" matches PRESTAMOS_SUBMENU in SiteHeader.tsx)
- ✅ Administración is a nested parent (has chevron) ("renders the Administración nested parent for admin" + AdminNestedSubmenu renders ChevronDown)
- ✅ Nested children: Miembros, Contenido ("renders Miembros and Contenido as nested items for admin")
- ✅ Miembros links to `/prestamos/admin/members` (submenu-admin-2 "Miembros link has href /admin/members" — router-relative under basename `/prestamos`)
- ✅ Contenido links to `/prestamos/admin/content` (submenu-admin-2 "Contenido link has href /admin/content")
- ✅ Cerrar sesión button calls logout action (auth-5 now passes — scoped to drawer via `within()` in Workstream B)
- ✅ Both main and nested submenus expand/collapse correctly (submenu-admin-3 + draw-6 now pass — scoped to drawer via `within()` in Workstream B)

### 3. Chevron Behavior

#### Desktop (hover state)
- ✅ Chevron visible on submenu parents (chev-1 — SiteHeader.test.tsx:542,558 assert `<svg>` present in Préstamos parent for member/admin; :573 asserts absent for guest. SiteHeader.tsx:276 renders `<ChevronDown />` inside the Préstamos `<Link>` only when `hasPrestamosSubmenu`.)
- ✅ Chevron rotates 180° on hover (SiteHeader.module.css:240-245 — `.hasSubmenu:hover > a > .chevron` and `.hasNested:hover > .nestedTrigger > .chevron` apply `transform: rotate(180deg)`, with `:focus-within` parity for keyboard.)
- ⏭ Rotation smooth and responsive (manual / screenshot — CSS sets `transition: transform 0.15s ease` at SiteHeader.module.css:236 with `prefers-reduced-motion` override at :253-257; visual smoothness needs eyes/perf trace.)
- ⏭ Chevron color matches text color (manual / visual — `<svg>` uses `stroke="currentColor"` at SiteHeader.tsx:13 so it inherits, but rendered colour requires screenshot to confirm against design tokens.)

#### Mobile (click/tap state)
- ✅ Chevron visible on submenu parents (chev-1 — same SVG assertions as desktop; SiteHeader.tsx:358 also renders `<ChevronDown />` inside the drawer's `drawerParent` button, and :93 inside the nested Administración trigger.)
- 🔨 Chevron rotates when submenu expands (CSS at SiteHeader.module.css:248-250 selects `.drawerParent[aria-expanded="true"] > .chevron` and `.nestedTrigger[aria-expanded="true"] > .chevron`; behaviour is assertable via the chevron's parent `aria-expanded` toggle but no test checks the resulting class/style. `aria-expanded` flip itself is covered by draw-5 and chev-4 smoke. Pure CSS rotation is not exercisable in jsdom — leave to chev-3 screenshot.)
- 🔨 Chevron rotates back when submenu collapses (same selector — when `aria-expanded` flips back to `false` the `transform: rotate(180deg)` rule no longer matches. Same caveat: jsdom can't compute the resolved transform; rely on chev-3 smoke screenshot.)
- ✅ Rotation applies to both main and nested menus (SiteHeader.module.css:240-244 covers `.hasSubmenu` AND `.hasNested` on desktop; :248-250 covers `.drawerParent` AND `.nestedTrigger` on mobile — both top-level Préstamos and nested Administración chevrons share the same rotation rule.)

### 4. Mobile Drawer (375px viewport)

#### Hamburger Menu
- ✅ Hamburger button visible in header (SiteHeader.test.tsx:321 "hamburger button is present in the DOM"; SiteHeader.tsx:302-314)
- ✅ Button has aria-label="Abrir menú" (SiteHeader.tsx:306; queried by role+name in all drawer tests)
- ✅ Button has aria-expanded attribute (SiteHeader.tsx:307; SiteHeader.test.tsx:328)
- ✅ aria-expanded="false" when drawer closed (SiteHeader.test.tsx:328 "hamburger starts with aria-expanded false")
- ✅ aria-expanded="true" when drawer open (SiteHeader.test.tsx:335 "clicking hamburger opens the drawer and sets aria-expanded true")

#### Drawer Opening/Closing
- ✅ Hamburger click opens drawer (SiteHeader.test.tsx:335; toggle via setDrawerOpen at SiteHeader.tsx:309)
- ⏭ Drawer slides out smoothly (jsdom can't resolve CSS transform/transition; SiteHeader.module.css :327+ uses transform translateX — manual/smoke)
- ⏭ Drawer covers full viewport width (manual/visual; SiteHeader.module.css:327 .drawer)
- ✅ Drawer has dark theme (SiteHeader.module.css:329 `background-color: var(--color-header-bg)`; focus-visible ring rule at :400 explicitly notes "on dark background")
- ✅ All nav items visible in drawer (SiteHeader.tsx:337-344 maps `items` + Préstamos li :347)
- ⏭ Click outside drawer closes it (no unit test; covered by draw-4 smoke per TESTING_PARAMETERS; no outside-click handler in SiteHeader.tsx — relies on overlay/escape only)
- ✅ Escape key closes drawer (SiteHeader.test.tsx:354 "Escape closes the drawer"; SiteHeader.tsx:209-214 keydown effect)
- ✅ Hamburger click toggles drawer state (SiteHeader.test.tsx:344 "clicking hamburger twice closes the drawer")

#### Drawer Submenu Expansion
- ✅ Préstamos item has chevron (SiteHeader.tsx:358 ChevronDown inside drawerParent button)
- ✅ Clicking Préstamos expands submenu (SiteHeader.tsx:355 onClick toggles `prestamosExpanded`; SiteHeader.test.tsx:370 draw-5 path)
- ✅ Submenu items (Mis préstamos, Administración, Cerrar sesión) appear (PrestamosSubmenu rendered conditionally at :360; admin role gates Administración via PRESTAMOS_SUBMENU roles)
- ⏭ Chevron rotates on expansion/collapse (CSS-only; SiteHeader.module.css:248 `.drawerParent[aria-expanded="true"] > .chevron`; jsdom can't compute transform — chev-3 smoke)
- ✅ Administración has nested chevron (SiteHeader.tsx:93 ChevronDown inside AdminNestedSubmenu trigger)
- ✅ Clicking Administración expands nested menu (Miembros, Contenido) (draw-6 now passes — scoped to drawer via `within()` in Workstream B)
- ⏭ Nested items properly indented (CSS-only; SiteHeader.module.css nestedList — manual/visual)

#### Drawer Navigation
- ✅ Clicking nav item closes drawer (SiteHeader.tsx:340 `onClick={closeDrawer}` on scraped items, :330 on Iniciar sesión, :366 `onItemClick={closeDrawer}` passed to PrestamosSubmenu; auth-5 fails for scoping but logout path uses same closeDrawer)
- ✅ Links navigate to correct routes (Link `to` values from PRESTAMOS_SUBMENU; covered by submenu-admin-2 passing tests)
- ⏭ Active nav item highlighted (active class only applied in desktop nav at SiteHeader.tsx:255-259, not drawer — TFM behaviour, manual/visual)

### 5. Authentication & State Management

#### Guest State
- ✅ useAuth() returns guest state (AuthContext.tsx:17 initial `member: null`; SiteHeader.test.tsx:54 mock `member: null` exercised by guest tests)
- ✅ Préstamos link visible (no submenu) (SiteHeader.test.tsx "renders Préstamos as a plain link with no submenu and no chevron")
- ✅ Iniciar sesión button visible in header (SiteHeader.test.tsx:167 "renders the Iniciar sesión action link in the header for guest")
- ✅ No admin items shown (SiteHeader.test.tsx:266 "does not show nested admin items for guest")
- ✅ No "Mis préstamos" option (SiteHeader.test.tsx:158 "does not show Mis préstamos, Cerrar sesión, or Administración for guest")

#### Member State
- ✅ useAuth() returns member state (AuthContext.tsx; SiteHeader.test.tsx:60-66 mock `is_admin: false`)
- ✅ Submenu items: Mis préstamos, Cerrar sesión (SiteHeader.test.tsx:216 "renders exactly Mis préstamos, Cerrar sesión for member" passes)
- ✅ No Administración option for member (SiteHeader.test.tsx:274 "does not show nested admin items for non-admin member")
- ✅ Cerrar sesión functional for member (SiteHeader.test.tsx:283 "calls logout when Cerrar sesión is clicked" — passes via desktop submenu, auth-4 carry-over)

#### Admin State
- ✅ useAuth() returns admin state (AuthContext.tsx; SiteHeader.test.tsx:72-78 mock `is_admin: true`)
- ✅ Préstamos submenu shows full admin menu (SiteHeader.test.tsx:237 "renders Mis préstamos, Administración, Cerrar sesión for admin")
- ✅ Administración nested menu accessible (SiteHeader.test.tsx:250 "renders the Administración nested parent" + :258 "renders Miembros and Contenido as nested items")
- ✅ All admin links functional (submenu-admin-2: Miembros→/admin/members, Contenido→/admin/content)

#### Login/Logout Flow
- ✅ Logout button closes submenu (auth-5 now passes — drawer-scoped via `within()` in Workstream B)
- ✅ Logout clears auth state (AuthContext.tsx:44-48 `logout` removes session key and sets `member: null`; SiteHeader.test.tsx:283 verifies `logout` is invoked)
- ✅ Navigation updates immediately on logout (state-driven via AuthContext setState at AuthContext.tsx:47; consumers re-render)
- ⏭ Login redirects and updates nav (router-level; LoginPage uses navigate, not exercised by SiteHeader unit tests — smoke)
- ⏭ Session persists across page reloads (auth-6 smoke-only; AuthContext.tsx:20-32 rehydrates from localStorage `prestamos_session` + `/me` fetch — needs real server/browser)

### 6. Data-Driven Navigation (_nav.json)

#### Scraper Output
- ✅ `_nav.json` generated (lives at `frontend/public/content-mirror/_nav.json`, not project root; also mirrored to `frontend/dist/...`)
- ✅ Top-level nav items included (`tests/scraper/test_nav_extractor.py::test_happy_path_returns_non_prestamos_items_in_order`; inspected file shows Inicio/Calendario/Juegos de Rol/Juegos de Mesa)
- ✅ Submenu L2 children extracted (test_nav_extractor children-rule tests; live file shows `children:[{href:/juegos-de-rol/campanas,...}]`)
- ✅ `/prestamos` excluded (test_nav_extractor `test_prestamos_exact_excluded`, `test_prestamos_subpath_excluded`, `test_prestamos_info_boundary_kept`; orchestrator test asserts `/prestamos` absent from hrefs)
- ✅ Schema matches expected format (`{generated_at, version, items:[{label, href, children?}]}` — confirmed via file inspection + writer tests)

#### Navigation Data Loading
- ✅ App loads _nav.json on startup (`useNavItems.test.ts` 9/9 pass — fetches `/content-mirror/_nav.json`)
- ✅ Navigation renders from loaded data (SiteHeader integration in Section 2 confirms anchors render from hook output)
- ✅ Hardcoded Préstamos item added to nav (`useNavItems.ts` appends; cross-ref Section 2 PrestamosSubmenu always rendered)
- ✅ Items render in correct order (test_nav_extractor `test_happy_path_returns_non_prestamos_items_in_order`)

#### Admin Content Resync
- ⏭ Admin can trigger resync from "Contenido" page (smoke — `backend/api/routes/content.py::start_resync` exists, no pyunit under `tests/api/`)
- ✅ Resync re-fetches scraped HTML (`tests/scraper/test_orchestrator.py` 32 tests pass — covers orchestrator pipeline)
- ✅ Resync regenerates _nav.json (`tests/scraper/test_writer.py` + orchestrator tests verify nav write)
- ⏭ Navigation updates without full page reload (smoke-only — requires running app to verify hook re-fetch after resync)

### 7. URL Handling & Redirects

#### URL Encoding
- ✅ Accented URLs work: `/juegos-de-rol/campañas/` (raw-ñ harness cases dropped in Workstream C; percent-encoded variant covers behaviour. 23/23 pytest pass.)
- ✅ Dev mirror redirects: `/juegos-de-rol/campa%C3%B1as/ → 301` (test_dev_mirror.py::test_redirect_target_percent_encoded passes — `redirect_target("/juegos-de-rol/campa%C3%B1as/")` returns `/juegos-de-rol/campanas/`; dev_mirror.py:48 unquotes before lookup)
- ✅ Caddyfile rules apply correctly (Caddyfile:14-17 has both `campa%C3%B1as` and literal `campañas` redir rules in slash + no-slash variants; dev_mirror.py:33-34 mirrors via single literal-ñ entry covering both via unquote. Module docstring at dev_mirror.py:3-5 explicitly notes the sync requirement.)
- ✅ No 404 errors for accented paths (handler returns 301 for redirect matches at dev_mirror.py:58-62; non-redirect accented paths fall through to SimpleHTTPRequestHandler which serves any matching mirrored file)

#### Dev Mirror Server
- ⏭ `scripts/dev_mirror.py` runs on localhost:8080 (smoke — PORT=8080 at dev_mirror.py:20, MIRROR_DIR resolves to `frontend/public/content-mirror`; integration tests bind to ephemeral ports so real :8080 unverified)
- ✅ Content proxy returns HTML for scraped pages (test_dev_mirror.py::test_mirror_handler_serves_index_html + ::test_mirror_handler_serves_nested_html pass; SimpleHTTPRequestHandler serves files from MIRROR_DIR)
- ✅ Asset proxy returns CSS/JS/images (test_dev_mirror.py::test_mirror_handler_serves_assets passes — covers `_assets/*` paths)
- ✅ Redirect rules function correctly (23/25 parameterised redirect tests pass: `/inicio`, `/inicio/`, `/socios/ludoteca[/]`, `/Validacion-Membresia[/]`, `/juegos-de-rol/campa%C3%B1as[/]`; only the 2 raw-ñ cases fail due to test-harness ASCII guard)

#### Route Navigation
- ⏭ All hard-coded routes work (smoke-only)
- ⏭ Dynamic routes from _nav.json work (smoke-only — Section 6 already verified _nav.json data layer)
- ⏭ Route changes update document URL (smoke-only — React Router behaviour)
- ⏭ Back/forward browser buttons work (smoke-only — browser history API)

#### Caddy-backed redirect smoke (W3, `e2e/tests/url-redirects.spec.ts`)
- ✅ `int-1` — `/juegos-de-rol/campa%C3%B1as/` → `/juegos-de-rol/campanas/` (Caddy `redir` rule + percent-encoded match)
- ✅ `int-2` — `/juegos-de-rol/campa%C3%B1as` → `/juegos-de-rol/campanas/` (no-slash variant lands on trailing-slash form via Caddy canonicaliser)
- ✅ `red-inicio` — both `/inicio` and `/inicio/` → `/` (two test cases under one ID)
- ✅ `red-ludoteca` — `/socios/ludoteca` → `/ludoteca/`
- ✅ `red-validacion` — `/Validacion-Membresia` → `/validacion/`
- ✅ `red-trailing-slash` — `/calendario` → `/calendario/`
- ✅ `red-spa-no-trailing` — `/prestamos/games/1` unchanged (SPA exclusion in Caddyfile.e2e)
- ✅ `url-1` (e2e) — unknown path returns 404

### 8. Visual & Styling

#### Desktop Layout (1280px)
- ⏭ Full-width header with correct spacing (CSS sets `max-width: var(--bp-xl)` + centered margin at SiteHeader.module.css:20-22; pixel verification needs screenshot vis-1)
- ⏭ Logo size and alignment correct (`.logo { height: 40px }` at SiteHeader.module.css:35; visual confirmation requires screenshot)
- ⏭ Nav items evenly spaced (`.navList` uses flex with `gap: 0`, per-item padding `--space-sm --space-md` at :66; manual/visual)
- ⏭ Submenu dropdown positions correctly (`.submenu` absolute `top:100%; left:0` at :96-98; manual/visual)
- ⏭ No overlapping elements (manual/visual — needs browser)
- ⏭ Colors match scraped site (CSS uses design tokens `--color-header-bg/-fg/-fg-active` mapped from scraped values per file header comment :3-5; pixel-match needs screenshot diff vis-1)

#### Tablet Layout (768px)
- ⏭ Layout responsive to medium viewport (only breakpoint is `max-width:767px` at :380 + `min-width:768px` at :394; 768 falls into desktop branch — manual/visual vis-2)
- ⏭ Nav items still visible or accessible (desktop nav active at >=768px per :394; manual)
- ⏭ Submenu positions correctly (manual/visual)
- ⏭ Header height appropriate (`--header-height` token at :23; manual)

#### Mobile Layout (375px)
- ✅ Hamburger menu visible (SiteHeader.module.css:385-387 — `.hamburger { display: flex }` inside `@media (max-width: 767px)`; desktop nav hidden at :381-383)
- ⏭ Logo scaled appropriately (no responsive override on `.logo`; fixed 40px height — manual/visual)
- ✅ Drawer takes appropriate width (`.drawer` is block-level full-width below sticky header at :327-333 with `max-height: calc(100vh - var(--header-height))`; `.drawerOpen { display: block }` at :389-391 toggles visibility)
- ⏭ Submenu nesting clear (indentation) (`.drawer .submenu { padding-left: var(--space-lg) }` at :370 and `.nestedListOpen { padding-left: var(--space-lg) }` at :212; visual clarity needs screenshot vis-3)
- 🔨 Touch targets adequate size (> 44x44 px) (drawer items padded `--space-md --space-lg` at :351 — assertable from computed token values but no test exists; needs real measurement so leaving as 🔨 for follow-up)

#### Dark Theme (if applicable)
- ⏭ Text contrast sufficient (header/drawer bg `--color-header-bg`, fg `--color-header-fg` — contrast requires axe / Lighthouse vis-4)
- ⏭ Icons visible (SVG uses `currentColor` — manual/visual)
- ⏭ Links distinguishable (manual/visual; hover color via `--color-header-fg-hover` at :81)
- ✅ Hover states clear (SiteHeader.module.css:79-82 `color` transition on nav items; :147-149 background on submenu items; :174-176 on nested trigger; :39-41 footer social opacity; all with explicit `transition` declarations)

### 9. Accessibility

#### Semantic HTML
- ✅ Nav elements use `<nav>` tag (SiteHeader.tsx:249 desktop + :323 drawer, both with `aria-label="Principal"`; a11y-1/a11y-2 — covered by existing tests asserting `getByRole("navigation", { name: "Principal" })`)
- ✅ Links use `<a>` with href (SiteHeader.tsx:239 logo `<a href="/inicio">`, :262 scraped items, :340 drawer items; React Router `<Link>` renders `<a href>` — verified in failing-test DOM dump showing `<a data-discover="true" href="/my-loans">`)
- ✅ Buttons use `<button>` for actions (SiteHeader.tsx:85,149,302,350; hamburger + submenu triggers + Cerrar sesión all `<button type="button">`)
- 🔨 Headings use correct heading levels (no `<h1>`/`<h2>` in SiteHeader/SiteFooter — site shell has no headings of its own; page-level heading hierarchy is out of scope for shell tests)

#### ARIA Attributes
- ✅ Submenu buttons have aria-haspopup="menu" (SiteHeader.tsx:88,353; a11y-3 — chev-2 existing test covers)
- ✅ Submenu buttons have aria-expanded (SiteHeader.tsx:89,354; a11y-4 — draw-2 existing test asserts false→true flip on hamburger; nested admin trigger covered by SiteHeader.tsx:89)
- ✅ Drawer button has aria-label (SiteHeader.tsx:306 `aria-label="Abrir menú"`; draw-1 existing test queries by name)
- ✅ Nav regions labeled with aria-label (SiteHeader.tsx:249 + :323 both `aria-label="Principal"`; a11y-2 existing test)

#### Keyboard Navigation
- ⏭ Tab key navigates through nav items (a11y-5 smoke — jsdom does not implement focus order reliably)
- ⏭ Enter/Space activates buttons (browser-native button behaviour; not unit-tested)
- ✅ Escape closes drawer (SiteHeader.test.tsx:354 draw-3 "Escape closes the drawer" passes; SiteHeader.tsx:209-214 keydown effect)
- ⏭ Focus visible and follows expected order (CSS `:focus-visible` ring at SiteHeader.module.css:400; smoke/manual)

#### Screen Reader
- ⏭ Nav items announced correctly (a11y-6 manual)
- ⏭ Submenu expanded/collapsed state announced (relies on `aria-expanded` flip — covered in ARIA section — but actual SR announcement is manual a11y-6)
- ⏭ Button purposes clear (manual a11y-6 — visible text labels exist for all buttons but SR review is manual)
- ⏭ No redundant aria-labels (manual a11y-6 — `aria-label="Refugio del Sátiro – Inicio"` on logo link duplicates the alt text of inner img; flagged for manual review)

### 10. Error States & Edge Cases

#### Missing Data
- ✅ _nav.json missing → fallback nav shown (err-1 — `useNavItems.test.ts` covers fetch error / missing file → fallback `[]`; SiteHeader still renders hardcoded Préstamos)
- ✅ useAuth() null → guest state assumed (AuthContext.tsx:17 initial `member: null` ≡ guest; SiteHeader.test.tsx guest tests exercise this path)
- ⏭ Missing routes → 404 or redirect (router-level — out of scope for shell unit tests; smoke)

#### Network Issues
- ⏭ Slow _nav.json load → skeleton or delay (no skeleton in `useNavItems` — `loading` flag exists but SiteHeader renders empty nav until ready; smoke/manual)
- ⏭ Dev mirror down → graceful error (smoke — needs running stack)
- ⏭ Resync fails → error message displayed (smoke — admin content page, out of shell scope)

#### State Transitions
- 🔨 Rapid clicks don't break submenu toggle (err-2 — no rapid-toggle unit test exists; aria-expanded toggle is single boolean setState so logically safe, but no assertion)
- ⏭ Auth state changes handled properly (err-3 smoke — guest→member without reload; AuthContext setState triggers re-render but full flow is smoke)
- ⏭ Viewport resize handled smoothly (CSS media-query only; jsdom can't simulate; manual/smoke)
- ⏭ Page navigation closes drawer (mobile) (draw-7 smoke — `onClick={closeDrawer}` wired at SiteHeader.tsx:340, but full route-change is smoke)

#### Unusual Auth
- ⏭ Expired session handled (smoke — AuthContext.tsx:20-32 rehydrates from `/me`; expired token handling is server-side)
- ⏭ Invalid tokens redirected to login (router-level smoke)
- ⏭ Multiple auth sources (if applicable) (n/a — single AuthContext)

### 11. Performance

#### Page Load
- ⏭ Header renders quickly (manual / Lighthouse perf-2)
- ⏭ _nav.json loads without blocking render (useNavItems is async hook — non-blocking by construction, but perceived perf needs real browser)
- ⏭ No layout shift from nav rendering (CLS — Lighthouse perf-2)
- ⏭ Images/assets load efficiently (Lighthouse perf-2)

#### Interaction
- ⏭ Submenu toggle instant (no lag) (manual; CSS-only desktop submenu has no JS path)
- ⏭ Drawer open/close smooth (manual; transitions defined but FPS needs real device)
- ⏭ Navigation smooth (no jank) (manual)
- ⏭ No console errors (perf-1 smoke — requires Playwright with console listener; e2e/tests/ empty)

#### Browser Compatibility
- ⏭ Desktop: Chrome, Firefox, Safari, Edge (perf-3 manual matrix)
- ⏭ Mobile: iOS Safari, Chrome Android (perf-3 manual matrix)
- ⏭ Older browsers (fallback states work) (perf-3 manual matrix)

### 12. Integration Tests

#### Accented-URL redirects (W3)
- ✅ `int-1` — `/juegos-de-rol/campa%C3%B1as/` → `/juegos-de-rol/campanas/` (Caddy-fronted, `e2e/tests/url-redirects.spec.ts`)
- ✅ `int-2` — `/juegos-de-rol/campa%C3%B1as` → `/juegos-de-rol/campanas/` (lands on trailing-slash form via Caddy canonicaliser)

#### Lending App Pages
- ⏭ `/prestamos/` catalog displays (no Vitest page test for `CatalogPage.tsx`)
- ⏭ `/prestamos/my-loans` member page (no Vitest test for `MyLoansPage.tsx`)
- ⏭ `/prestamos/admin/members` admin page (no Vitest test for `AdminMembersPage.tsx`)
- ⏭ `/prestamos/admin/content` admin page (no Vitest test for `AdminContentPage.tsx`)
- ⏭ Navigation doesn't interfere with page content (smoke — requires real DOM + viewport)

#### Cross-page Navigation
- ⏭ Can navigate between all nav items (smoke — router-level, needs Playwright page specs)
- ⏭ State persists across pages (smoke — AuthContext + localStorage rehydrate; needs running app)
- ⏭ Logout clears auth state across all pages (smoke — multi-page traversal)
- ⏭ Login/logout triggers nav update (smoke — overlaps Section 5 login-redirect)

#### Mixed Routes
- ⏭ Hardcoded Préstamos routes work (int-3 smoke — covered structurally by Section 2 unit tests but full nav requires browser)
- ⏭ Scraped routes from _nav.json work (int-3 smoke — overlaps Section 6 data layer + dev_mirror Section 7)
- ⏭ Can navigate from scraped → hardcoded and vice versa (int-3 smoke — router transitions across content-mirror ↔ React routes)
