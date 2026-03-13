# WATether

Ini fondasi produk WhatsApp gateway multi-tenant dengan dua muka yang sekarang sudah dipisah jelas:
- landing publik di root frontend untuk positioning, paket coba, dan CTA
- console operasional di route `/console` untuk auth, workspace, devices, messages, webhooks, broadcast, dan auto-reply

## Sudah ada
- Auth register/login/refresh skeleton
- JWT access + refresh flow dasar
- RBAC workspace member
- Frontend Next.js dengan landing publik berbahasa Indonesia
- Console Next.js untuk auth, workspace, devices, messages, webhooks, broadcast, auto-reply
- Devices module
- Messages module dengan enqueue ke BullMQ
- Broadcast module dasar
- Auto reply module dasar
- Webhook module + HMAC signing helper
- Audit log service
- Prisma schema cukup lengkap
- Dockerfile + docker-compose.dev
- Worker BullMQ untuk message, webhook, broadcast, auto-reply, dan device lifecycle stub
- Retry message gagal dari dashboard
- Webhook delivery log + test delivery dari dashboard

## Belum final
- Integrasi engine WhatsApp session asli
- Delivery callback dari provider/engine
- Full test suite
- S3/MinIO upload
- Admin super panel
- Payment gateway

## Cara jalan cepat
1. Copy `.env.example` jadi `.env`
2. `npm install`
3. `cd frontend && npm install`
4. `cd .. && npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npm run start:dev`
7. Terminal kedua: `npm run worker`
8. Terminal ketiga: `cd frontend && npm run dev`

Frontend default jalan di `http://localhost:3001` dan API di `http://localhost:3000`.

## Route frontend
- Landing publik: `http://localhost:3001/`
- Console overview: `http://localhost:3001/console`
- Module route lain: `/devices`, `/messages`, `/webhooks`, `/broadcasts`, `/auto-replies`

CTA di landing sekarang langsung bisa mengarahkan ke mode login atau register di console via query string seperti `?mode=register`.

## Docker dev
- `docker compose -f docker-compose.dev.yml up --build`
- Service yang jalan: `api`, `worker`, `frontend`, `postgres`, `redis`

## Catatan legal
Backend ini hanya fondasi aplikasi. Integrasi non-official WhatsApp Web tetap punya risiko pelanggaran ToS platform pihak ketiga.
