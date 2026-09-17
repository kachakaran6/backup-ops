# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY tsconfig.base.json ./

RUN pnpm --filter @backup-ops/types build 2>/dev/null || true
RUN pnpm --filter @backup-ops/config build 2>/dev/null || true
RUN pnpm --filter backup-ops-worker build

RUN pnpm --filter backup-ops-worker deploy --legacy --prod /prod/worker

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /prod/worker ./
COPY --from=builder /app/apps/worker/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
