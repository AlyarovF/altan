# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# ALTAN public site (Next.js 14, output: 'standalone') — production image.
# Turborepo Docker pattern. Only PUBLIC (NEXT_PUBLIC_*) values are baked at
# build time; server-side runtime config (API_INTERNAL_BASE_URL) stays runtime.
# Build context = monorepo ROOT.
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
RUN turbo prune @altan/web --docker --skip-infer

# --- Stage 2: install + build ------------------------------------------------
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ ./
# turbo prune does not carry root tsconfig; every package extends it.
COPY tsconfig.base.json ./tsconfig.base.json
# Public build-time config (inlined into the client bundle). Relative API base
# keeps browser calls same-origin (edge proxies /api + /media -> api).
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=@altan/web

# --- Stage 3: runtime (minimal standalone server) ---------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
# Standalone output already contains a trimmed node_modules + traced files.
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
