#!/bin/bash
set -e

APP_DIR=/opt/watether

echo "[deploy] $(date) — starting"

# ── Backend: build Docker image & restart ─────────────────────────────────────
cd $APP_DIR
echo "[deploy] building backend..."
docker build -t watether-backend:latest .
docker compose -f docker-compose.prod.yml up -d --force-recreate
docker image prune -f

# ── Frontend: build Next.js standalone ───────────────────────────────────────
echo "[deploy] building frontend..."
cd $APP_DIR/frontend
npm ci --legacy-peer-deps
NEXT_PUBLIC_API_BASE_URL=https://watheter.com/api npm run build

mkdir -p $APP_DIR/frontend/.next/standalone/frontend/.next
# Replace static assets (delete first to avoid stale files from prev build)
rm -rf $APP_DIR/frontend/.next/standalone/frontend/.next/static
cp -r $APP_DIR/frontend/.next/static $APP_DIR/frontend/.next/standalone/frontend/.next/static
cp -r $APP_DIR/frontend/public $APP_DIR/frontend/.next/standalone/frontend/public 2>/dev/null || true

# ── Frontend: restart PM2 ─────────────────────────────────────────────────────
echo "[deploy] restarting frontend..."
cd $APP_DIR
pm2 startOrRestart $APP_DIR/ecosystem.config.js --update-env
pm2 save
# Force reload to ensure all cluster instances run new code
pm2 reload watether-frontend --update-env || true

# ── Nginx: ensure SSL cert exists (self-signed, works with Cloudflare Full mode)
mkdir -p /etc/ssl/watether
if [ ! -f /etc/ssl/watether/origin.pem ]; then
  echo "[deploy] generating self-signed cert..."
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/ssl/watether/origin.key \
    -out /etc/ssl/watether/origin.pem \
    -subj "/CN=watheter.com"
fi

# ── Nginx: update config & reload ────────────────────────────────────────────
echo "[deploy] reloading nginx..."
rm -f /etc/nginx/sites-enabled/watether  # remove old config without .conf extension
cp $APP_DIR/nginx/watheter.conf /etc/nginx/sites-available/watheter.conf
ln -sf /etc/nginx/sites-available/watheter.conf /etc/nginx/sites-enabled/watheter.conf
nginx -t && systemctl reload nginx

echo "[deploy] done ✓"
