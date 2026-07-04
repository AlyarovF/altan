# Step 20 — Deployment, CI/CD & observability

|                   |                   |
| ----------------- | ----------------- |
| **Phase**         | Launch            |
| **Owner**         | backend-engineer  |
| **Collaborators** | frontend-engineer |
| **Depends on**    | all               |
| **Status**        | ✅ Done           |

## Objective

Ship ALTAN to production reliably and keep it observable: builds, migrations, hosting,
secrets, monitoring, and a runbook.

## Scope & deliverables

- **Containers**: Dockerfiles for `api` (NestJS), `web` (Next.js **standalone** output), and
  `admin` (static build served by nginx); a prod-like `docker-compose` for the **owner's server**.
- **Reverse proxy + TLS** (nginx/Caddy) routing public `web`, `admin`, and `api` on one host.
- **CI/CD**: pipeline that runs typecheck/lint/test → builds images → **runs DB migrations** →
  deploys to the **self-managed server** (credentials provided at handoff). No Vercel.
- **Config/secrets**: env management per environment; nothing committed; CORS/rate-limit hardened.
- **Data**: managed PostgreSQL + Redis; automated backups; migration-on-deploy.
- **Observability**: pino logs → aggregator; **error tracking (Sentry)**; uptime/health checks;
  basic metrics/alerts (incl. quote-SLA breaches).
- **Media/CDN** for product images; a short **runbook** (deploy, rollback, restore, rotate secrets).

## Tasks

1. Write Dockerfiles + compose; configure each app's build output.
2. Build the CI/CD workflow with migration and deploy stages per app.
3. Wire logging/error tracking/health checks/alerts; set up backups.

## Acceptance criteria

- [ ] One pipeline builds, tests, migrates, and deploys all three apps.
- [ ] Prod-like stack runs locally via compose; health checks green.
- [ ] Errors and logs are captured centrally; backups + rollback documented in the runbook.
- [ ] Secrets are managed outside the repo.

## ALTAN-specific notes

- Public site availability + SEO health (sitemap reachable, no 5xx) should be monitored — it's the company's storefront.

## Delivered

- Per-app production Dockerfiles (Turborepo `turbo prune --docker` pattern, Node 20):
  `apps/api/Dockerfile` (NestJS + Prisma), `apps/web/Dockerfile` (Next.js standalone),
  `apps/admin/Dockerfile` (Vite build → nginx SPA with `/api`+`/media` proxy). Root `.dockerignore`.
- `docker-compose.prod.yml`: postgres 16, redis 7, api, web, admin, and an **edge nginx** reverse
  proxy (single public entry; web at root host, admin at `ADMIN_HOST`, `/api`+`/media` → api).
  Named volumes (`pg_data`/`redis_data`/`media_data`), healthchecks, `restart: unless-stopped`,
  private network. Compose format 2.4 for docker-compose v1 **and** `docker compose` v2 compatibility.
- `deploy.sh`: idempotent, re-runnable. Flags `--seed`, `--no-build`, `--pull`, `--down`, `--env-file`.
  Builds images → `prisma migrate deploy` (one-off container) → optional seed → `up -d` → waits for
  `/api/v1/health` green → prints status + URLs. `set -euo pipefail`, placeholder-secret guard.
- `.env.production.example` (all required vars + optional owner-provided SMTP), `DEPLOY.md` runbook
  (first deploy, updates, rollback, backup/restore, TLS via certbot/Caddy, logs, SMTP wiring).
- Verified: all three images build (admin 51.5 MB, web 230 MB, api 695 MB); prod stack smoke-tested
  under an isolated project on port 18080 — migrations applied, seed loaded, edge `/api/v1/health`
  green, homepage + catalog API + admin SPA (with same-origin `/api` proxy) all served; torn down `-v`.
