#!/usr/bin/env bash
# Run from the project root on the server to deploy or update.
# Usage: ./deploy/deploy.sh
set -euo pipefail

echo "==> Pulling latest code"
git pull

echo "==> Building and starting containers"
docker compose up -d --build

echo "==> Restarting Caddy (bind-mounted Caddyfile is not picked up by 'up -d')"
docker compose restart caddy

echo "==> Running migrations"
docker compose exec app refugio migrate

echo "==> Importing and enriching games from BGG"
docker compose exec app refugio import-games
docker compose exec app refugio enrich-games

echo "==> Seeding content mirror from git-checked-in copy"
# Seeds /srv/content (the shared volume Caddy serves) from the version Vite
# bundled into the frontend at build time. Admin-triggered syncs will
# overwrite this on the VPS until the next deploy re-seeds.
docker compose exec app sh -c '
    set -e
    if [ -d /app/frontend/dist/content-mirror ]; then
        mkdir -p /srv/content
        cp -R /app/frontend/dist/content-mirror/. /srv/content/
    fi
'

echo "==> Deploy complete!"
echo "    App is running at $(grep REFUGIO_BASE_URL .env | cut -d= -f2)"
