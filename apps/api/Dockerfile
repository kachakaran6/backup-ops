# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.base.json ./

RUN pnpm --filter @backup-ops/types build 2>/dev/null || true
RUN pnpm --filter @backup-ops/config build 2>/dev/null || true
RUN pnpm --filter backup-ops-api build

RUN pnpm --filter backup-ops-api deploy --legacy --prod /prod/api

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /prod/api ./
COPY --from=builder /app/apps/api/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
