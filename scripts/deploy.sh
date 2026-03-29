#!/bin/bash
set -e

APP_DIR=/opt/watether

echo "[deploy] $(date) — starting"

# ── Pull latest via deploy key ────────────────────────────────────────────────
cd $APP_DIR
if [ ! -d .git ]; then
  git init
  git remote add origin git@github.com:aseprahman04/watheter.git
else
  git remote set-url origin git@github.com:aseprahman04/watheter.git
fi
GIT_SSH_COMMAND='ssh -i /root/.ssh/watether_deploy -o StrictHostKeyChecking=no' \
  git fetch origin main
git checkout -f main 2>/dev/null || git checkout -b main origin/main
git reset --hard origin/main

# ── Backend: build Docker image & restart ─────────────────────────────────────
echo "[deploy] building backend..."
docker build -t watether-backend:latest .
docker compose -f docker-compose.prod.yml up -d --force-recreate
docker image prune -f

# ── Frontend: build Next.js standalone ───────────────────────────────────────
echo "[deploy] building frontend..."
cd $APP_DIR/frontend
npm ci --legacy-peer-deps
NEXT_PUBLIC_API_BASE_URL=https://watheter.com npm run build

mkdir -p $APP_DIR/frontend/.next/standalone/frontend/.next
cp -r $APP_DIR/frontend/.next/static $APP_DIR/frontend/.next/standalone/frontend/.next/static
cp -r $APP_DIR/frontend/public $APP_DIR/frontend/.next/standalone/frontend/public 2>/dev/null || true

# ── Frontend: restart PM2 ─────────────────────────────────────────────────────
echo "[deploy] restarting frontend..."
cd $APP_DIR
pm2 startOrRestart $APP_DIR/ecosystem.config.js --update-env
pm2 save

echo "[deploy] done ✓"
