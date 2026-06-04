# Current State Inventory: Lending/Préstamos UI

## 1. Frontend Route Map

All routes mounted at `/prestamos` via React Router basename.

| Path | Component | Purpose | Target User |
|------|-----------|---------|-------------|
| `/` | [CatalogPage](../../frontend/src/pages/CatalogPage.tsx) | Browse all games with advanced filters (availability, location, players, time, rating) | Guest/Member |
| `/games/:id` | [GameDetailPage](../../frontend/src/pages/GameDetailPage.tsx) | View game details and loan history | Guest/Member |
| `/my-loans` | [MyLoansPage](../../frontend/src/pages/MyLoansPage.tsx) | List member's active loans; initiate returns | Member only |
| `/login` | [LoginPage](../../frontend/src/pages/LoginPage.tsx) | Email + password authentication | Guest |
| `/forgot-password` | [ForgotPasswordPage](../../frontend/src/pages/ForgotPasswordPage.tsx) | Password reset request | Guest |
| `/set-password` | [SetPasswordPage](../../frontend/src/pages/SetPasswordPage.tsx) | Reset password via token link | Guest |
| `/admin/members` | [AdminMembersPage](../../frontend/src/pages/AdminMembersPage.tsx) | Create/manage members, view loans, toggle active status | Admin only |

## 2. Lending UI Pages

### Catalog Page
**File:** [frontend/src/pages/CatalogPage.tsx](../../frontend/src/pages/CatalogPage.tsx)

- Grid of [GameCard](../../frontend/src/components/GameCard.tsx) components
- Search by name (debounced 300ms)
- Filters: availability (all/available/lent), location (all/armari/soterrani), player range (dual slider), playing time (presets), min BGG rating
- Sort options: name asc/desc, rating desc, player count asc/desc, time asc/desc
- Responsive filters panel (collapsible on mobile, expanded on desktop)
- Displays: game name, year, thumbnail, player count, playing time, status badge, borrow/return buttons

### Game Detail Page
**File:** [frontend/src/pages/GameDetailPage.tsx](../../frontend/src/pages/GameDetailPage.tsx)

- Displays: larger game image, name, year, availability status, BoardGameGeek link
- Shows loan history table (member name, borrowed date, returned date)
- No borrow/return actions on this page (those happen in catalog)

### My Loans Page
**File:** [frontend/src/pages/MyLoansPage.tsx](../../frontend/src/pages/MyLoansPage.tsx)

- List of active loans with member's name, game thumbnail, game name, borrowed date
- Return button per loan; opens [ConfirmDialog](../../frontend/src/components/ConfirmDialog.tsx) before submitting
- Empty state message if no loans

### Login Page
**File:** [frontend/src/pages/LoginPage.tsx](../../frontend/src/pages/LoginPage.tsx)

- Form: email, password inputs; Login button
- Error display; loading state on button
- Links to forgot-password and back to catalog

### Admin Members Page
**File:** [frontend/src/pages/AdminMembersPage.tsx](../../frontend/src/pages/AdminMembersPage.tsx) (~12KB)

- Table: member number, name, email, phone, admin flag, active flag, active loan count
- Sortable column headers
- Create member form: first/last name, email, nickname, phone, member number
- Token banner for new member invitation links
- Actions: toggle active, send reset link, resend link, delete member
- Role-based access control (admin only)

## 3. Shared UI Components

| Component | File | Purpose |
|-----------|------|---------|
| NavBar | [components/NavBar.tsx](../../frontend/src/components/NavBar.tsx) | Header with brand, catalog/loans/admin links (role-gated), user display, logout |
| GameCard | [components/GameCard.tsx](../../frontend/src/components/GameCard.tsx) | Grid card: thumbnail, name, year, players, time, status, borrow/return buttons |
| SearchBar | [components/SearchBar.tsx](../../frontend/src/components/SearchBar.tsx) | Text input with 300ms debounce |
| FilterControl | [components/FilterControl.tsx](../../frontend/src/components/FilterControl.tsx) | Toggle buttons for availability filter |
| ConfirmDialog | [components/ConfirmDialog.tsx](../../frontend/src/components/ConfirmDialog.tsx) | Modal for borrow/return/delete confirmations; keyboard trap, focus mgmt |
| LoanHistoryEntry | [components/LoanHistoryEntry.tsx](../../frontend/src/components/LoanHistoryEntry.tsx) | Single loan history row (member, dates) |
| LanguageSelector | [components/LanguageSelector.tsx](../../frontend/src/components/LanguageSelector.tsx) | Inline language switcher (Catalan/Spanish/English) |

## 4. Styling Approach

**Technology:** CSS Modules (component-scoped .css files, no external framework)

**Design Tokens:** [frontend/src/tokens.css](../../frontend/src/tokens.css) (CSS custom properties)

- **Colors:** primary (#2563eb), success (#16a34a), danger (#dc2626), warning (#d97706), text, bg, borders, status indicators (available green, lent yellow)
- **Spacing:** xs (0.25rem) through 2xl (3rem)
- **Typography:** system font stack; sizes sm–2xl
- **Shadows:** sm, md
- **Border radius:** sm (0.25rem), md (0.5rem), lg (0.75rem)

**Reset:** [frontend/src/reset.css](../../frontend/src/reset.css) (global box-sizing, margin/padding reset, body/link/button/image defaults)

**Patterns:**
- `.btn` base class in NavBar.css with `.btn-primary` (blue bg, white text) and `.btn-secondary` (transparent, border)
- Form fields styled inline in page CSS (no shared form component)
- Responsive design via CSS grid/flexbox; media query for mobile filter panel

## 5. Backend API Endpoints

All prefixed `/api` (full paths: `/prestamos/api/*`).

| Method | Path | Purpose | Auth | Request | Response |
|--------|------|---------|------|---------|----------|
| GET | `/games` | List all games with status | Public | — | GameResponse[] |
| GET | `/games/{id}/history` | Game loan history | Public | — | LoanHistoryEntryResponse[] |
| POST | `/login` | Authenticate | Public | LoginRequest | OkResponse |
| POST | `/logout` | Logout | Any | — | OkResponse |
| GET | `/me` | Current member | Auth req | — | MemberResponse |
| POST | `/forgot-password` | Request reset | Public | ForgotPasswordRequest | OkResponse |
| POST | `/set-password` | Reset via token | Public | SetPasswordRequest | OkResponse |
| POST | `/loans` | Borrow game | Member | BorrowRequest | LoanResponse |
| PATCH | `/loans/{id}/return` | Return game | Member | — | LoanResponse |
| GET | `/my-loans` | Member's active loans | Member | — | ActiveLoanResponse[] |
| GET | `/admin/members` | List members | Admin | — | MemberListItem[] |
| POST | `/admin/members` | Create member | Admin | CreateMemberRequest | CreateMemberResponse |
| PATCH | `/admin/members/{id}/enable` | Activate member | Admin | — | OkResponse |
| PATCH | `/admin/members/{id}/disable` | Deactivate member | Admin | — | OkResponse |
| POST | `/admin/members/{id}/send-link` | Send reset link | Admin | — | SendLinkResponse |
| POST | `/admin/members/{id}/resend-link` | Resend reset link | Admin | — | SendLinkResponse |
| DELETE | `/admin/members/{id}` | Delete member | Admin | — | OkResponse |

**Response Models** in [backend/api/routes/](../../backend/api/routes/):
- GameResponse, LoanHistoryEntryResponse ([games.py](../../backend/api/routes/games.py))
- LoanResponse, BorrowRequest ([loans.py](../../backend/api/routes/loans.py))
- MemberListItem, CreateMemberRequest, CreateMemberResponse ([admin.py](../../backend/api/routes/admin.py))
- ActiveLoanResponse ([members.py](../../backend/api/routes/members.py))

## 6. Landing vs Lending Boundary

**Current State:** No separation yet. The lending app IS the app.

- **Routing:** Lending app mounted at `/prestamos` (React Router basename)
- **Layout:** Shared [NavBar](../../frontend/src/components/NavBar.tsx) with brand "Refugio del Sátiro" (or i18n key `nav.brand`)
- **Styling:** Same tokens, reset, and CSS modules throughout
- **Landing Content:** Intended to merge with existing club landing page at `/` (root), but currently `/prestamos/` redirects to CatalogPage

**Implications:**
- No distinct landing UI; catalog doubles as landing (must be guest-accessible)
- Navigation brand/links will need refactoring when landing is merged

## 7. Gaps & Pain Points

**Inconsistencies:**
- Form styling duplicated across pages (LoginPage, ForgotPasswordPage, AdminMembersPage) — no shared form component
- Button styles defined in NavBar.css but used everywhere (tight coupling)
- Color naming uses Tailwind-like values (e.g., `#2563eb`) but not systematized (e.g., `color-text-muted` referenced in ForgotPasswordPage but not in tokens.css)

**Missing/Brittle:**
- No confirm-on-loan toast/feedback after successful borrow/return (user navigates back or list re-fetches silently)
- Admin page relies on inline error handling; no global error boundary or toast system
- Dual-slider for player range is CSS+JS custom implementation (no library); potential accessibility/UX issues
- No loading state indicators beyond basic text messages
- Language selector doesn't persist across page reloads (relies on browser detector or session cookie)

**Styling Issues:**
- Mobile-first layout not consistently applied; filters panel hidden on mobile but toggle affordance is small
- Sort/filter panels open in front of content with no overlay (can be hard to dismiss accidentally)
- Card status badges (`game-card-status`) use inline color logic, not design tokens

**Code Organization:**
- Hooks in `hooks/` but minimal abstraction (useGames/useMyLoans/useGameHistory are thin wrappers)
- Types scattered across `types/game.ts`, `types/loan.ts`, `types/member.ts`, `types/admin.ts`
- No shared layout/page wrapper component; main padding/margin applied per-page
- i18n keys duplicated across translation files; no TypeScript validation

---

## Summary

The lending app (`/prestamos`) is a self-contained React SPA with a Python FastAPI backend, styled via CSS modules with design tokens. It features a game catalog with advanced filtering, loan management, and admin controls, all behind JWT auth. The primary redesign challenges are: **(1) Clarifying the landing/lending boundary** once the club website lands merges; **(2) Consolidating form, button, and layout patterns** into shared components to reduce duplication; **(3) Adding feedback systems** (toasts, loading spinners, error boundaries) for better UX; and **(4) Improving the card/filter UI** for mobile and desktop consistency. The backend API is well-structured; the frontend would most benefit from extracting layout/form abstractions and a consistent state/feedback pattern across pages.
