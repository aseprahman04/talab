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
- [ ] **TODO: Verify single-worker deploy** — kirim test message, cek device masih connected
- [ ] **TODO: E2E test setelah deploy** — `npx jest --config jest.e2e.config.ts`
- [ ] **TODO (setelah stable):** Enable 4 shards di `docker-compose.prod.yml` (uncomment worker-1..3, ubah TOTAL_SHARDS=4)

**Deploy strategy (aman):**
1. Deploy dengan `TOTAL_SHARDS=1` (1 worker, config saat ini) — verifikasi Phase 2 + 2.5 jalan
2. Setelah stable: uncomment worker-1..3, ubah TOTAL_SHARDS ke 4 → enable sharding
3. Monitor log tiap worker: `docker logs -f watether_worker_0`

### Phase 2.5 — Socket.IO Redis Adapter ✅ DONE
> Worker emits (message.sent, device.status.updated) sekarang reach frontend clients via Redis pub/sub.

- [x] `npm install @socket.io/redis-adapter`
- [x] `src/realtime/redis-io.adapter.ts` — custom IoAdapter using ioredis
- [x] `src/main.ts` — API uses `RedisIoAdapter` (wires pub/sub on startup)
- [x] `src/worker.ts` — Worker uses `RedisIoAdapter` (emits cross-process to API clients)

### Phase 3 — Shard Device Workers ✅ DONE
> 4 shards × ~500 devices = 2 000 concurrent WA sessions on one VPS.

- [x] `src/common/utils/shard.ts` — `shardForDevice(deviceId, totalShards)` — djb2 hash, works for UUID + string IDs
- [x] `WhatsAppSessionManager.onModuleInit` — only restores devices for this shard
- [x] `MessagesProcessor` — shard guard: `job.moveToDelayed(+300ms)` if wrong shard
- [x] `DevicesProcessor` — shard guard: `job.moveToDelayed(+300ms)` if wrong shard
- [x] `ScheduledMessagesProcessor` — per-shard tick jobId + shard filter on query
- [x] `docker-compose.prod.yml` — 4 worker shards (worker-0..3, ports 3100-3103, `TOTAL_SHARDS=4`)
- [x] Default: `TOTAL_SHARDS=1` → single-worker mode, no sharding overhead

### Phase 4 — Multi-VPS Horizontal Scale ✅ DONE (config ready)
> Scale beyond 1 VPS by running more worker shards on additional machines.

- [x] `docker-compose.scale.yml` — template for VPS-2, VPS-3, etc. (worker-only nodes)
- [x] Pattern: increase `TOTAL_SHARDS`, assign each VPS a block of `SHARD_ID` values
- [ ] **TODO (when needed):** set up load balancer (Nginx / Cloudflare) in front of API nodes
- [ ] **TODO (when needed):** run `docker-compose.scale.yml` on additional VPS nodes

**Capacity reference:**

| Shards | Workers | Devices | VPS needed |
|--------|---------|---------|------------|
| 1 | 1 | ~500 | 1 |
| 4 | 4 | ~2 000 | 1 |
| 8 | 8 | ~4 000 | 1–2 |
| 40 | 40 | ~20 000 | 4–5 |
| 80 | 80 | ~40 000 | 8–10 |

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
- 2026-04-10: **Deploy fix:** Redis adapter sekarang punya fallback (tidak crash jika Redis lambat). `docker-compose.prod.yml` mulai dengan `TOTAL_SHARDS=1` — 1 worker dulu, aman untuk initial deploy. Worker-1..3 di-comment, aktifkan setelah verify Phase 2 stabil.
- 2026-04-10: **Phase 2 + 2.5 + 3 + 4 selesai & pushed ke `origin/main`** (build clean, 83 tests pass).
  - Commit `6ca5a56` — Phase 2: worker process split (`src/worker.ts`, `WorkerModule`, `WorkerQueueModule`)
  - Commit `9a69245` — Phase 2.5 Redis adapter + Phase 3 sharding + Phase 4 multi-VPS config
  - **Belum di-deploy ke VPS** — lihat seksi "Pending VPS Tasks"
  - Real-time cross-process sudah jalan via `RedisIoAdapter` (ioredis pub/sub)
  - 4 worker shards siap di `docker-compose.prod.yml` (TOTAL_SHARDS=4, ports 3100-3103)
  - `docker-compose.scale.yml` tersedia untuk VPS tambahan
- Jangan push langsung ke main — commit dulu, minta approval user, baru push.
