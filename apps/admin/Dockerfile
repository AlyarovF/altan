# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# ALTAN admin SPA (Vite build) — served as static files behind nginx.
# nginx does SPA fallback + same-origin reverse proxy for /api and /media -> api
# (mirrors serve-admin.mjs, so no CORS). Build context = monorepo ROOT.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:${PATH}"
RUN corepack enable

# --- Stage 1: prune ----------------------------------------------------------
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2.9.18
COPY . .
RUN turbo prune @altan/admin --docker --skip-infer

# --- Stage 2: install + build the static bundle -----------------------------
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ ./
# turbo prune does not carry root tsconfig; every package extends it.
COPY tsconfig.base.json ./tsconfig.base.json
# Relative API base -> browser calls stay same-origin; nginx proxies to the api.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm turbo run build --filter=@altan/admin

# --- Stage 3: nginx static server -------------------------------------------
FROM nginx:1.27-alpine AS runner
# SPA fallback + /api and /media reverse proxy to the api service.
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=installer /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
