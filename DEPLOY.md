# ALTAN — Deployment & Operations Runbook

Production deployment for **the owner's self-managed Linux server** using Docker. No Vercel.
One command — `./deploy.sh` — builds the images, runs DB migrations, and brings the whole
stack up behind a single nginx reverse proxy.

```
                          ┌────────────────────────────────────────────┐
   Internet  ──:80/:443── │  edge (nginx)  — single public entry point   │
                          │   example.com        → web (Next.js :3000)   │
                          │   example.com/api,/media → api (:3001)       │
                          │   admin.example.com  → admin (nginx SPA)     │
                          └───────┬───────────────┬───────────┬─────────┘
                          (private "internal" bridge network, no host ports)
                            ┌─────▼─────┐   ┌──────▼─────┐   ┌─▼──────────┐
                            │ api       │   │ web        │   │ admin      │
                            │ NestJS    │   │ Next.js    │   │ static SPA │
                            └──┬─────┬──┘   └────────────┘   └────────────┘
                        ┌──────▼─┐ ┌─▼────────┐
                        │postgres│ │ redis    │   volumes: pg_data, redis_data, media_data
                        └────────┘ └──────────┘
```

- **Only the edge exposes host ports** (`EDGE_HTTP_PORT`, default 80). Postgres, Redis, and
  the app containers are reachable only on the private Docker network.
- **Same-origin, no CORS**: the browser calls `/api` and `/media`; the edge (and each app's
  own proxy) forwards them to `api`. Baked `NEXT_PUBLIC_API_BASE_URL` / `VITE_API_BASE_URL`
  are the relative path `/api/v1`.
- **Data persists** in named volumes: `pg_data`, `redis_data`, `media_data` (uploads).

---

## 1. Prerequisites (on the server)

- Linux x86_64 with **Docker Engine** and the **Compose** plugin (`docker compose` v2) or the
  legacy `docker-compose` v1 binary. `deploy.sh` auto-detects which is present.
- Ports **80** (and **443** if you terminate TLS at the edge) free on the host.
- DNS **A records** pointing at the server's public IP:
  - `example.com` (and `www` if desired) → public site
  - `admin.example.com` → admin dashboard
- The repository checked out on the server (or your CI copies it there).

---

## 2. First-time deploy

```bash
# 1. Configure secrets (NEVER commit this file — it is gitignored)
cp .env.production.example .env.production
${EDITOR:-nano} .env.production          # set DOMAIN, ADMIN_HOST, DB password,
                                         # JWT secrets, admin bootstrap creds…

# Generate strong secrets:
openssl rand -base64 48                  # JWT_ACCESS_SECRET
openssl rand -base64 48                  # JWT_REFRESH_SECRET (different!)

# 2. Deploy + seed the database (seed ONCE, on the first deploy)
./deploy.sh --seed
```

`deploy.sh` refuses to run while any `CHANGE_ME` placeholders remain in `.env.production`.

When it finishes, the health check is green and it prints the site/admin/API URLs.
**Log in to the admin dashboard and change the bootstrap admin password immediately.**

---

## 3. Updates / redeploys

Pull the new code, then re-run — the script is idempotent and re-runnable:

```bash
git pull
./deploy.sh                 # rebuild changed images, apply new migrations, roll the stack
```

Useful flags:

| Flag              | Effect                                                                |
| ----------------- | --------------------------------------------------------------------- |
| `--seed`          | Seed the DB (first deploy only; the seed is idempotent/upsert-based). |
| `--no-build`      | Skip image builds (config/env-only change).                           |
| `--pull`          | Pull newer base images (postgres/redis/nginx).                        |
| `--down`          | Stop the stack (data volumes are **kept**).                           |
| `--env-file PATH` | Use a different env file (default `.env.production`).                 |

What a run does, in order: verify Docker → validate compose → build images → start
`postgres`+`redis` and wait until healthy → **`prisma migrate deploy`** (one-off container) →
optional seed → `docker compose up -d` → wait for `/api/v1/health` → print status + URLs.
It fails loudly (`set -euo pipefail`) on any step.

---

## 4. Rollback

Migrations run **before** the new app containers take traffic, so a failed migration aborts
the deploy before it can break the running version.

To roll application code back:

```bash
git checkout <previous-good-tag>
./deploy.sh
```

> Note: Prisma migrations are forward-only. If a release included a destructive migration,
> roll back by **restoring the pre-deploy database backup** (below) and then redeploying the
> previous image tag. Always take a backup before a release with schema changes.

To stop everything without deleting data: `./deploy.sh --down`.

---

## 5. Database backups & restore

Backups run against the `postgres` container. Replace `altan` with your `COMPOSE_PROJECT_NAME`.

**Backup (compressed custom format):**

```bash
docker compose -p altan -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U altan -d altan -Fc > "altan-$(date +%F-%H%M).dump"
```

**Automate it** — add to `crontab -e` (daily at 02:30, keep 14 days):

```
30 2 * * * cd /path/to/altan && docker compose -p altan -f docker-compose.prod.yml exec -T postgres pg_dump -U altan -d altan -Fc > backups/altan-$(date +\%F).dump && find backups -name 'altan-*.dump' -mtime +14 -delete
```

**Restore:**

```bash
# copy the dump into the container, then restore (drops & recreates objects)
docker compose -p altan -f docker-compose.prod.yml cp altan-YYYY-MM-DD.dump postgres:/tmp/r.dump
docker compose -p altan -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U altan -d altan --clean --if-exists /tmp/r.dump
```

Uploaded media lives in the `media_data` volume — back it up too:

```bash
docker run --rm -v altan_media_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/media-$(date +%F).tgz -C /data .
```

---

## 6. TLS / HTTPS

The edge listens on HTTP (`:80`) by default. Two supported options:

**A) certbot (Let's Encrypt) on the host** — terminate TLS in a host nginx/Traefik in front
of the edge, or issue certs and mount them into the edge. To terminate at the edge:

1. Issue certs: `certbot certonly --standalone -d example.com -d admin.example.com`.
2. Uncomment the `443` port and the `certs` volume in `docker-compose.prod.yml`, mount
   `/etc/letsencrypt` into `deploy/edge/certs`, and add `listen 443 ssl;` + `ssl_certificate`
   directives to `deploy/edge/nginx.conf.template` (both server blocks). Redeploy.
3. Renewal: `certbot renew` on cron, then `docker compose ... restart edge`.

**B) Caddy in front (simplest)** — run a Caddy container that auto-provisions certs and
`reverse_proxy` to the `edge` (or directly to `web`/`admin`/`api`). Caddy handles ACME with
zero config beyond the domain names. Recommended if you don't already run nginx/TLS on the host.

Either way, set `PUBLIC_SITE_URL=https://…` and the `*_ORIGIN` vars to the `https` origins.

---

## 7. Logs & observability

```bash
docker compose -p altan -f docker-compose.prod.yml logs -f api      # structured JSON (pino)
docker compose -p altan -f docker-compose.prod.yml logs -f web edge
docker compose -p altan -f docker-compose.prod.yml ps               # health status
```

- The API logs are structured JSON with request IDs (nestjs-pino), with secrets/PII redacted.
- **Health**: `GET /api/v1/health` returns `200` only when Postgres **and** Redis are up.
  Point an uptime monitor at `https://example.com/api/v1/health` and at the public homepage +
  `sitemap.xml` (the site is the storefront — watch for 5xx).
- **Error tracking (Sentry)** and log shipping are wired at the infra layer of your choosing;
  set the DSN via env when you adopt it. Health + container `restart: unless-stopped` provide
  the baseline self-healing.

---

## 8. Wiring a real SMTP provider (owner-provided mail)

By design the API's `MailerService` ships as a **log adapter**: new-RFQ sales alerts and buyer
acknowledgements are written to the structured logs, **not emailed**, until you provide mail.

To send real email:

1. Fill in the SMTP block in `.env.production` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASSWORD`, `SMTP_FROM`, `SALES_ALERT_EMAIL`). These are already passed through to the
   `api` container by `docker-compose.prod.yml`.
2. Implement an SMTP adapter (e.g. with `nodemailer`) that extends the existing
   `MailerService` abstract class in `apps/api/src/quotes/mailer/mailer.service.ts`, and swap
   the `useClass` binding in `apps/api/src/quotes/quotes.module.ts` from `LogMailerService` to
   it (guarded by "SMTP configured?" so it falls back to the log adapter when unset).
3. Redeploy: `./deploy.sh`.

No application code depends on a vendor SDK — only on the `MailerService` port — so this is an
isolated change.

---

## 9. Secrets & security notes

- `.env.production` is **gitignored**; only `.env.production.example` is committed. Never
  commit real secrets. Rotate JWT secrets / DB password by editing `.env.production` and
  redeploying (`./deploy.sh`); rotating JWT secrets invalidates existing sessions.
- Postgres/Redis have **no host ports** — they are only reachable on the private network.
- `helmet`, a CORS allow-list, and `@nestjs/throttler` rate limiting are enabled in the API.
- Run the stack as a non-root user where possible; the api/web images already run as a
  non-root user inside the container.
