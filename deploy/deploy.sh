#!/usr/bin/env bash
# Deploy a previously checked-out, pinned release from the project root.
# Usage: ./deploy/deploy.sh <full-release-sha>
set -euo pipefail

readonly expected_sha="${1:?Usage: ./deploy/deploy.sh <full-release-sha>}"
readonly release_sha="$(git rev-parse HEAD)"

if [[ "$release_sha" != "$expected_sha" ]]; then
    echo "Checked-out commit ($release_sha) does not match requested release ($expected_sha)." >&2
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Refusing to deploy with tracked changes in the server checkout." >&2
    exit 1
fi

echo "==> Deploying pinned release $release_sha"

echo "==> Building and starting containers"
docker compose up -d --build

echo "==> Restarting Caddy (bind-mounted Caddyfile is not picked up by 'up -d')"
docker compose restart caddy

echo "==> Running migrations"
docker compose exec app refugio migrate

echo "==> Importing and enriching games from BGG"
docker compose exec app refugio import-games
docker compose exec app refugio enrich-games

echo "==> Importing RPG items from BGG"
docker compose exec app refugio import-rol

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
