# Site-Shell Testing Checklist (PR #46)

## 1. Navigation Components

### SiteHeader
- [ ] Logo renders and links to `/inicio`
- [ ] Logo alt text: "El Refugio del Sátiro"
- [ ] Desktop nav bar displays all top-level items
- [ ] Nav items link to correct routes
- [ ] Header background and styling matches scraped site
- [ ] Header is full-width with correct padding/spacing

### SiteFooter
- [ ] Footer renders at bottom of all pages
- [ ] Footer content matches scraped site
- [ ] Footer styling and layout correct
- [ ] Footer links functional

### PageLayout
- [ ] Page layout wraps header + content + footer correctly
- [ ] Content renders between header and footer
- [ ] No overlapping or layout breaks
- [ ] Responsive to viewport changes

## 2. Navigation Items & Submenu

### Top-level Nav Items (Desktop)
- [ ] Inicio (`/inicio`)
- [ ] Calendario (`/calendario`)
- [ ] Juegos de Rol (`/juegos-de-rol`)
- [ ] Juegos de Mesa (`/juegos-de-mesa`)
- [ ] Eventos (`/eventos`)
- [ ] FAQ (`/faq`)
- [ ] Socios (`/socios`)
- [ ] Préstamos (`/prestamos/`)

### Guest Auth State Submenu
- [ ] Préstamos renders as plain `<Link>` (no submenu)
- [ ] Iniciar sesión appears as top-right header button
- [ ] Button text: "Iniciar sesión"
- [ ] Button links to `/prestamos/login`

### Member Auth State Submenu
- [ ] Préstamos has dropdown chevron
- [ ] Submenu items: Mis préstamos, Cerrar sesión
- [ ] Mis préstamos links to `/prestamos/my-loans`
- [ ] Cerrar sesión button calls logout action
- [ ] Submenu expands/collapses on click

### Admin Auth State Submenu
- [ ] Préstamos has dropdown chevron
- [ ] Submenu items: Mis préstamos, Administración, Cerrar sesión
- [ ] Administración is a nested parent (has chevron)
- [ ] Nested children: Miembros, Contenido
- [ ] Miembros links to `/prestamos/admin/members`
- [ ] Contenido links to `/prestamos/admin/content`
- [ ] Cerrar sesión button calls logout action
- [ ] Both main and nested submenus expand/collapse correctly

## 3. Chevron Behavior

### Desktop (hover state)
- [ ] Chevron visible on submenu parents
- [ ] Chevron rotates 180° on hover
- [ ] Rotation smooth and responsive
- [ ] Chevron color matches text color

### Mobile (click/tap state)
- [ ] Chevron visible on submenu parents
- [ ] Chevron rotates when submenu expands
- [ ] Chevron rotates back when submenu collapses
- [ ] Rotation applies to both main and nested menus

## 4. Mobile Drawer (375px viewport)

### Hamburger Menu
- [ ] Hamburger button visible in header
- [ ] Button has aria-label="Abrir menú"
- [ ] Button has aria-expanded attribute
- [ ] aria-expanded="false" when drawer closed
- [ ] aria-expanded="true" when drawer open

### Drawer Opening/Closing
- [ ] Hamburger click opens drawer
- [ ] Drawer slides out smoothly
- [ ] Drawer covers full viewport width (or appropriate fraction)
- [ ] Drawer has dark theme
- [ ] All nav items visible in drawer
- [ ] Click outside drawer closes it
- [ ] Escape key closes drawer
- [ ] Hamburger click toggles drawer state

### Drawer Submenu Expansion
- [ ] Préstamos item has chevron
- [ ] Clicking Préstamos expands submenu
- [ ] Submenu items (Mis préstamos, Administración, Cerrar sesión) appear
- [ ] Chevron rotates on expansion/collapse
- [ ] Administración has nested chevron
- [ ] Clicking Administración expands nested menu (Miembros, Contenido)
- [ ] Nested items properly indented

### Drawer Navigation
- [ ] Clicking nav item closes drawer (or navigates then closes)
- [ ] Links navigate to correct routes
- [ ] Active nav item highlighted (if applicable)

## 5. Authentication & State Management

### Guest State
- [ ] useAuth() returns guest state
- [ ] Préstamos link visible (no submenu)
- [ ] Iniciar sesión button visible in header
- [ ] No admin items shown
- [ ] No "Mis préstamos" option

### Member State (logged-in non-admin)
- [ ] useAuth() returns member state
- [ ] Préstamos submenu shows: Mis préstamos, Cerrar sesión
- [ ] No Administración option
- [ ] Cerrar sesión functional

### Admin State
- [ ] useAuth() returns admin state
- [ ] Préstamos submenu shows full admin menu
- [ ] Administración nested menu accessible
- [ ] All admin links functional

### Login/Logout Flow
- [ ] Logout button closes submenu
- [ ] Logout clears auth state
- [ ] Navigation updates immediately on logout
- [ ] Login redirects and updates nav
- [ ] Session persists across page reloads (if applicable)

## 6. Data-Driven Navigation (_nav.json)

### Scraper Output
- [ ] `_nav.json` generated at project root
- [ ] Top-level nav items included
- [ ] Submenu L2 children extracted
- [ ] `/prestamos` excluded from scraped items
- [ ] Schema matches expected format

### Navigation Data Loading
- [ ] App loads _nav.json on startup
- [ ] Navigation renders from loaded data
- [ ] Hardcoded Préstamos item added to nav
- [ ] Items render in correct order

### Admin Content Resync
- [ ] Admin can trigger resync from "Contenido" page
- [ ] Resync re-fetches scraped HTML
- [ ] Resync regenerates _nav.json
- [ ] Navigation updates without full page reload

## 7. URL Handling & Redirects

### URL Encoding
- [ ] Accented URLs work: `/juegos-de-rol/campañas/`
- [ ] Dev mirror redirects: `/juegos-de-rol/campa%C3%B1as/ → 200 OK`
- [ ] Caddyfile rules apply correctly
- [ ] No 404 errors for accented paths

### Dev Mirror Server
- [ ] `scripts/dev_mirror.py` runs on localhost:8080
- [ ] Content proxy returns HTML for scraped pages
- [ ] Asset proxy returns CSS/JS/images
- [ ] Redirect rules function correctly

### Route Navigation
- [ ] All hard-coded routes work
- [ ] Dynamic routes from _nav.json work
- [ ] Route changes update document URL
- [ ] Back/forward browser buttons work

## 8. Visual & Styling

### Desktop Layout (1280px)
- [ ] Full-width header with correct spacing
- [ ] Logo size and alignment correct
- [ ] Nav items evenly spaced
- [ ] Submenu dropdown positions correctly
- [ ] No overlapping elements
- [ ] Colors match scraped site

### Tablet Layout (768px)
- [ ] Layout responsive to medium viewport
- [ ] Nav items still visible or accessible
- [ ] Submenu positions correctly
- [ ] Header height appropriate

### Mobile Layout (375px)
- [ ] Hamburger menu visible
- [ ] Logo scaled appropriately
- [ ] Drawer takes appropriate width
- [ ] Submenu nesting clear (indentation)
- [ ] Touch targets adequate size (> 44x44 px)

### Dark Theme (if applicable)
- [ ] Text contrast sufficient
- [ ] Icons visible
- [ ] Links distinguishable
- [ ] Hover states clear

## 9. Accessibility

### Semantic HTML
- [ ] Nav elements use `<nav>` tag
- [ ] Links use `<a>` with href
- [ ] Buttons use `<button>` for actions
- [ ] Headings use correct heading levels

### ARIA Attributes
- [ ] Submenu buttons have aria-haspopup="menu"
- [ ] Submenu buttons have aria-expanded
- [ ] Drawer button has aria-label
- [ ] Nav regions labeled with aria-label

### Keyboard Navigation
- [ ] Tab key navigates through nav items
- [ ] Enter/Space activates buttons
- [ ] Escape closes drawer
- [ ] Focus visible and follows expected order

### Screen Reader
- [ ] Nav items announced correctly
- [ ] Submenu expanded/collapsed state announced
- [ ] Button purposes clear
- [ ] No redundant aria-labels

## 10. Error States & Edge Cases

### Missing Data
- [ ] _nav.json missing → fallback nav shown
- [ ] useAuth() null → guest state assumed
- [ ] Missing routes → 404 or redirect

### Network Issues
- [ ] Slow _nav.json load → skeleton or delay
- [ ] Dev mirror down → graceful error
- [ ] Resync fails → error message displayed

### State Transitions
- [ ] Rapid clicks don't break submenu toggle
- [ ] Auth state changes handled properly
- [ ] Viewport resize handled smoothly
- [ ] Page navigation closes drawer (mobile)

### Unusual Auth
- [ ] Expired session handled
- [ ] Invalid tokens redirected to login
- [ ] Multiple auth sources (if applicable)

## 11. Performance

### Page Load
- [ ] Header renders quickly
- [ ] _nav.json loads without blocking render
- [ ] No layout shift from nav rendering
- [ ] Images/assets load efficiently

### Interaction
- [ ] Submenu toggle instant (no lag)
- [ ] Drawer open/close smooth
- [ ] Navigation smooth (no jank)
- [ ] No console errors

### Browser Compatibility
- [ ] Desktop: Chrome, Firefox, Safari, Edge
- [ ] Mobile: iOS Safari, Chrome Android
- [ ] Older browsers (fallback states work)

## 12. Integration Tests

### Lending App Pages
- [ ] `/prestamos/` catalog displays
- [ ] `/prestamos/my-loans` member page
- [ ] `/prestamos/admin/members` admin page
- [ ] `/prestamos/admin/content` admin page
- [ ] Navigation doesn't interfere with page content

### Cross-page Navigation
- [ ] Can navigate between all nav items
- [ ] State persists across pages
- [ ] Logout clears auth state across all pages
- [ ] Login/logout triggers nav update

### Mixed Routes
- [ ] Hardcoded Préstamos routes work
- [ ] Scraped routes from _nav.json work
- [ ] Can navigate from scraped → hardcoded and vice versa

## Notes

- **Guest nav item count**: 8 items (Inicio through Socios) + Préstamos (link, no submenu) + Iniciar sesión (header button)
- **Member submenu**: Mis préstamos, Cerrar sesión (2 items)
- **Admin submenu**: Mis préstamos, Administración (with Miembros, Contenido nested), Cerrar sesión (3 items + 2 nested)
- **Focus viewports**: 375px (mobile), 768px (tablet), 1280px (desktop)
- **Key commits**:
  - `54af6ab`: chevron rotation, drawer, login button repositioning
  - `8c687cf`: accented URL redirects
  - `3b67df4`: spec alignment in OpenSpec

---

**Test Coverage Targets:**
- Unit tests: Component rendering, state logic (Vitest)
- Integration tests: Page navigation, auth flows (pytest)
- E2E/smoke tests: Full flows across devices (manual + Playwright)
