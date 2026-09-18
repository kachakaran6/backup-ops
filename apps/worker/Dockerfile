# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY . .
ENV NODE_ENV=development

RUN pnpm install --no-frozen-lockfile --prod=false

RUN pnpm --filter @backup-ops/types build
RUN pnpm --filter @backup-ops/config build
RUN pnpm --filter backup-ops-worker build

RUN pnpm --filter backup-ops-worker deploy --legacy --prod /prod/worker

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /prod/worker ./
COPY --from=builder /app/apps/worker/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
