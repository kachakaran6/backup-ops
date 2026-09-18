# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY . .
ENV NODE_ENV=development

RUN pnpm install --no-frozen-lockfile --prod=false

WORKDIR /app/apps/web
RUN pnpm run build

# ---- Production stage — serve with nginx ----
FROM nginx:1.27-alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/backupops.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
