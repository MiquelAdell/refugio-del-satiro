# Refugio del Sátiro

Website for the **Refugio del Sátiro** RPG association.

Current scope: the game-lending feature (mounted at `/ludoteca`). Members can
browse the catalog, borrow and return games, and review their own profile. The
catalog is imported from
[BoardGameGeek](https://boardgamegeek.com/collection/user/RefugioDelSatiro?subtype=boardgame&own=1&ff=1).
The catalog is publicly browsable read-only (no account needed; borrowing and
reviewing a member's own profile require logging in). Legacy `/prestamos` URLs
redirect permanently to `/ludoteca`.

Board-game and RPG catalogs share search and removable filter chips, a reset
that preserves the selected sort order, sorting beside the grid/list toggle,
and a responsive list view with readable covers, ratings, and metadata. Board
games can also be filtered by player age from 3 to 18; items without a known
minimum age are omitted while that filter is active. RPG covers remain
letterboxed rather than cropped.

Failed sign-ins use the same generic credential message for every ineligible
or invalid account and explain that the private lending area is limited to
paid-up members, with a link to `/socios/`. Successful sign-out is confirmed by
an accessible four-second status notification.

After a board game or RPG book is borrowed, the detail page reminds the member
that loans have no deadline and should be returned responsibly. A borrower
sees `Devolver`; an administrator returning another member's item sees
`Forzar devolución` in both the action and its confirmation.

`Mis préstamos` repeats the responsible-use reminder. The cover and title on
each card link to the item's detail page. Loans open for at least 30 complete
days show an informational marker. The marker does not set a deadline or
restrict the loan.

The admin member list has a `Rol` column that identifies each person as
`Administrador` or `Socio`. When an administrator forces a return, the app
tries to email the borrower and reports whether the message was sent. The
return remains registered if the email cannot be sent.

A public membership-validation page lives at `/ludoteca/validacion`: anyone
can enter a member number and see whether that person is a current member
(name, ES/NO ES socio·a verdict, last paid fee). The legacy
`/Validacion-Membresia` URL (printed on QR codes) 301-redirects there. The
page also accepts `?id=<n>` for direct lookups.

Authenticated members can review their read-only membership information at
`/ludoteca/profile`, with links to their loans and password-change flow.

`/ludoteca/contacto-prestamos` is a public HTTPS handoff page for printed
support QR codes. It opens the device's registered email handler with the
support address prefilled and retains a visible `mailto:` fallback link.

Everything else under `/` is mirrored from the club's Google Sites site by a
small scraper (see `scraper/`) and served as static files by Caddy.

## Tech Stack

- **Backend:** Python 3.12+ / FastAPI / SQLite
- **Frontend:** React / TypeScript / Vite. Design tokens in `frontend/src/tokens.css` (brand red `#BE0000`, Oswald + Open Sans, mobile-first spacing). Reusable UI primitives in `frontend/src/ui/` (`Button`, `Input`, `Select`, `Chip`, `Badge`, `Card`, `Dialog`) — new components should compose from these instead of redefining styles. Spanish only; no i18n runtime.
- **CLI:** Typer (`refugio`)
- **Tests:** pytest (backend), Vitest (frontend), Playwright (e2e)

## Requirements

- Python 3.12+
- Node.js 18+
- pip
- [Caddy](https://caddyserver.com/docs/install) (`brew install caddy` on macOS)

## Installation

```bash
# Backend
pip install -e ".[dev]"

# Frontend
cd frontend && npm install && cd ..
```

## Development

Three local setups, depending on what you're working on. Pick the lightest one
that exercises the feature you care about.

### Lending app only (fastest iteration, HMR)

Backend + Vite dev server. Best for day-to-day work on `/ludoteca`. Runs
natively — no Docker needed.

```bash
# Clone the repo (use development branch for ongoing work)
git clone https://github.com/MiquelAdell/refugio-del-satiro
cd refugio-del-satiro
git checkout development

# Install backend (exposes the `refugio` CLI) and frontend dependencies
pip install -e ".[dev]"
cd frontend && npm install && cd ..
```

To import members, export `members.csv` from the members Google Sheet and place
it at the repo root. If you don't have it, skip the `import-members` line below
and add a single test member instead:

```bash
refugio import-members --email you@example.com --name "Test User" --admin
```

The `--base-url` in the import command is just baked into the generated
password-setup links — it does **not** need to be reachable when you run the
command.

```bash
# One-time: migrate and seed the DB
refugio migrate
refugio import-games data/bgg_collection.json
refugio import-rol                           # Import RPG items from BGG API
refugio import-members members.csv --base-url http://localhost:5173/ludoteca
```

```bash
# Two terminals:
uvicorn backend.api.app:create_app --factory --reload --port 8000   # backend
cd frontend && npm run dev                                          # frontend
```

Or you can instead run the command:

```bash
./dev.sh
```

From the repo root. It starts all four processes and kills them together on
Ctrl+C:

| Process | Port | Role |
|---------|------|------|
| uvicorn | :8000 | FastAPI backend |
| dev_mirror.py | :8080 | Static content mirror |
| Vite | :5173 | React dev server (HMR) |
| Caddy | :2015 | Single entry point |

Open **http://localhost:2015**. Caddy routes `/ludoteca/*` to the Vite dev
server and everything else to the content mirror, so you can navigate between
`/ludoteca/` and `/calendario/` (or any other static page) without switching
ports — the same routing split as production. HMR works as usual.

### Scraped site only

The output of `refugio content run` lives in
[`frontend/public/content-mirror/`](frontend/public/content-mirror/) and its
HTML uses absolute paths (`/_assets/…`, `/inicio`), so it must be served from
the document root — opening `index.html` directly or browsing it under
`/content-mirror/` will break asset and navigation links. Any static server
works:

```bash
cd frontend/public/content-mirror && python -m http.server 8080
```

Open http://localhost:8080/. The lending app is not part of this — links to
`/ludoteca` will 404.

### Full stack (production-like, via Docker)

Mirrors the VPS setup: Caddy at `:80`/`:443` routing `/` to the scraped site,
`/ludoteca` and `/fonts` to the FastAPI app, with HTTPS via Caddy's local CA. Use this
to verify routing, redirects, or anything that depends on both halves living
at the same origin.

```bash
# Requires Docker Desktop running and a .env with at least REFUGIO_JWT_SECRET set.
docker compose up --build -d

# First boot only: migrate and seed the content cache that Caddy serves.
docker compose exec app refugio migrate
docker compose exec app refugio import-games data/bgg_collection.json
docker compose exec app sh -c 'mkdir -p /srv/content && cp -R /app/frontend/dist/content-mirror/. /srv/content/'
```

Open https://localhost/ (scraped site) and https://localhost/ludoteca
(lending app). The browser will warn about the cert — Caddy issues a
self-signed cert from its local CA on first boot; click through to proceed,
or install the CA in your keychain to silence it.

The frontend is **baked into the image at build time**, so re-run
`docker compose up --build -d` after frontend changes. For tight UI loops,
use the lending-app-only setup above.

Stop with `docker compose down` (volumes survive) or `docker compose down -v`
(wipes the DB and content cache).

## CLI

```bash
refugio migrate                          # Run migrations
refugio import-games data/bgg_collection.json  # Import board games from JSON (no reconciliation)
refugio import-games                     # Import board games from BGG API — BGG is the source of truth (requires BGG_BEARER_TOKEN)
refugio import-rol                       # Import RPG items (libros de rol) from BGG API — same reconciliation
refugio import-members members.csv       # Sync members from CSV (missing active members are disabled with a >50% safety guard)
refugio import-members --email x@y.com --name "First Last"  # Add a single member
refugio translate-descriptions           # Translate missing/stale Spanish descriptions via DeepL (requires DEEPL_API_KEY)

refugio content run                      # Scrape Google Sites → frontend/public/content-mirror/
refugio content run --dry-run            # Preview, don't write anything
refugio content list-urls                # Enumerate pages without scraping
refugio content inject-shell             # Retrofit existing HTML files with site-shell scaffolding
python -m scraper                        # Equivalent to `refugio content run`
```

See [`scraper/README.md`](scraper/README.md) for the content-mirror
architecture, extension points, and gotchas.

Admins can also re-run `import-games` from the browser: the "Datos BGG"
page under `/ludoteca/admin/bgg` shows the last import date and has a
"Reimportar desde BGG" button, so this no longer requires shell access to
the server. It runs the same BGG-API-first, HTML-scrape-fallback import as
the CLI command above.

BGG descriptions are English; when `DEEPL_API_KEY` is set, `import-games`,
`import-rol`, and `enrich-games` translate new or changed descriptions to
Spanish via DeepL (API Free plan), caching each translation on the row by a
hash of its English source so unchanged descriptions never re-consume quota.
`translate-descriptions` runs the same backfill standalone. Without a key or
on any DeepL failure the import still succeeds and the catalog serves the
English text.

Re-importing from the BGG API (`import-games` and `import-rol`, but not the
JSON-seed form) treats BGG as the source of truth: an item that has
disappeared from the club's BGG collection is removed. If it's not
currently on loan, it's hard-deleted; if it is, it's hidden from the
catalog (but its loan can still be returned normally) and gets deleted on
a later import once returned — unless it has past loan history, in which
case it stays hidden indefinitely rather than losing that history. As a
safety guard, if the BGG fetch comes back empty or would newly remove more
than 50% of the current active catalog, that run skips removing
newly-missing items (still applying updates and cleaning up already-hidden
ones) and reports a warning instead.

Catalog rows are identified by BGG's per-copy collection entry id
(`bgg_collection_id`), not by BGG's `bgg_id` (objectid). BGG can list
several distinct owned items — different names, images, editions — under
one shared objectid (e.g. themed spin-offs BGG treats as versions of a
single base game rather than giving each its own id); keying on the
collection entry instead of the objectid keeps those as separate catalog
rows instead of collapsing them into one. Rows imported before this
existed adopt their collection id automatically on the next import; legacy
rows that are no longer in the BGG collection at all go through the same
removal flow (and safety guard) as collection-id rows.

Catalog location is also synchronized from the BGG collection comment. Items
default to **Armario**; add `Sótano` or `Sotano` as a separate word in an
item's comment to place it in **Sótano** and make it available through the
location filter. Text embedded inside another word does not change location.

Admins can upload the members CSV from `/ludoteca/admin/members`. The upload
creates and updates members, disables active members that are absent from the
file, and preserves the administrator running the import. Empty files and files
that would disable more than 50% of the other active members skip deactivation
and show a safety warning instead.

## Tests

```bash
# Backend
pytest
pytest --cov=backend --cov-report=term-missing

# Frontend
cd frontend && npm test

# Lint and format
ruff check backend/ tests/
black backend/ tests/
cd frontend && npm run lint
```

## Architecture

Clean Architecture with strict layered dependencies:

```
backend/
├── domain/          # Entities, Protocols, Use cases (zero infrastructure deps)
├── data/            # SQLite repositories, BGG client
├── api/             # FastAPI (routes, auth, dependencies)
├── cli/             # Typer commands
├── config.py        # Settings (env vars)
└── migrations/      # Versioned SQL files

frontend/
├── src/
│   ├── api/         # Typed HTTP client
│   ├── components/  # Reusable React components
│   ├── context/     # AuthContext
│   ├── hooks/       # Data fetching hooks
│   ├── pages/       # Pages (Catalog, Detail, My Loans, Login)
│   └── types/       # TypeScript interfaces
```

## Environment Variables

| Variable | Description | Default |
|----------|------------|---------|
| `REFUGIO_DB_PATH` | SQLite database file path | `refugio.db` |
| `REFUGIO_JWT_SECRET` | JWT signing secret | (dev secret) |
| `REFUGIO_BASE_URL` | Lending app public URL (used in reset-password emails) | `http://localhost:5173/ludoteca` |
| `REFUGIO_SECURE_AUTH_COOKIE` | Send auth cookies over HTTPS only; set to `true` for production | `false` |
| `REFUGIO_CONTENT_MIRROR_DIR` | Where the admin "Resync content" button writes scraped pages | `frontend/public/content-mirror` (dev) / `/srv/content` (prod) |
| `REFUGIO_CONTENT_SOURCE_ORIGIN` | Upstream source for content sync; keep independent of public DNS | `https://sites.google.com/view/refugiodelsatiro` |
| `REFUGIO_CANONICAL_ORIGIN` | Public origin used in canonical links, `robots.txt`, and `sitemap.xml` | `https://DOMAIN` in Compose; `https://refugiodelsatiro.es` outside Compose |
| `DOMAIN` | Canonical hostname served by Caddy | `localhost` |
| `REDIRECT_DOMAIN` | Alternate hostname redirected to `DOMAIN`; set to `www.refugiodelsatiro.es` only for production | Same as `DOMAIN` (no redirect) |
| `ROLLBACK_DOMAIN` | Temporary hostname served without redirect during the DNS rollback window; set to `test.refugiodelsatiro.es` for production | Same as `DOMAIN` |
| `BGG_BEARER_TOKEN` | BGG API bearer token (optional) | — |
| `DEEPL_API_KEY` | DeepL API Free key for Spanish description translation (optional; untranslated descriptions are served in English) | — |
| `VITE_API_URL` | Frontend API base URL | `/ludoteca/api` |

## Deployment (VPS with Docker)

The project includes Docker and Docker Compose configuration for deployment on any VPS (tested on RackNerd, Hetzner).

### First-time server setup

```bash
# SSH into your VPS as root and run the setup script:
bash <(curl -sSL https://raw.githubusercontent.com/<user>/refugio-del-satiro/development/deploy/setup-server.sh)
```

This installs Docker, creates a `deploy` user, and configures the firewall.

### Deploy the app

```bash
# SSH as deploy user
ssh deploy@<server-ip>

# Clone and configure
git clone <repo-url> ~/refugio-del-satiro
cd ~/refugio-del-satiro
cp .env.production .env
# Edit .env — set REFUGIO_JWT_SECRET and DOMAIN. For production, also set
# REDIRECT_DOMAIN=www.refugiodelsatiro.es and
# ROLLBACK_DOMAIN=test.refugiodelsatiro.es; staging leaves them unset.
nano .env

# Start everything
docker compose up -d

# Import data
docker compose exec app refugio migrate
docker compose exec app refugio import-games data/bgg_collection.json
```

### Releases and deployment

`development` is staging-only. Every push to it deploys the exact pushed SHA
to the staging checkout and must be browser-tested at
`https://test.refugiodelsatiro.es/` before release.

Production is deliberately manual: merge the tested release into `main`, then
run the **Deploy** workflow from the `main` branch and choose `production`.
GitHub's `production` environment must require the release approval before its
job can access production secrets. The workflow checks out the exact `main`
SHA and passes it to `deploy/deploy.sh`; the script refuses to deploy a
different checkout or a server checkout with tracked changes.

The current VPS is a single stack, not isolated staging. Before a production
cutover on that stack, set the repository variable `STAGING_DEPLOY_ENABLED` to
`false` to freeze `development` deployments. Do this before configuring the
production job with that stack's checkout. Keep it disabled until staging has
its own host or isolated stack.

Configure these repository/environment secrets before enabling either route:

| Secret | Value |
|--------|-------|
| `STAGING_DEPLOY_HOST` | Staging server hostname or IP |
| `STAGING_DEPLOY_USER` | SSH user for staging |
| `STAGING_DEPLOY_SSH_KEY` | Private key authorised for staging |
| `STAGING_DEPLOY_PORT` | SSH port for staging, optional (defaults to `22`) |
| `STAGING_DEPLOY_DIR` | Absolute staging checkout directory |
| `PRODUCTION_DEPLOY_HOST` | Production server hostname or IP |
| `PRODUCTION_DEPLOY_USER` | SSH user for production |
| `PRODUCTION_DEPLOY_SSH_KEY` | Private key authorised for production |
| `PRODUCTION_DEPLOY_PORT` | SSH port for production, optional (defaults to `22`) |
| `PRODUCTION_DEPLOY_DIR` | Absolute production checkout directory |

Until staging and production have separate checkouts (and preferably separate
stacks), do not configure the two directory secrets to the same path. A
staging deployment must never be able to change the production checkout.

For an emergency manual deployment, use the same pinned-release sequence, not
`git pull`:

```bash
cd /root/refugio-del-satiro
git fetch --prune origin main
RELEASE_SHA=$(git rev-parse origin/main)
git checkout --detach "$RELEASE_SHA"
./deploy/deploy.sh "$RELEASE_SHA"
```

### Daily database backups

Production takes a consistent SQLite snapshot daily at 03:00 Europe/Madrid
and keeps the 14 newest snapshots in Google Drive. The backup
contains member data, password hashes, and any reset tokens that have not yet
expired. It does not have separate client-side encryption: access depends on
the security of the Google account. Keep
`Backups/refugio-del-satiro/database` private, do not share it, and enable 2FA
on `refugiodelsatiro@gmail.com` before enabling the timer.

Install `rclone` and authorize the club account once, as root:

```bash
apt-get update
apt-get install -y rclone
install -d -m 0700 /root/.config/rclone
rclone config
```

In `rclone config`, create a Google Drive remote named `refugio-drive`, use the
standard Drive backend, and complete the OAuth login with
`refugiodelsatiro@gmail.com`. On a headless server, follow rclone's prompt to
authorize in a browser on another machine. Then lock down the OAuth refresh
token, create the backup directory, and check access:

```bash
chown root:root /root/.config/rclone/rclone.conf
chmod 0600 /root/.config/rclone/rclone.conf
rclone --config /root/.config/rclone/rclone.conf mkdir \
  refugio-drive:Backups/refugio-del-satiro/database
rclone --config /root/.config/rclone/rclone.conf lsd \
  refugio-drive:Backups/refugio-del-satiro
```

`/root/.config/rclone/rclone.conf` contains the OAuth refresh token. Never
commit it, copy it into the repository, or print it in logs. Confirm in the
Google Drive sharing panel that the backup folder is restricted to the club
account.

Install and start the systemd timer from the production checkout:

```bash
cd /root/refugio-del-satiro
install -m 0644 deploy/systemd/refugio-backup.service \
  /etc/systemd/system/refugio-backup.service
install -m 0644 deploy/systemd/refugio-backup.timer \
  /etc/systemd/system/refugio-backup.timer
systemctl daemon-reload
systemctl enable --now refugio-backup.timer
systemctl list-timers refugio-backup.timer
```

The last command shows the next run in the server's local display timezone;
the timer itself always uses Europe/Madrid. To run a backup now and inspect it:

```bash
systemctl start refugio-backup.service
systemctl status refugio-backup.service --no-pager
journalctl -u refugio-backup.service -n 100 --no-pager
rclone --config /root/.config/rclone/rclone.conf lsl \
  refugio-drive:Backups/refugio-del-satiro/database \
  --include 'refugio-????????T??????Z.db'
```

The backup script uploads a snapshot only after `PRAGMA quick_check` succeeds.
It checks the uploaded byte count before deleting old snapshots, and rotation
only matches names such as `refugio-20260717T010203Z.db`. Other files in the
Drive folder are left alone. For a local test that does not contact Drive or
rotate files, run:

```bash
cd /root/refugio-del-satiro
./deploy/backup-db.sh --dry-run
```

The dry run leaves its validated snapshot in `/var/lib/refugio-backup`; inspect
it and remove it only when the retention window allows.

#### Non-destructive restore drill

Run this after enabling backups and at least quarterly, using a real filename
from the remote listing. It verifies the off-box byte count, downloads the
snapshot into a temporary directory, runs `PRAGMA integrity_check`, checks the
core tables, prints non-PII table counts, and never mounts or changes the
production database. Record the expected counts from the pre-cutover backup in
the cutover log and pass them to make the drill an assertion rather than a
visual check:

```bash
cd /root/refugio-del-satiro
./deploy/restore-drill.sh refugio-YYYYMMDDTHHMMSSZ.db \
  --expect-members 0 --expect-games 0 --expect-loans 0
```

Replace the zeroes with the counts captured for that selected snapshot. To
inspect an older snapshot without fixed expectations, omit the three
`--expect-*` arguments.

The equivalent manual procedure is retained below for incident response and
auditability:

```bash
cd /root/refugio-del-satiro
BACKUP=refugio-YYYYMMDDTHHMMSSZ.db
RESTORE_DIR=$(mktemp -d /root/refugio-restore-test.XXXXXX)
rclone --config /root/.config/rclone/rclone.conf copyto \
  "refugio-drive:Backups/refugio-del-satiro/database/$BACKUP" \
  "$RESTORE_DIR/$BACKUP"

docker compose run --rm --no-deps -T \
  -v "$RESTORE_DIR:/restore:ro" \
  -e BACKUP="$BACKUP" \
  app python - <<'PY'
import os
import sqlite3

path = f"/restore/{os.environ['BACKUP']}"
db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
try:
    result = db.execute("PRAGMA integrity_check").fetchall()
    tables = {
        row[0]
        for row in db.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        )
    }
finally:
    db.close()

if result != [("ok",)]:
    raise SystemExit(f"integrity_check failed: {result!r}")

expected = {"games", "members", "loans", "password_tokens", "schema_migrations"}
missing = expected - tables
if missing:
    raise SystemExit(f"missing expected tables: {sorted(missing)}")

print("integrity_check: ok")
print("tables:", ", ".join(sorted(tables)))
PY

rm -f "$RESTORE_DIR/$BACKUP"
rmdir "$RESTORE_DIR"
unset BACKUP RESTORE_DIR
```

#### Emergency recovery

Choose the snapshot explicitly. Validate it before stopping the app:

```bash
cd /root/refugio-del-satiro
BACKUP=refugio-YYYYMMDDTHHMMSSZ.db
RESTORE_DIR=$(mktemp -d /root/refugio-recovery.XXXXXX)
rclone --config /root/.config/rclone/rclone.conf copyto \
  "refugio-drive:Backups/refugio-del-satiro/database/$BACKUP" \
  "$RESTORE_DIR/$BACKUP"

docker compose run --rm --no-deps -T \
  -v "$RESTORE_DIR:/restore:ro" \
  -e BACKUP="$BACKUP" \
  app python - <<'PY'
import os
import sqlite3

path = f"/restore/{os.environ['BACKUP']}"
db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
try:
    result = db.execute("PRAGMA integrity_check").fetchall()
finally:
    db.close()
if result != [("ok",)]:
    raise SystemExit(f"integrity_check failed: {result!r}")
print("integrity_check: ok")
PY
```

Only continue if that prints `integrity_check: ok`. Stop the app, make a
consistent rollback snapshot of the current database, and atomically install
the selected backup inside the Docker volume:

```bash
docker compose stop app

docker compose run --rm --no-deps -T \
  -v "$RESTORE_DIR:/restore:ro" \
  -e BACKUP="$BACKUP" \
  app python - <<'PY'
from datetime import datetime, timezone
import os
from pathlib import Path
import shutil
import sqlite3

db_path = Path("/app/data/db/refugio.db")
source_path = Path("/restore") / os.environ["BACKUP"]
stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
rollback_path = db_path.with_name(f"refugio-pre-restore-{stamp}.db")
temporary_path = db_path.with_name("refugio.db.restore.tmp")

if not db_path.is_file():
    raise SystemExit(f"current database not found: {db_path}")

source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
try:
    if source.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
        raise SystemExit("selected backup failed integrity_check")
finally:
    source.close()

current = sqlite3.connect(db_path)
rollback = sqlite3.connect(rollback_path)
try:
    current.backup(rollback)
finally:
    rollback.close()
    current.close()

rollback = sqlite3.connect(f"file:{rollback_path}?mode=ro", uri=True)
try:
    if rollback.execute("PRAGMA quick_check").fetchall() != [("ok",)]:
        raise SystemExit("rollback snapshot failed quick_check")
finally:
    rollback.close()

shutil.copyfile(source_path, temporary_path)
temporary_path.chmod(0o600)
for suffix in ("-wal", "-shm"):
    Path(f"{db_path}{suffix}").unlink(missing_ok=True)
os.replace(temporary_path, db_path)
print(f"rollback saved at {rollback_path}")
PY

docker compose up -d app
docker compose exec app refugio migrate
curl --fail --silent --show-error \
  https://refugiodelsatiro.es/ludoteca/api/health
```

The health endpoint must return `{"status":"ok"}`. Log in and smoke-test the
catalog, member profile, and an admin page before declaring recovery complete.
Keep the printed `refugio-pre-restore-*.db` rollback file until the recovered
site has been checked. Then remove the downloaded file and temporary directory:

```bash
rm -f "$RESTORE_DIR/$BACKUP"
rmdir "$RESTORE_DIR"
unset BACKUP RESTORE_DIR
```

### Content sync (manual)

Content changes published at `https://sites.google.com/view/refugiodelsatiro/`
flow into this repo manually, independently of the custom-domain DNS:

1. Run `python -m scraper run` locally (or `refugio content run`).
2. Review the diff under `frontend/public/content-mirror/`.
3. Commit and push if it looks good.

Editors can also hit the admin-only "Resync" button at `/ludoteca/admin/content`
to refresh the VPS cache immediately — changes are visible on the served
custom domain right away, but don't reach the repo until someone
runs the local workflow above.

### BGG game data (manual)

The `import-games` step on the server (see above) also runs automatically
on every deploy. To re-run it on demand — e.g. after adding a game to the
club's BGG collection — an admin can use the "Datos BGG" page at
`/ludoteca/admin/bgg` instead of SSHing in.

### What the stack runs

- **App container**: Python 3.12 + FastAPI serving API and built React frontend
- **Caddy container**: Reverse proxy with automatic HTTPS via Let's Encrypt
- **Persistent volume**: SQLite database survives container restarts

### Alternative: Render

A [`render.yaml`](render.yaml) blueprint is also included for deployment to [Render](https://render.com) (free tier with limitations).

## Planned work

- **Lending redesign (v1)** — visual + interaction rebuild of `/prestamos` to align with the club site (`refugiodelsatiro.es`) typography and color, based on the UOC TFM by Ariadna Ortega Rams. Roadmap and specs in [`openspec/changes/archive/2026-04-25-plan-lending-redesign/`](openspec/changes/archive/2026-04-25-plan-lending-redesign/). Implementation phases:
  - Phase A: design tokens + primitives + drop i18n — **complete**.
  - Site shell with data-driven nav and new "Préstamos" submenu — **in progress** ([`openspec/changes/site-shell-from-scraped-html/`](openspec/changes/site-shell-from-scraped-html/), PR #46). Submenu children from `_nav.json` deferred to a follow-up issue.
  - Phase B0–B3 (catalog rebuild: reconciled Figma tokens, cover-first cards, side-panel filters + chips, grid/list toggle, detail hero with borrow CTA, public `/ludoteca`) — **complete** ([`openspec/changes/lending-catalog-rebuild/`](openspec/changes/lending-catalog-rebuild/)).
  - Figma style alignment (white pages, Figma button/dialog/card styles) — PR #89; catalog filters as the tabbed Buscador/Filtros box replacing the side panel + drawer — [`openspec/changes/catalog-filters-figma-restyle/`](openspec/changes/catalog-filters-figma-restyle/), PR #91.
  - Phase B4+C1 (borrow with return date), Phase D (admin members restyle) — to be opened later.

## License

GPL-3.0
