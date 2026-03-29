FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── deps: production modules only ────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

# ── builder: compile TypeScript ───────────────────────────────────────────────
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# ── runner: lean production image ─────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY prisma ./prisma
EXPOSE 3003
CMD ["sh", "-c", "npx prisma@5 migrate deploy && node dist/src/main.js"]
