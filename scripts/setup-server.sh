#!/bin/bash
# Run once on the server to prepare everything for WATether.
# Usage: bash setup-server.sh
set -e

APP_DIR=/opt/talab
LOG_DIR=/var/log/watether

echo "=== WATether server setup ==="

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p $APP_DIR $LOG_DIR /etc/ssl/watether

# ── Clone repo ────────────────────────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
  git clone https://github.com/aseprahman04/talab.git $APP_DIR
else
  echo "Repo already cloned."
fi

# ── Postgres: create watether database ───────────────────────────────────────
echo "Creating database..."
docker exec epondok-postgres psql -U epondok -c "CREATE DATABASE watether;" 2>/dev/null \
  || echo "Database already exists, skipping."

# ── Nginx config ──────────────────────────────────────────────────────────────
cp $APP_DIR/nginx/talab.conf /etc/nginx/sites-available/talab
ln -sf /etc/nginx/sites-available/talab /etc/nginx/sites-enabled/watether
nginx -t && systemctl reload nginx

echo ""
echo "=== Next steps ==="
echo "1. Upload Cloudflare Origin cert:"
echo "   /etc/ssl/watether/origin.pem"
echo "   /etc/ssl/watether/origin.key"
echo ""
echo "2. Create production env file:"
echo "   cp $APP_DIR/.env.production.example $APP_DIR/.env.production"
echo "   nano $APP_DIR/.env.production"
echo ""
echo "3. Run first deploy:"
echo "   bash $APP_DIR/scripts/deploy.sh"
echo ""
echo "4. Add GitHub secret PROD_SSH_KEY (your server private key)"
