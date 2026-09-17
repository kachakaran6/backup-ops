# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY tsconfig.base.json ./

RUN pnpm --filter @backup-ops/types build 2>/dev/null || true
RUN pnpm --filter backup-ops-worker build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
