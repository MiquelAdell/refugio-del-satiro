#!/usr/bin/env bash
# Run this script on a fresh RackNerd VPS (Ubuntu 22.04+) as root.
# Usage: curl -sSL <raw-github-url> | bash
set -euo pipefail

echo "==> Updating system packages"
apt-get update && apt-get upgrade -y

echo "==> Installing Docker"
curl -fsSL https://get.docker.com | sh

echo "==> Installing Docker Compose plugin"
apt-get install -y docker-compose-plugin

echo "==> Creating deploy user"
if ! id -u deploy &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG sudo deploy
    usermod -aG docker deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
fi

echo "==> Setting up SSH key for deploy user"
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys 2>/dev/null || true

echo "==> Configuring firewall"
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "==> Server setup complete!"
echo ""
echo "Next steps:"
echo "  1. SSH in as deploy: ssh deploy@<server-ip>"
echo "  2. Clone the repo: git clone <repo-url> ~/refugio-del-satiro"
echo "  3. cd ~/refugio-del-satiro"
echo "  4. Copy .env.production to .env and set your values"
echo "  5. Run: docker compose up -d"
echo "  6. Import data: docker compose exec app refugio migrate"
echo "  7. Import games: docker compose exec app refugio import-games data/bgg_collection.json"
