# Refugio del Sátiro

Website for the **Refugio del Sátiro** RPG association.

Current scope: the game-lending feature (mounted at `/prestamos`). Members can
browse the catalog, borrow games, and return them. The catalog is imported
from [BoardGameGeek](https://boardgamegeek.com/collection/user/RefugioDelSatiro?subtype=boardgame&own=1&ff=1).

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

Backend + Vite dev server. Best for day-to-day work on `/prestamos`. Runs
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
refugio import-members members.csv --base-url http://localhost:5173/prestamos
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

Open **http://localhost:2015**. Caddy routes `/prestamos/*` to the Vite dev
server and everything else to the content mirror, so you can navigate between
`/prestamos/` and `/calendario/` (or any other static page) without switching
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
`/prestamos` will 404.

### Full stack (production-like, via Docker)

Mirrors the VPS setup: Caddy at `:80`/`:443` routing `/` to the scraped site
and `/prestamos` to the FastAPI app, with HTTPS via Caddy's local CA. Use this
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

Open https://localhost/ (scraped site) and https://localhost/prestamos
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
refugio import-games data/bgg_collection.json  # Import games from JSON
refugio import-games                     # Import games from BGG API (requires BGG_BEARER_TOKEN)
refugio import-members members.csv       # Import members from CSV
refugio import-members --email x@y.com --name "First Last"  # Add a single member

refugio content run                      # Scrape Google Sites → frontend/public/content-mirror/
refugio content run --dry-run            # Preview, don't write anything
refugio content list-urls                # Enumerate pages without scraping
refugio content inject-shell             # Retrofit existing HTML files with site-shell scaffolding
python -m scraper                        # Equivalent to `refugio content run`
```

See [`scraper/README.md`](scraper/README.md) for the content-mirror
architecture, extension points, and gotchas.

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
| `REFUGIO_BASE_URL` | Lending app public URL (used in reset-password emails) | `http://localhost:5173/prestamos` |
| `REFUGIO_CONTENT_MIRROR_DIR` | Where the admin "Resync content" button writes scraped pages | `frontend/public/content-mirror` (dev) / `/srv/content` (prod) |
| `BGG_BEARER_TOKEN` | BGG API bearer token (optional) | — |
| `VITE_API_URL` | Frontend API base URL | `/prestamos/api` |

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
# Edit .env — set REFUGIO_JWT_SECRET and DOMAIN
nano .env

# Start everything
docker compose up -d

# Import data
docker compose exec app refugio migrate
docker compose exec app refugio import-games data/bgg_collection.json
```

### Update after changes

```bash
cd ~/refugio-del-satiro
./deploy/deploy.sh
```

### Automatic deployment

Pushes to `development` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which SSHes into the server and runs `deploy/deploy.sh`. Requires these GitHub
Actions secrets on the repository:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Server hostname or IP (e.g. `45.95.175.19`) |
| `DEPLOY_USER` | SSH user (e.g. `root`) |
| `DEPLOY_SSH_KEY` | Private SSH key authorised on the server |
| `DEPLOY_PORT` | SSH port, optional (defaults to `22`) |

### Content sync (manual)

Content changes on `www.refugiodelsatiro.es` flow into this repo manually:

1. Run `python -m scraper run` locally (or `refugio content run`).
2. Review the diff under `frontend/public/content-mirror/`.
3. Commit and push if it looks good.

Editors can also hit the admin-only "Resync" button at `/prestamos/admin/content`
to refresh the VPS cache immediately — changes are visible on
`www.refugiodelsatiro.es` right away, but don't reach the repo until someone
runs the local workflow above.

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
  - Phase B (catalog rebuild), Phase B4+C1 (borrow with return date), Phase D (admin members restyle) — to be opened later.

## License

GPL-3.0
