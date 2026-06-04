# Site-Shell Test Parameters (PR #46)

Parameter matrix and test plan that companion `TESTING_CHECKLIST.md`. Each
checklist item is mapped to a **test type**, a **target file**, and the
**parameters** under which it should run.

## Test types

| Type | Tool | Layer | Where |
|------|------|-------|-------|
| `unit` | Vitest + RTL (jsdom) | Frontend component | `frontend/src/**/*.test.tsx` |
| `hook` | Vitest | Frontend hook | `frontend/src/hooks/*.test.ts` |
| `pyunit` | pytest | Backend / scripts | `tests/**` |
| `smoke` | Playwright | Real browser E2E | `e2e/tests/**.spec.ts` |
| `manual` | Human | Things automation cannot reliably verify | doc-only |

Anything marked `manual` is intentionally not in CI — perf budgets, real
screen-reader behaviour, multi-browser cloud matrix. They live here so they
aren't forgotten when ramping the test gate later.

## Parameters

### Auth states (`AUTH`)

| ID | `useAuth()` returns | Expected nav surface |
|----|---------------------|----------------------|
| `guest` | `member: null` | Préstamos as plain `<Link>`, "Iniciar sesión" in header actions |
| `member` | `member.is_admin === false` | Submenu: Mis préstamos, Cerrar sesión |
| `admin` | `member.is_admin === true` | Submenu: Mis préstamos, Administración (Miembros / Contenido), Cerrar sesión |

### Viewports (`VP`)

| ID | Width × Height | Used for |
|----|----------------|----------|
| `mobile` | 375 × 812 | Hamburger drawer, touch targets |
| `tablet` | 768 × 1024 | Layout-only smoke |
| `desktop` | 1280 × 800 | Desktop nav, hover chevron, submenu positioning |

### Routes (`ROUTE`)

| ID | Path | Notes |
|----|------|-------|
| `home` | `/prestamos/` | Catalog (CatalogPage) |
| `my-loans` | `/prestamos/my-loans` | Member-only |
| `admin-members` | `/prestamos/admin/members` | Admin-only |
| `admin-content` | `/prestamos/admin/content` | Admin-only |
| `login` | `/prestamos/login` | Guest entry |
| `accented` | `/juegos-de-rol/campañas/` | Caddy + dev-mirror redirect |
| `accented-encoded` | `/juegos-de-rol/campa%C3%B1as/` | Percent-encoded variant |

## Checklist → test map

Each row: checklist item → test ID → type → location. Test IDs use the form
`<section>-<n>` so they can be cross-referenced from PR comments.

### 1. Navigation components

| Item | Test ID | Type | File |
|------|---------|------|------|
| Logo renders & links to `/inicio` | `nav-logo-1` | unit | `SiteHeader.test.tsx` |
| Logo alt text "El Refugio del Sátiro" | `nav-logo-2` | unit | `SiteHeader.test.tsx` |
| Desktop nav shows all top-level items | `nav-list-1` | unit | `SiteHeader.test.tsx` *(existing)* |
| Items render in `_nav.json` order | `nav-list-2` | unit | `SiteHeader.test.tsx` *(existing)* |
| Footer renders on all pages | `foot-1` | unit | `SiteFooter.test.tsx` |
| PageLayout wraps header + content + footer | `layout-1` | unit | `PageLayout.test.tsx` *(existing)* |

### 2. Nav items & submenu

| Item | Test ID | Type | File |
|------|---------|------|------|
| Préstamos as plain link (guest) | `submenu-guest-1` | unit | `SiteHeader.test.tsx` *(existing)* |
| Iniciar sesión button → `/login` | `submenu-guest-2` | unit | `SiteHeader.test.tsx` *(existing)* |
| Member submenu = [Mis préstamos, Cerrar sesión] | `submenu-member-1` | unit | `SiteHeader.test.tsx` *(existing)* |
| Admin submenu has Administración nested parent | `submenu-admin-1` | unit | `SiteHeader.test.tsx` *(existing)* |
| Miembros → `/admin/members`, Contenido → `/admin/content` | `submenu-admin-2` | unit | `SiteHeader.test.tsx` |
| Nested submenu expand/collapse (mobile) | `submenu-admin-3` | unit | `SiteHeader.test.tsx` |
| Submenu auth flows end-to-end | `submenu-smoke` | smoke | `e2e/tests/site-shell.spec.ts` |

### 3. Chevron behaviour

| Item | Test ID | Type | File |
|------|---------|------|------|
| Chevron rendered on submenu parents | `chev-1` | unit | `SiteHeader.test.tsx` |
| `aria-haspopup="menu"` on submenu trigger | `chev-2` | unit | `SiteHeader.test.tsx` *(existing)* |
| Chevron rotation visual | `chev-3` | manual / smoke screenshot | Playwright screenshot |
| Chevron rotates on aria-expanded toggle | `chev-4` | smoke | `site-shell.spec.ts` (mobile) |

### 4. Mobile drawer

| Item | Test ID | Type | File |
|------|---------|------|------|
| Hamburger present, aria-label "Abrir menú" | `draw-1` | unit | *(existing)* |
| aria-expanded toggles false ↔ true | `draw-2` | unit | *(existing)* |
| Escape closes drawer | `draw-3` | unit | *(existing)* |
| Click outside closes drawer | `draw-4` | smoke | `site-shell.spec.ts` @mobile |
| Drawer submenu (Préstamos) expands | `draw-5` | unit | *(existing)* |
| Nested Administración expands inside drawer | `draw-6` | unit | `SiteHeader.test.tsx` |
| Drawer link tap closes drawer | `draw-7` | smoke | `site-shell.spec.ts` @mobile |

### 5. Auth & state

| Item | Test ID | Type | File |
|------|---------|------|------|
| Guest state surface | `auth-1` | unit | *(existing)* |
| Member state surface | `auth-2` | unit | *(existing)* |
| Admin state surface | `auth-3` | unit | *(existing)* |
| Logout calls `useAuth().logout()` | `auth-4` | unit | *(existing)* |
| Logout closes submenu/drawer | `auth-5` | unit | `SiteHeader.test.tsx` |
| Session persists across reload | `auth-6` | smoke | `site-shell.spec.ts` |

### 6. Data-driven nav

| Item | Test ID | Type | File |
|------|---------|------|------|
| `_nav.json` shape | `data-1` | hook | `useNavItems.test.ts` *(existing)* |
| Hardcoded Préstamos always appended | `data-2` | unit | *(existing)* |
| Fallback when fetch errors | `data-3` | unit | *(existing)* |
| Admin "Contenido" resync regenerates nav | `data-4` | smoke + pyunit | `tests/scraper/` (existing) + smoke |

### 7. URL handling & redirects

| Item | Test ID | Type | File |
|------|---------|------|------|
| `/juegos-de-rol/campañas/` → `/juegos-de-rol/campanas/` | `url-1` | pyunit | `tests/scripts/test_dev_mirror.py` |
| Percent-encoded variant redirects | `url-2` | pyunit | `tests/scripts/test_dev_mirror.py` |
| Caddyfile rules cover same paths | `url-3` | pyunit (parsed) | `tests/scripts/test_dev_mirror.py` |
| Trailing-slash canonicalisation | `url-4` | smoke | `site-shell.spec.ts` |
| Encoded accented URL with trailing slash → ASCII canonical | `int-1` | smoke | `e2e/tests/url-redirects.spec.ts` |
| Encoded accented URL without trailing slash → ASCII canonical (lands on trailing-slash form via Caddy canonicaliser) | `int-2` | smoke | `e2e/tests/url-redirects.spec.ts` |
| `/inicio` and `/inicio/` redirect to `/` (both variants under one ID) | `red-inicio` | smoke | `e2e/tests/url-redirects.spec.ts` |
| `/socios/ludoteca` redirects to `/ludoteca/` | `red-ludoteca` | smoke | `e2e/tests/url-redirects.spec.ts` |
| `/Validacion-Membresia` redirects to `/validacion/` | `red-validacion` | smoke | `e2e/tests/url-redirects.spec.ts` |
| `/calendario` canonicalises to `/calendario/` | `red-trailing-slash` | smoke | `e2e/tests/url-redirects.spec.ts` |
| `/prestamos/games/1` is not redirected (SPA exclusion) | `red-spa-no-trailing` | smoke | `e2e/tests/url-redirects.spec.ts` |
| Unknown path returns 404 | `url-1` (e2e) | smoke | `e2e/tests/url-redirects.spec.ts` |

### 8. Visual & styling

All `manual` unless noted. Add Playwright screenshot artifacts to PR for
quick visual diffing.

| Item | Test ID | Type |
|------|---------|------|
| Desktop layout (1280) screenshot | `vis-1` | smoke (screenshot) |
| Tablet layout (768) screenshot | `vis-2` | smoke (screenshot) |
| Mobile layout (375) screenshot | `vis-3` | smoke (screenshot) |
| Color / contrast pass | `vis-4` | manual |

### 9. Accessibility

| Item | Test ID | Type |
|------|---------|------|
| `<nav>` element used | `a11y-1` | unit |
| `aria-label="Principal"` on nav | `a11y-2` | unit *(existing)* |
| `aria-haspopup="menu"` on submenu | `a11y-3` | unit *(existing)* |
| `aria-expanded` reflects state | `a11y-4` | unit *(existing)* |
| Tab order coherent | `a11y-5` | smoke |
| Screen reader announcements | `a11y-6` | manual |

### 10. Error & edge cases

| Item | Test ID | Type |
|------|---------|------|
| Missing `_nav.json` → fallback | `err-1` | hook *(existing)* |
| Rapid toggle doesn't break submenu | `err-2` | unit |
| Auth flips guest → member without reload | `err-3` | smoke |

### 11. Performance

| Item | Test ID | Type |
|------|---------|------|
| No console errors on golden path | `perf-1` | smoke |
| Lighthouse budgets | `perf-2` | manual |
| Cross-browser matrix | `perf-3` | manual |

### 12. Integration

| Item | Test ID | Type |
|------|---------|------|
| Encoded accented URL with trailing slash → ASCII canonical | `int-1` | smoke | `e2e/tests/url-redirects.spec.ts` |
| Encoded accented URL without trailing slash → ASCII canonical | `int-2` | smoke | `e2e/tests/url-redirects.spec.ts` |
| Hardcoded ↔ scraped route transitions | `int-3` | smoke |

## CI gate

Workflow `.github/workflows/ci.yml` runs:

1. **frontend** — `yarn lint && yarn typecheck && yarn test`
2. **backend** — `ruff check && pytest`
3. **smoke** — `playwright install --with-deps chromium && playwright test`
   (matrix: `AUTH × VP` covered by parameterised specs)

Triggers on every PR (no branch filter — see `.claude/CLAUDE.md`) and on push
to `main` / `development`.

## Smoke-test fixtures

The smoke spec uses three storage-state fixtures so we don't drive through the
login form for each test:

- `e2e/fixtures/guest.json` — empty storage state
- `e2e/fixtures/member.json` — pre-authenticated non-admin
- `e2e/fixtures/admin.json` — pre-authenticated admin

Generation script `e2e/scripts/seed-auth-states.ts` (run once per env) calls
the backend login endpoint with seeded credentials and dumps `storageState`.
