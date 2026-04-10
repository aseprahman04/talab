# WATether — Roadmap & Communication

> File ini adalah living document. Update checklist saat task selesai, tambah catatan di bagian Notes.
> Repo: `f:\Projects\WATether` · Branch: `main` · VPS: `root@194.233.67.65`

---

## Roadmap Checklist

### Phase 1 — Foundation ✅ DONE
- [x] Full English frontend (landing page, dashboard, legal pages)
- [x] Scheduled messages (DAILY/WEEKLY/MONTHLY) — UI + processor + `computeNextRunAt`
- [x] Auto-reply via webhook URL (dynamic reply dari external service)
- [x] Broadcast `GET /broadcasts` endpoint
- [x] Per-device daily limit (`Plan.dailyDeviceLimit = 200`) — anti-ban
- [x] Startup reconnect stagger (2s per device) — anti-ban
- [x] Queue concurrency: messages=3, auto-replies=5, webhooks=10
- [x] Unit tests: 83 passing
- [x] E2E tests against VPS (messages, broadcasts, auto-replies, contacts, scheduled-messages, webhooks)

### Phase 2 — Dedicated Device Worker Process ✅ DONE (deploy pending)
> **Target:** pisah `WhatsAppSessionManager` ke proses Node.js terpisah supaya restart API tidak disconnect semua device.

- [x] Buat `src/worker.ts` — entrypoint baru (`NestFactory.create` on port 3099)
- [x] Buat `src/worker.module.ts` — import PrismaModule, QueueModule, WorkerQueueModule, WhatsAppModule, RealtimeModule
- [x] Update `src/app.module.ts` — hapus WhatsAppModule (API tidak perlu WA sessions)
- [x] Buat `src/queue/worker-queue.module.ts` — register semua processors (consumers)
- [x] Update `src/queue/queue.module.ts` — hanya producers + BullModule.registerQueue
- [x] Update `docker-compose.prod.yml` — tambah service `worker` (`node dist/src/worker.js`)
- [x] Fix `@Processor` concurrency syntax — `@Processor('queue', { concurrency: N })` (was object-form, TypeScript rejected it)
- [x] Run `prisma generate` — regenerate client setelah tambah `dailyDeviceLimit` column
- [x] Build clean + 83 unit tests passing
- [ ] **TODO: Deploy ke VPS** — `ssh root@194.233.67.65 "cd /opt/watether && bash scripts/deploy.sh"`
- [ ] **TODO: Run DB migration di VPS** — lihat seksi "Pending VPS Tasks"
- [ ] **TODO: E2E test setelah deploy** — `npx jest --config jest.e2e.config.ts`

**Catatan Real-Time:** Worker punya Socket.IO server di port 3099 tapi frontend clients connect ke API port 3009.
Worker emits (device status, message.sent) tidak reach frontend clients sampai `@socket.io/redis-adapter` dipasang.
Frontend masih bisa poll status via REST. Ini trade-off disengaja untuk Phase 2 — Phase 2.5 fix ini.

### Phase 2.5 — Socket.IO Redis Adapter (real-time dari worker ke frontend) 📋 PLANNED
> Worker emits sekarang no-op karena frontend clients connect ke API's Socket.IO, bukan worker's.

- [ ] `npm install @socket.io/redis-adapter` (di backend)
- [ ] Konfigurasi adapter di `main.ts` dan `worker.ts`:
  ```typescript
  import { createAdapter } from '@socket.io/redis-adapter';
  import { createClient } from 'redis';
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  app.getHttpAdapter().getInstance().adapter(createAdapter(pubClient, subClient));
  ```
- [ ] Test: trigger message send dari worker → status update muncul di frontend tanpa refresh

### Phase 3 — Shard Device Workers 📋 PLANNED
> Satu worker ~500 device. 40.000 device = ~80 worker shards.

- [ ] Worker baca env `SHARD_ID`, `TOTAL_SHARDS`
- [ ] `WhatsAppSessionManager.onModuleInit` filter device by shard (`deviceId % TOTAL_SHARDS === SHARD_ID`)
- [ ] `MessagesProcessor` skip job jika device bukan di shard ini
- [ ] Redis shard registry: `SET device:{id}:shard worker-N EX 60` (heartbeat)
- [ ] `docker-compose.prod.yml` scale: `worker-0`, `worker-1`, dst

### Phase 4 — Multi-VPS Horizontal Scale 📋 PLANNED
- [ ] Tambah VPS, update `TOTAL_SHARDS` di env
- [ ] Load balancer (Nginx / Cloudflare) di depan API nodes
- [ ] Shared Redis + Postgres tetap single source of truth

---

## Pending VPS Tasks

```bash
# Jalankan migration dailyDeviceLimit (belum ada di production):
docker exec epondok-postgres psql -U epondok -d watether \
  -c "ALTER TABLE \"Plan\" ADD COLUMN IF NOT EXISTS \"dailyDeviceLimit\" INTEGER NOT NULL DEFAULT 200;"
```

---

## Arsitektur Phase 2 (Target)

```
┌─────────────────────────────────────┐
│  NestJS API (Port 3009)             │
│  HTTP + Socket.IO + Queue producers │
│  TIDAK ada WASocket di sini         │
└──────────────┬──────────────────────┘
               │ BullMQ Jobs via Redis
               ↓
┌─────────────────────────────────────┐
│  Device Worker                      │  ← proses Node.js terpisah
│  WhatsAppSessionManager (semua sesi)│
│  Semua queue processors (consumers) │
└──────────────┬──────────────────────┘
               │
    Postgres + Redis + WhatsApp
```

**Kenapa tidak perlu RPC:** Komunikasi API→Worker sudah lewat BullMQ.
API enqueue job → Worker consume dan eksekusi. Tidak ada perubahan arsitektural besar,
hanya pindah entrypoint.

### File yang diubah (Phase 2)

| File | Aksi |
|---|---|
| `src/worker.ts` | BUAT BARU — entrypoint worker |
| `src/worker.module.ts` | BUAT BARU — WorkerModule |
| `src/queue/worker-queue.module.ts` | BUAT BARU — register semua processors |
| `src/app.module.ts` | EDIT — hapus WhatsAppModule |
| `src/queue/queue.module.ts` | EDIT — hapus processor registrations |
| `docker-compose.prod.yml` | EDIT — tambah service worker |
| `scripts/deploy.sh` | EDIT — restart worker |

---

## Info VPS

```
SSH:              root@194.233.67.65
App dir:          /opt/watether
Backend:          docker container watether_backend, port 3009 (host mode)
Frontend:         pm2 watether-frontend x2, port 3010
DB container:     epondok-postgres, user: epondok, db: watether
Redis container:  epondok-redis, port 6379
Nginx config:     /etc/nginx/sites-available/watheter.conf
Deploy script:    /opt/watether/scripts/deploy.sh
```

### Test Accounts
```
Email:        aseprahmanurhakim04@gmail.com
Workspace ID: 21118f7f-ba00-4a5e-a4b1-808c96e71a6f
Device ID:    seed-device-02 (Test Device 2, CONNECTED)
Sender WA:    +6285795950115
Recipient 1:  +6281223881545
Recipient 2:  +6281373116740
```

---

## File Map (Critical Paths)

```
src/
├── main.ts                                ← API entrypoint (port 3009)
├── app.module.ts                          ← Root module — edit Phase 2
├── worker.ts                              ← [Phase 2] NEW worker entrypoint
├── worker.module.ts                       ← [Phase 2] NEW WorkerModule
├── whatsapp/
│   ├── whatsapp-session.manager.ts        ← BOTTLENECK — dipindah ke worker
│   └── whatsapp-auth-store.ts
├── queue/
│   ├── queue.module.ts                    ← Hanya producers setelah Phase 2
│   ├── queue.service.ts                   ← Queue accessor
│   ├── worker-queue.module.ts             ← [Phase 2] NEW consumers module
│   ├── jobs/job-names.ts
│   └── processors/
│       ├── messages.processor.ts          ← concurrency=3
│       ├── broadcasts.processor.ts        ← anti-ban stagger
│       ├── auto-replies.processor.ts      ← concurrency=5
│       ├── webhooks.processor.ts          ← concurrency=10
│       ├── devices.processor.ts           ← pairing/reconnect
│       └── scheduled-messages.processor.ts ← 60s tick
├── realtime/realtime.gateway.ts           ← Socket.IO (butuh di API dan worker)
└── common/utils/
    ├── schedule.ts                        ← computeNextRunAt()
    ├── hmac.ts
    └── token.ts
```

---

## Notes

<!-- Tambah catatan, keputusan, atau temuan di sini -->

- 2026-04-10: Phase 1 selesai, semua commit pushed ke main. Phase 2 siap dimulai.
- 2026-04-10: Phase 2 selesai secara lokal (build clean, 83 tests pass). Belum di-deploy ke VPS.
  - `src/worker.ts` + `src/worker.module.ts` + `src/queue/worker-queue.module.ts` dibuat
  - `AppModule` tidak lagi import `WhatsAppModule`
  - `QueueModule` tidak lagi register processors (hanya producers)
  - `docker-compose.prod.yml` sudah punya service `worker` (port 3099, sleep 15s lalu start)
  - Real-time dari worker ke frontend belum jalan (perlu Redis adapter — Phase 2.5)
- Jangan push langsung ke main — commit dulu, minta approval user, baru push.
