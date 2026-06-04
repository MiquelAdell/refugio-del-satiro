#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

eval "$(pyenv init -)"

pip install -e . --quiet

python -m uvicorn backend.api.app:create_app --factory --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

python scripts/dev_mirror.py &
MIRROR_PID=$!

cd frontend
npm install --silent
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
