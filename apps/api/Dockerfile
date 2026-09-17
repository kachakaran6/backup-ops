# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11 --activate

# Copy workspace manifest files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.base.json ./

# Build shared packages first, then API
RUN pnpm --filter @backup-ops/types build 2>/dev/null || true
RUN pnpm --filter @backup-ops/config build 2>/dev/null || true
RUN pnpm --filter backup-ops-api build

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11 --activate

# Copy built output and production deps
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production deps
RUN pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
