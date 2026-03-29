#!/bin/bash
set -e

APP_DIR=/opt/watether
LOG_DIR=/var/log/watether

echo "[deploy] $(date) — starting"

cd $APP_DIR

# ── Pull latest ───────────────────────────────────────────────────────────────
git pull origin main

# ── Backend: build Docker image & restart container ──────────────────────────
echo "[deploy] building backend image..."
docker build -t watether-backend:latest .

echo "[deploy] restarting backend container..."
docker compose -f docker-compose.prod.yml up -d --force-recreate
docker image prune -f

# ── Frontend: build Next.js standalone ───────────────────────────────────────
echo "[deploy] building frontend..."
cd $APP_DIR/frontend
npm ci --omit=dev
NEXT_PUBLIC_API_BASE_URL=https://watheter.com npm run build

# Copy static assets to a stable path nginx can serve
cp -r $APP_DIR/frontend/.next/static $APP_DIR/frontend/.next/standalone/.next/static
cp -r $APP_DIR/frontend/public $APP_DIR/frontend/.next/standalone/public 2>/dev/null || true

# ── Frontend: restart PM2 ─────────────────────────────────────────────────────
echo "[deploy] restarting frontend (pm2)..."
cd $APP_DIR
pm2 startOrRestart ecosystem.config.js --update-env
pm2 save

echo "[deploy] done ✓"
