# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY . .
ENV NODE_ENV=development

RUN pnpm install --no-frozen-lockfile --prod=false

RUN pnpm --filter @backup-ops/types build
RUN pnpm --filter @backup-ops/config build
RUN pnpm --filter backup-ops-api build

RUN pnpm --filter backup-ops-api deploy --legacy --prod /prod/api

# ---- Production stage ----
FROM node:22-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /prod/api ./
COPY --from=builder /app/apps/api/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Extended start_period to allow NestJS + TypeORM schema sync before health checks begin
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=5 \
  CMD curl -sf http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
