# WATether Backend Boilerplate

Ini fondasi backend yang jauh lebih lengkap untuk platform WhatsApp gateway multi-tenant.

## Sudah ada
- Auth register/login/refresh skeleton
- JWT access + refresh flow dasar
- RBAC workspace member
- Devices module
- Messages module dengan enqueue ke BullMQ
- Broadcast module dasar
- Auto reply module dasar
- Webhook module + HMAC signing helper
- Audit log service
- Prisma schema cukup lengkap
- Dockerfile + docker-compose.dev
- Worker BullMQ untuk message, webhook, broadcast, auto-reply

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
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `npm run start:dev`
6. Terminal kedua: `npm run worker`

## Catatan legal
Backend ini hanya fondasi aplikasi. Integrasi non-official WhatsApp Web tetap punya risiko pelanggaran ToS platform pihak ketiga.
