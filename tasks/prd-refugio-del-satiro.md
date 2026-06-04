# PRD: Préstecs Sàtirs — Game Lending Manager

## Introduction

Préstecs Sàtirs is a web application for the "Refugio del Sátiro" RPG association to track board and role-playing game lending. The association owns a collection of games (cataloged in BoardGameGeek) and lends them to its members. The app provides a self-service interface where members can log in, browse the catalog, check out games, and mark returns — giving the group clear visibility into who has what at any time.

## Goals

- Provide a single source of truth for which games are currently lent out and to whom
- Allow any member to self-service borrow and return games without admin intervention
- Maintain a catalog of association-owned games, seeded from a BoardGameGeek (BGG) collection
- Require member authentication so loans are tied to real identities
- Keep the system simple — no due dates, no reservations, no notifications in V1

## User Stories

### US-001: Seed game catalog from BGG
**Description:** As an admin, I want to import the association's game collection from BoardGameGeek so that the catalog is pre-populated without manual data entry.

**Acceptance Criteria:**
- [ ] CLI command (`refugio import-games`) fetches owned games (`own=1`) from BGG profile `RefugioDelSatiro` via the BGG XML API
- [ ] Each game is stored with: BGG ID, name, thumbnail URL, and year published
- [ ] Duplicate imports update existing entries rather than creating duplicates
- [ ] Import can be re-run to sync new additions
- [ ] Handles BGG API 202 "retry later" responses with exponential backoff
- [ ] Typecheck/lint passes

### US-002: Browse game catalog
**Description:** As a member, I want to browse all available games so that I can find one to borrow.

**Acceptance Criteria:**
- [ ] Game list page shows all games with name, thumbnail, and year
- [ ] Each game shows its current status: "available" or "lent to [member display name]"
- [ ] Games can be filtered by availability (all / available / lent out) via segmented control
- [ ] Games can be searched by name (client-side debounced filter)
- [ ] Catalog is visible to unauthenticated users (browse without login)
- [ ] All games loaded at once (no pagination needed for association-scale collection)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Import members from CSV
**Description:** As an admin, I want to import members from a CSV file so that I can onboard them in bulk.

**Acceptance Criteria:**
- [ ] CLI command (`refugio import-members <csv-path>`) accepts the association's `members.csv` format
- [ ] CSV columns: `Nº Socio`, `Apellidos`, `Nombre`, `Apodo`, `Telefóno`, `Email`, `admin`
- [ ] Display name logic: use `Apodo` (nickname) if present and unique across all members; otherwise use `Nombre Apellidos`
- [ ] All fields are stored: member number, last name, first name, nickname, phone, email, admin flag
- [ ] Members without an email are silently skipped
- [ ] Each member is created without a password (password is null)
- [ ] Duplicate emails are upserted: updates fields if email already exists
- [ ] Members are stored sorted by member number (`Nº Socio`)
- [ ] For each new member, command outputs a one-time URL to set their password
- [ ] One-time URL base configurable via `--base-url` flag or `REFUGIO_BASE_URL` env var (default: `http://localhost:8000`)
- [ ] The one-time URL contains a secure token (cryptographic random hex) and expires after 48 hours
- [ ] Admin flag is set to `true` for members with `yes` in the `admin` column
- [ ] Command also supports adding a single member: `--name "Name" --email "email"` (plus optional `--nickname`, `--phone`, `--member-number`, `--admin` flags)
- [ ] When adding a single member without `--member-number`, `member_number` is left null
- [ ] Typecheck/lint passes

### US-003b: Set password via one-time URL
**Description:** As a new member, I want to set my password using the link the admin gave me so that I can log in.

**Acceptance Criteria:**
- [ ] One-time URL leads to a "Set your password" page
- [ ] Page validates the token (rejects expired or already-used tokens)
- [ ] Member enters and confirms a password
- [ ] Password is stored hashed (bcrypt); token is invalidated after use
- [ ] After setting password, member is redirected to login
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-004: Member login and logout
**Description:** As a member, I want to log in so that the system knows who I am when I borrow a game.

**Acceptance Criteria:**
- [ ] Login form with email and password
- [ ] On success, JWT token (7-day expiry) is set as httpOnly cookie and member is redirected to the catalog
- [ ] On failure, a clear error message is shown (without revealing whether email exists)
- [ ] Logout button visible when logged in, clears the cookie
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Borrow a game
**Description:** As a logged-in member, I want to borrow an available game so that I can take it home.

**Acceptance Criteria:**
- [ ] "Borrow" button visible on available games only (requires login)
- [ ] Clicking "Borrow" shows a confirmation dialog before proceeding
- [ ] Confirmed borrow records the loan: game, member, and borrow date
- [ ] Game status immediately changes to "lent to [my display name]"
- [ ] A member can borrow multiple games simultaneously
- [ ] Cannot borrow a game that is already lent out
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Return a game
**Description:** As a member who has borrowed a game, I want to mark it as returned so that others know it's available.

**Acceptance Criteria:**
- [ ] "Return" button visible on games the logged-in member currently has borrowed
- [ ] Admins see a "Return" button on any lent-out game (admin override)
- [ ] Clicking "Return" shows a confirmation dialog before proceeding
- [ ] Confirmed return marks the loan as completed with a return date
- [ ] Game status changes back to "available"
- [ ] The loan record is preserved in history (not deleted)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: View my active loans
**Description:** As a member, I want to see which games I currently have so that I know what to return.

**Acceptance Criteria:**
- [ ] Separate "My Loans" page (`/my-loans`) showing all games I currently have borrowed
- [ ] Each entry shows game name, thumbnail, and borrow date
- [ ] "Return" button available directly from this view (with confirmation dialog)
- [ ] Empty state message when I have no active loans
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: View lending history for a game
**Description:** As a member, I want to see a game's lending history so that I can understand its usage.

**Acceptance Criteria:**
- [ ] Game detail page shows past and current loans
- [ ] Each history entry shows: member display name, borrow date, return date (or "currently borrowed")
- [ ] History is ordered most recent first
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-009: Admin panel — member management
**Description:** As an admin, I want a web interface to manage members so that I don't need CLI access.

**Acceptance Criteria:**
- [ ] `/admin/members` page shows all members in a table: display name, email, member number, status (active/disabled), active loan count
- [ ] "Create member" form: display name, email, optional fields (nickname, phone, member number)
- [ ] Creating a member generates a one-time password URL (shown to admin)
- [ ] Disable/Enable toggle per member (soft disable: can't log in, active loans remain)
- [ ] "Send access link" button per member — generates a new password token and sends email via SMTP
- [ ] If SMTP is not configured, the button shows/copies the URL instead of sending email
- [ ] NavBar shows "Administració" link only for admins
- [ ] Non-admin users redirected away from `/admin/*` routes
- [ ] Disabled members cannot log in (auth rejects them)
- [ ] Admins can re-enable disabled members
- [ ] All UI text in Catalan
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-010: Send access link via email
**Description:** As an admin, I want to send a password-set link to a member by email so that they can set up their account without me sharing URLs manually.

**Acceptance Criteria:**
- [ ] Admin clicks "Send access link" for a member
- [ ] System generates a new password token (48h expiry)
- [ ] Email sent via configured SMTP with the one-time URL
- [ ] Email body is in Catalan, simple HTML template
- [ ] If SMTP is not configured, the URL is returned in the API response for manual sharing
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: CLI command (`refugio import-games`) imports owned games from BGG profile `RefugioDelSatiro` via the BGG XML API v2 (`own=1`)
- FR-2: Each game record stores: `id` (auto-increment PK), `bgg_id` (unique), `name`, `thumbnail_url`, `year_published`, `created_at`, `updated_at`
- FR-3: CLI command (`refugio import-members`) imports members from a CSV file (association format) or adds a single member via flags. CLI accesses the database directly (no running server required).
- FR-4: Each member record stores: `id` (auto-increment PK), `member_number` (unique, nullable — managed externally), `first_name`, `last_name`, `nickname` (nullable), `phone` (nullable, stored as-is from CSV), `email` (unique), `display_name` (derived: nickname if unique, else "first last" — stored, recomputed on import), `password_hash` (nullable), `is_admin` (boolean, default false), `created_at`, `updated_at`
- FR-4b: Members without an email in the CSV are silently skipped
- FR-4c: Default sort order for members is by `member_number`
- FR-5: Authentication uses email + password; password hashed with bcrypt
- FR-5b: Auth token is a JWT (7-day expiry) set as an httpOnly cookie
- FR-6: New members receive a one-time URL (cryptographic random hex token, stored in `password_tokens` table, 48h expiry) to set their password before first login
- FR-7: A loan record stores: `id` (auto-increment PK), `game_id` (FK), `member_id` (FK), `borrowed_at`, `returned_at` (null while active)
- FR-8: Only one active loan per game at any time — enforced by partial unique index `(game_id) WHERE returned_at IS NULL` and API-level check
- FR-9: Any logged-in member can borrow any available game (self-service)
- FR-10: Only the member who borrowed a game can return it — except admins, who can return any game on behalf of any member
- FR-11: When a game is lent out, any user (including unauthenticated) can see who has it (by display name)
- FR-12: The catalog page supports text search by game name and filter by availability (client-side, all games loaded at once)
- FR-13: All API endpoints that modify data require authentication
- FR-14: The catalog is visible to unauthenticated users (read-only browsing)
- FR-15: Member record includes `is_active` (boolean, default true). Disabled members cannot log in.
- FR-16: Admin panel at `/admin/members` — list, create, disable/enable members (admin only)
- FR-17: Admins can generate new password-set tokens for any member and send them via email
- FR-18: Email sending via SMTP (configurable: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`). If not configured, URLs are returned for manual sharing.

## Non-Goals

- No due dates, overdue tracking, or reminders
- No reservation or waitlist system
- No admin approval workflow for loans
- No fine or penalty system
- No bulk email sending (one member at a time)
- No self-registration (admin creates members)
- No game ratings or reviews
- No mobile-specific app (responsive web only)
- No internationalization infrastructure in V1 — UI is in Catalan only (Spanish and English translations are a future idea)
- No pagination (collection is small enough to load at once)

## Design Considerations

- Simple, clean interface — prioritize clarity over visual polish
- Game cards with thumbnails pulled from BGG
- Clear visual distinction between available and lent-out games
- Responsive layout that works on phones (members may check at game nights)
- Borrow and return actions require a confirmation dialog
- UI language: Catalan

## Technical Considerations

- **Backend:** Python 3.12+ with FastAPI, Clean Architecture (domain/data/API layers)
- **CLI:** Typer — commands accessed via `refugio` console script (e.g., `refugio import-games`, `refugio import-members`). CLI accesses the database directly (shares data layer, no running server needed).
- **Database:** SQLite — single file, no server. All tables use auto-increment `id` as PK. External identifiers (`bgg_id`, `member_number`) stored as unique columns. FK constraints use `ON DELETE RESTRICT`. Migrations via hand-rolled versioned SQL files (`001_initial.sql`, etc.) with a simple Python runner.
- **Frontend:** React + TypeScript + Vite. Plain CSS with design tokens. Auth state via React Context, rehydrated from a `/me` endpoint on app load. API base URL via `VITE_API_URL` env var (default: `/api`).
- **BGG integration:** BGG XML API v2 (`own=1`, username `RefugioDelSatiro`). Exponential backoff on 202 responses.
- **Member import:** CSV file matching the association's format (`Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin`). CSV assumed UTF-8. Header matching is exact (including the typo "Telefóno"). Members without email silently skipped. Phone stored as-is.
- **Display name derivation:** `Apodo` (nickname) if present and unique across all members; otherwise `Nombre Apellidos`. Stored column, recomputed on every import run.
- **Authentication:** bcrypt password hashing. JWT (7-day expiry) in httpOnly cookie. One-time password-set tokens in a separate `password_tokens` table (token, member_id, created_at, expires_at, used_at).
- **Game thumbnails:** Stored as URLs pointing to BGG CDN, not downloaded locally.
- **Deployment:** Oracle Cloud Free Tier. Details TBD.
- **CORS:** Allow all origins in dev (Vite proxy). Production serves frontend and API from same origin.

## Success Metrics

- Any member can borrow a game in under 3 clicks from the catalog
- The catalog accurately reflects which games are available at any moment
- Full BGG collection imported successfully on first run

## Resolved Questions

- **BGG profile:** `RefugioDelSatiro` (https://boardgamegeek.com/profile/RefugioDelSatiro)
- **BGG import:** CLI command (admin only), fetches owned games only (`own=1`)
- **BGG retry:** Exponential backoff on 202 responses
- **Loan visibility:** Any user can see who has a game (by display name)
- **Member list page:** Out of scope for V1
- **Member source:** CSV file (association format with all fields), imported via CLI command
- **Display name:** Nickname (Apodo) if present and unique, otherwise "Nombre Apellidos". Stored, recomputed on import.
- **Admin flag:** Stored per member, imported from CSV `admin` column. Admins can return games on behalf of any member.
- **Members without email:** Silently skipped during import
- **First login flow:** One-time tokenized URL (48h expiry) generated by CLI, shared by admin
- **Python framework:** FastAPI
- **CLI framework:** Typer, accessed via `refugio` console script
- **CLI DB access:** Direct (shares data layer, no server needed)
- **Auth:** JWT (7-day, single token) in httpOnly cookie, bcrypt hashing
- **One-time URL base:** `--base-url` flag / `REFUGIO_BASE_URL` env var / default `http://localhost:8000`
- **One-time tokens:** Separate `password_tokens` table, cryptographic random hex
- **Primary keys:** Auto-increment `id` for all tables. `member_number` is unique but nullable (externally managed). `bgg_id` is unique.
- **Phone storage:** As-is from CSV, no normalization
- **FK cascade:** `ON DELETE RESTRICT`
- **Active loan enforcement:** Partial unique index `(game_id) WHERE returned_at IS NULL`
- **Migrations:** Hand-rolled versioned SQL files with simple Python runner
- **My Loans:** Separate page (`/my-loans`)
- **Catalog access:** Visible to unauthenticated users (browse-only)
- **Search:** Client-side debounced filter, all games loaded at once
- **Borrow/Return:** Confirmation dialog before action
- **UI language:** Catalan (Spanish and English translations deferred)
- **API base URL:** `VITE_API_URL` env var, default `/api`
- **Deployment:** Oracle Cloud Free Tier
- **Deadline:** None

## Open Questions

None — all questions resolved.
