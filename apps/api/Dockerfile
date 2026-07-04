# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# ALTAN API (NestJS + Prisma) — production image.
# Turborepo Docker pattern: `turbo prune` -> minimal context -> install -> build.
# Migrations are NOT run in the image; deploy.sh runs `prisma migrate deploy`
# as a one-off container against the live DB (see deploy.sh / DEPLOY.md).
# Build context = monorepo ROOT (prune needs the whole workspace).
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS base
# OpenSSL + CA certs are required by the Prisma query engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:${PATH}"
RUN corepack enable

# --- Stage 1: prune the monorepo down to @altan/api + its workspace deps -----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@2.9.18
COPY . .
RUN turbo prune @altan/api --docker --skip-infer

# --- Stage 2: install deps + build ------------------------------------------
FROM base AS installer
WORKDIR /app
# Install dependencies first (better layer caching): lockfile + package.json only.
COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile
# Bring in the full source and build (runs `prisma generate && nest build`).
COPY --from=pruner /app/out/full/ ./
# turbo prune does not carry root tsconfig; every package extends it.
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo run build --filter=@altan/api

# --- Stage 3: runtime -------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Non-root runtime user; /data/media is the mounted upload volume (MEDIA_DIR).
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nodejs \
  && mkdir -p /data/media \
  && chown -R nodejs:nodejs /data
# Ship the pruned workspace as-is: dist + generated Prisma client + engines +
# the prisma CLI & schema (needed for `migrate deploy` / `db seed` at deploy time)
# + the seed source. Already minimized to @altan/api + @altan/shared by prune.
COPY --from=installer --chown=nodejs:nodejs /app /app
USER nodejs
EXPOSE 3001
# Container-native healthcheck (no curl in slim image; Node 20 has global fetch).
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/main.js"]
