#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

eval "$(pyenv init -)"

pip install -e . --quiet

# The content mirror is git-ignored (regenerable); populate it on first run so
# localhost serves the same pages/images as production.
if [ ! -f frontend/public/content-mirror/index.html ]; then
  echo "Content mirror missing — running scraper (one-off, takes a minute)…"
  python -m scraper run
fi

python -m uvicorn backend.api.app:create_app --factory --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

python scripts/dev_mirror.py &
MIRROR_PID=$!

cd frontend
npm install --silent
# Mirror pages load the header from this bundle; keep it fresh so static pages
# show the same header as the SPA in dev.
npm run build:site-shell
npm run dev &
FRONTEND_PID=$!

cd ..
caddy run --config Caddyfile.dev --adapter caddyfile &
CADDY_PID=$!

trap "kill $BACKEND_PID $MIRROR_PID $FRONTEND_PID $CADDY_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "Dev server:     http://localhost:2015"
echo "Backend:        http://localhost:8000"
echo "Frontend:       http://localhost:5173"
echo "Content mirror: http://localhost:8080"
echo "Press Ctrl+C to stop all."
echo ""

wait
