# E2E Stack

Playwright tests run against a production-shaped stack: the built SPA is
served by FastAPI, with Caddy in front applying the same redirect and
canonicalisation rules as production.

## Architecture

```
browser
   │
   ▼
Caddy :8090  (Caddyfile.e2e)
   ├── /prestamos/*   ── reverse_proxy ──▶  uvicorn :8000 (serves frontend/dist)
   ├── legacy redirects (/inicio → /, /socios/ludoteca → /ludoteca/, accented
   │   slugs → ASCII, etc.) — see Caddyfile.e2e
   ├── trailing-slash canonicaliser (excludes /, /prestamos/*, *.* files)
   └── content-mirror static files  (frontend/public/content-mirror)
```

`baseURL` for tests is `http://localhost:8090`, so every request exercises
the real matcher set rather than a stripped-down dev proxy.

## How to run locally

Prerequisite: `caddy` on `PATH`.

- macOS: `brew install caddy`
- CI: installed via apt in `.github/workflows/ci.yml`

Then:

```bash
cd frontend
yarn build          # FastAPI serves frontend/dist
yarn test:e2e
```

Playwright's `globalSetup` seeds the `guest` / `member` / `admin`
storage-state fixtures by calling the backend login endpoint once per run.

## webServer entries

`playwright.config.ts` launches two processes:

1. **uvicorn** — `python -m uvicorn backend.api.app:create_app --factory
   --port 8000` (cwd: repo root). Serves the API and the built SPA from
   `frontend/dist`.
2. **caddy** — `caddy run --config Caddyfile.e2e --adapter caddyfile` (cwd:
   repo root). Listens on `:8090`, applies redirects, reverse-proxies
   `/prestamos/*` to uvicorn, and serves the static content mirror for
   non-SPA routes.

Both use `reuseExistingServer: true`, so a developer can start them by hand
and re-run `yarn test:e2e` against the warm stack.

## Relation to `scripts/dev_mirror.py`

The day-to-day dev loop (`dev.sh`) still runs Vite + `scripts/dev_mirror.py`
in front of uvicorn — only the e2e stack uses Caddy. Unifying dev and e2e
behind a single Caddy front-end is a possible future workstream.
