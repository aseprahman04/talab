# WATether — Agent Handoff Plan

## Context

WATether adalah WhatsApp gateway SaaS (NestJS + Next.js) yang sudah production di `watheter.com`.
Sesi sebelumnya menyelesaikan: full English translation, e2e + unit tests, anti-ban improvements
(startup stagger + per-device daily limit), dan queue concurrency tuning.

**Target scale: 2.000 user × 20 devices = 40.000 concurrent WA sessions.**

Arsitektur sekarang tidak bisa handle ini karena seluruh sesi WA hidup dalam satu Node.js process
di `WhatsAppSessionManager` (`private sessions = new Map<string, WASocket>()`).
Batas praktis saat ini: ±50–100 device sebelum memory / event-loop breakdown.

Repo: `f:\Projects\WATether` · Branch: `main` · VPS: `root@194.233.67.65`
Backend port: 3009 (host mode) · Frontend port: 3010 (PM2 cluster × 2)

---

## Phase Roadmap

```
Phase 1 ✅  Anti-ban, concurrency, tests, English frontend
Phase 2 🔜  Pisah session manager → dedicated device-worker process (PRIORITY NEXT)
Phase 3 📋  Shard device-workers (N proses, deviceId % N routing)
Phase 4 📋  Horizontal VPS scale + load balancer
```

---

## Phase 2 — Dedicated Device Worker Process (IMPLEMENT INI DULU)

### Masalah yang diselesaikan

| Sekarang | Setelah Phase 2 |
|---|---|
| API + WA sessions dalam 1 proses | API proses terpisah dari WA proses |
| Restart API = semua device disconnect | Restart API tidak sentuh device connections |
| 1 crash = semua user down | Device worker crash tidak matikan API |
| Memory ceiling ±100 device / proses | 1 worker bisa handle ±500 device |

### Arsitektur target Phase 2

```
┌─────────────────────────────────────┐
│  NestJS API (Port 3009)             │
│  HTTP + Socket.IO + Queue producers │
│  TIDAK ada WASocket di sini         │
└──────────────┬──────────────────────┘
               │ BullMQ Jobs via Redis
               ↓
┌─────────────────────────────────────┐
│  Device Worker (Port 3099)          │  ← proses Node.js terpisah
│  WhatsAppSessionManager (semua sesi)│
│  MessagesProcessor (consumer)       │
│  DevicesProcessor (consumer)        │
│  Hanya queue consumers — no HTTP    │
└──────────────┬──────────────────────┘
               │
    Postgres + Redis + WhatsApp
```

Komunikasi API → Worker: **TIDAK perlu RPC**. Sudah ada via BullMQ:
- API enqueue `MESSAGE_SEND` job → worker consume dan kirim via `sessionManager.sendMessage()`
- API enqueue `DEVICE_PAIR_START` job → worker lakukan pairing
- Ini sudah jalan — yang perlu dilakukan adalah **memindahkan** `WhatsAppSessionManager`
  dan processor terkait ke entrypoint baru, bukan refactor besar.

### File kritis yang harus diubah

| File | Perubahan |
|---|---|
| `src/main.ts` | Baca env `WORKER_MODE=false` — jika false, skip load WhatsApp module |
| `src/worker.ts` | **BUAT BARU** — NestFactory.createApplicationContext, hanya load WorkerAppModule |
| `src/worker.module.ts` | **BUAT BARU** — import: DatabaseModule, QueueModule, WhatsAppModule, RealtimeModule |
| `src/app.module.ts` | Tambah kondisi: jika bukan worker mode, JANGAN import WhatsAppModule |
| `src/whatsapp/whatsapp.module.ts` | Tidak perlu diubah |
| `docker-compose.prod.yml` | Tambah service `worker` yang jalankan `node dist/src/worker.js` |
| `ecosystem.config.js` | Tidak perlu diubah (frontend saja) |
| `scripts/deploy.sh` | Tambah step start/restart worker container |
| `src/queue/processors/messages.processor.ts` | Pindah ke worker module (sudah consume job dengan benar) |
| `src/queue/processors/devices.processor.ts` | Pindah ke worker module |

### Langkah implementasi detail

**Step 1 — Buat `src/worker.ts` (entrypoint baru)**
```typescript
// src/worker.ts
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();
  console.log('[WATether Worker] Started');
}
bootstrap();
```

**Step 2 — Buat `src/worker.module.ts`**
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    QueueModule,        // processors (Messages, Devices, Broadcasts, AutoReplies, Scheduled, Webhooks)
    WhatsAppModule,     // WhatsAppSessionManager — sesi hidup di sini
    RealtimeModule,     // Socket.IO emitter (butuh untuk emit ke workspace)
    AuditLogsModule,    // dipakai oleh beberapa processors
  ],
})
export class WorkerModule {}
```

**Step 3 — Update `src/app.module.ts`**
Hapus `WhatsAppModule` dari AppModule. API tidak perlu tahu soal sessions.
`MessagesProcessor` dan `DevicesProcessor` juga dipindah ke WorkerModule.
AppModule hanya butuh:
- HTTP Controllers + Services
- QueueModule (hanya sebagai producer — `add()` jobs saja)
- RealtimeModule (Socket.IO gateway untuk frontend)

**Step 4 — Pisah QueueModule menjadi producer vs consumer**

Saat ini semua processor (consumer) terdaftar di QueueModule.
Setelah pemisahan:
- `src/queue/queue.module.ts` → hanya `BullModule.registerQueue(...)` + `QueueService` (producers)
- `src/queue/worker-queue.module.ts` → **BUAT BARU** — extend + register semua processors

**Step 5 — Update `docker-compose.prod.yml`**
```yaml
services:
  backend:
    # ... existing config, port 3009
    command: node dist/src/main.js

  worker:
    image: watether-backend:latest
    container_name: watether_worker
    restart: unless-stopped
    network_mode: host
    env_file: /opt/watether/.env.production
    environment:
      NODE_ENV: production
    command: node dist/src/worker.js
    logging:
      driver: json-file
      options: { max-size: "20m", max-file: "5" }
```

**Step 6 — Update Nginx** (opsional Phase 2, wajib Phase 3)
Tidak perlu diubah — worker tidak expose HTTP port.

**Step 7 — Build target di `tsconfig.json`**
Pastikan `src/worker.ts` di-include dalam compilation.
Tidak perlu tsconfig baru — sudah include `src/**/*.ts`.

### Verifikasi

```bash
# Local test (2 terminal)
npm run start:dev            # API di port 3009
npx ts-node src/worker.ts   # Worker (atau: npm run start:worker)

# Check worker log: harus muncul "Restoring X device sessions"
# Check API: GET /devices masih jalan, POST /messages/send masih enqueue

# E2E test ke VPS
npx jest --config jest.e2e.config.ts messages
npx jest --config jest.e2e.config.ts broadcasts
```

---

## Phase 3 — Shard Device Workers (SETELAH Phase 2 STABIL)

Satu worker proses bisa handle ±500 device. Untuk 40.000 device butuh ≥80 worker.
Solusi: **shard by `deviceId`** via consistent hashing.

### Desain sharding

```
Redis key: "device:{deviceId}:shard" = "worker-2"

Worker startup:
  1. Baca env SHARD_ID=2, TOTAL_SHARDS=4
  2. Load semua device WHERE id % TOTAL_SHARDS = SHARD_ID
  3. Claim di Redis: SET device:{id}:shard worker-2 EX 60 (heartbeat)

MessagesProcessor:
  1. Baca shard assignment dari Redis
  2. Jika job ini bukan untuk shard-ku → NACK (kembali ke queue)
  3. Jika shard-ku → proses
```

### File yang perlu dibuat / diubah (Phase 3)

| File | Perubahan |
|---|---|
| `src/worker.ts` | Baca `SHARD_ID`, `TOTAL_SHARDS` dari env |
| `src/whatsapp/whatsapp-session.manager.ts` | Filter device pada `onModuleInit` berdasarkan shard |
| `src/queue/processors/messages.processor.ts` | Skip job jika device tidak di shard ini |
| `docker-compose.prod.yml` | Scale worker: `worker-0`, `worker-1`, dst |
| Redis | Tambah shard registry keys |

---

## Phase 4 — Multi-VPS Horizontal Scale

Setelah Phase 3, scaling hanya soal tambah VPS + update `TOTAL_SHARDS`.

```
VPS-1: backend API + worker-0 + worker-1
VPS-2: worker-2 + worker-3
VPS-3: worker-4 + worker-5
...
```

Tidak ada code change signifikan — hanya infra / deployment config.

---

## State Sekarang (Sudah Commit & Push)

### Commit log terakhir (main)
```
5564c43 Scheduled messages feature + auto-reply webhook + misc improvements
e8520bb Anti-ban: startup stagger + per-device daily limit + failMessage helper
e7fd45b Fix queue concurrency + add broadcasts list + multi-recipient e2e
3ab7a4f Enable e2e tests against VPS with env-based credentials and device reuse
f305925 Add e2e tests for all feature menus + scheduled-messages unit tests
6d10436 Translate entire frontend to English
```

### Yang sudah jalan di production
- ✅ Full English frontend (page.tsx, console-app.tsx, semua legal pages)
- ✅ Scheduled messages (DAILY/WEEKLY/MONTHLY, `computeNextRunAt`, processor, UI)
- ✅ Auto-reply via webhook URL (dynamic reply dari external service)
- ✅ Broadcast `GET /broadcasts` endpoint + multi-recipient e2e test
- ✅ Per-device daily limit (Plan.dailyDeviceLimit = 200 default)
- ✅ Startup reconnect stagger (2s per device)
- ✅ Queue concurrency: messages=3, auto-replies=5, webhooks=10
- ✅ E2E tests (messages, broadcasts, auto-replies, contacts, scheduled-messages, webhooks)
- ✅ Unit tests: 83 tests passing

### Yang BELUM ada di production (perlu jalankan migration di VPS)
```bash
# Di VPS, jalankan:
docker exec watether_backend npx prisma db push
# Atau:
docker exec epondok-postgres psql -U epondok -d watether \
  -c "ALTER TABLE \"Plan\" ADD COLUMN IF NOT EXISTS \"dailyDeviceLimit\" INTEGER NOT NULL DEFAULT 200;"
```

---

## Info VPS Penting

```
SSH:              root@194.233.67.65
App dir:          /opt/watether
Backend:          docker container watether_backend, port 3009 (host mode)
Frontend:         pm2 watether-frontend x2, port 3010
DB container:     epondok-postgres, user: epondok, db: watether
Redis container:  epondok-redis, port 6379
Nginx config:     /etc/nginx/sites-available/watheter.conf (active)
Deploy script:    /opt/watether/scripts/deploy.sh

Account untuk test:
  email:       aseprahmanurhakim04@gmail.com
  workspace:   Dev Workspace (21118f7f-ba00-4a5e-a4b1-808c96e71a6f)
  device:      seed-device-02 (Test Device 2, CONNECTED)
  sender WA:   +6285795950115
  recipient 1: +6281223881545
  recipient 2: +6281373116740
```

---

## File Map Lengkap (Critical Paths)

```
f:\Projects\WATether\
├── src/
│   ├── main.ts                              ← API entrypoint (port 3009)
│   ├── app.module.ts                        ← Root module (perlu diubah Phase 2)
│   ├── whatsapp/
│   │   ├── whatsapp-session.manager.ts      ← ⚠️ BOTTLENECK — pindah ke worker
│   │   └── whatsapp-auth-store.ts           ← Prisma auth state adapter
│   ├── queue/
│   │   ├── queue.module.ts                  ← Register 6 queues
│   │   ├── queue.service.ts                 ← Queue accessor (producer)
│   │   ├── jobs/job-names.ts                ← Semua job name constants
│   │   └── processors/
│   │       ├── messages.processor.ts        ← concurrency=3, pindah ke worker
│   │       ├── broadcasts.processor.ts      ← anti-ban stagger, pindah ke worker
│   │       ├── auto-replies.processor.ts    ← concurrency=5, pindah ke worker
│   │       ├── webhooks.processor.ts        ← concurrency=10, tetap di worker
│   │       ├── devices.processor.ts         ← pairing/reconnect, pindah ke worker
│   │       └── scheduled-messages.processor.ts ← 60s tick, pindah ke worker
│   ├── realtime/realtime.gateway.ts         ← Socket.IO emitter (butuh di worker dan API)
│   ├── common/utils/
│   │   ├── schedule.ts                      ← computeNextRunAt()
│   │   ├── hmac.ts                          ← signHmac()
│   │   └── token.ts                         ← generatePlainToken(), hashToken()
│   └── [modules: auth, devices, messages, broadcasts, auto-replies,
│          contacts, webhooks, scheduled-messages, subscriptions,
│          workspaces, audit-logs, demo-requests, health]
├── prisma/
│   ├── schema.prisma                        ← Full DB schema
│   ├── seed.ts                              ← Seed data (plans, demo devices)
│   └── migrations/
│       └── 20260410000001_add_daily_device_limit/migration.sql
├── frontend/
│   ├── app/
│   │   ├── page.tsx                         ← Landing page (English, USD pricing)
│   │   ├── scheduled-messages/page.tsx      ← Scheduled messages UI
│   │   ├── faq/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── privacy-policy/page.tsx
│   │   └── refund-policy/page.tsx
│   └── components/
│       ├── console-app.tsx                  ← Main dashboard (ALL English)
│       └── demo-request-form.tsx
├── test/
│   ├── helpers/api.ts                       ← apiPost/Get/Delete/Patch + setupOrReuseTestUser
│   └── e2e/
│       ├── auth.e2e.ts
│       ├── devices.e2e.ts
│       ├── messages.e2e.ts
│       ├── broadcasts.e2e.ts
│       ├── auto-replies.e2e.ts
│       ├── contacts.e2e.ts
│       ├── webhooks.e2e.ts
│       └── scheduled-messages.e2e.ts
├── docker-compose.prod.yml                  ← Production backend container
├── nginx/watheter.conf                      ← Nginx SSL + routing config
├── scripts/
│   ├── deploy.sh                            ← Deploy script (build + restart)
│   └── setup-server.sh                      ← One-time VPS setup
├── jest.config.ts                           ← Unit test config
├── jest.e2e.config.ts                       ← E2E config (loads .env.e2e)
├── .env.e2e                                 ← VPS credentials (git-ignored)
└── .env.e2e.example                         ← Template untuk .env.e2e
```

---

## Pesan untuk Agent Berikutnya

Kamu melanjutkan development WATether. Semua commit sudah di-push ke `main`.

**Prioritas utama: implementasi Phase 2** — pisah `WhatsAppSessionManager` ke proses worker terpisah.

Ikuti langkah di section "Phase 2 — Dedicated Device Worker Process" di atas.
Jangan mulai Phase 3 sebelum Phase 2 di-test dan stabil di production.

Setelah Phase 2 selesai, jalankan e2e tests ke VPS:
```bash
npx jest --config jest.e2e.config.ts
```

Untuk deploy ke VPS setelah ada perubahan:
```bash
ssh root@194.233.67.65 "cd /opt/watether && bash scripts/deploy.sh"
```

Jangan push langsung — selalu commit dulu, minta approval user, baru push.
