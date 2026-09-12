#!/usr/bin/env bash
# Run from the project root on the server to deploy or update.
# Usage: ./deploy/deploy.sh [commit]
set -euo pipefail

if [ "$#" -gt 1 ]; then
    echo "Usage: $0 [commit]" >&2
    exit 64
fi

if [ "$#" -eq 1 ]; then
    release_sha="$1"
    echo "==> Using pinned release $release_sha"
    git rev-parse --verify "$release_sha^{commit}" >/dev/null
    git checkout --detach "$release_sha"
else
    echo "==> Pulling latest code"
    git pull
fi

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
