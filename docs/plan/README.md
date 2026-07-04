# ALTAN Rebuild — Master Build Plan

Rebuild of **ALTAN Trading House** ("Where Critical Materials Meet Markets.") from a static
multi-page prototype (`index.html`, `catalog.html`, `admin.html`, `app.js`,
`products-data.js`, `data-i18n` attributes) into a **dynamic, API-driven system**:

1. **Public user panel** (`apps/web`) — Next.js, SSR/ISR, EN/RU/UZ, SEO-friendly.
2. **Admin dashboard** (`apps/admin`) — Vite + React + AntD, makes _all content dynamic_.
3. **Backend** (`apps/api`) — Node.js / NestJS + PostgreSQL.

> Read this file first, then execute the numbered steps in order. Each step lives in its own
> file (`NN-*.md`) with objective, tasks, and acceptance criteria. Update the **Status** field
> in each step and the tracker below as you go. See `../../CLAUDE.md` for stack & domain context.

---

## Goal: make _everything_ dynamic + admin-editable

Today every value lives in HTML/JS. After this rebuild, each of these is stored in the DB,
served by the API, cached on the public site, and editable in the admin dashboard:

| Static today                                                                               | Becomes (DB entity)                                                      | Admin can edit      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------- |
| 26+ products in `products-data.js`                                                         | `Product` (+ specs, badges, HS code, grade, standard, origin, min order) | ✅ full CRUD        |
| Categories (Metals & Alloys, Carbide Tooling, Technical Ceramics, Instruments & Equipment) | `Category`                                                               | ✅                  |
| Supply regions (ca, eu, … 4 total)                                                         | `Region`                                                                 | ✅                  |
| `featured: true` flag                                                                      | `Product.featured`                                                       | ✅ toggle           |
| Badges 🔥 Hot / ✨ NEW                                                                     | `Badge` / `ProductBadge`                                                 | ✅                  |
| 3 market-intelligence articles                                                             | `NewsArticle` (price, change, outlook)                                   | ✅ CRUD             |
| "How ALTAN Works" 4 steps + icons                                                          | `ProcessStep`                                                            | ✅                  |
| Stats bars (26+ lines, 4 regions, 12h, ISO 9001, 40+ suppliers, 30+ countries)             | `SiteStat`                                                               | ✅                  |
| Company name, tagline, tag, trust badges (ISO 9001:2015 · EXW/CIF/FOB/DDP · 12h · global)  | `SiteContent`                                                            | ✅                  |
| Quote modal submissions                                                                    | `QuoteRequest`                                                           | ✅ manage + respond |
| EN / RU / UZ i18n object in `app.js`                                                       | `Translation` (key + locale)                                             | ✅ inline editor    |

**Principle:** no user-facing string, number, or product is hard-coded. If the homepage
shows it, an admin can change it without a deploy.

---

## Architecture

```
                 ┌─────────────────────────┐
   Buyers  ───▶  │  apps/web (Next.js)      │  SSR/ISR, EN/RU/UZ, SEO
                 │  public user panel       │
                 └───────────┬─────────────-┘
                             │  HTTPS / typed client (generated from OpenAPI)
                 ┌───────────▼─────────────┐        ┌──────────────┐
   Staff   ───▶  │  apps/api (NestJS)       │◀──────▶│ PostgreSQL    │
                 │  REST API + OpenAPI      │        │ Redis (cache/ │
                 │  auth, RBAC, jobs        │        │ queues)       │
                 └───────────▲─────────────┘        └──────────────┘
                             │  typed client
                 ┌───────────┴─────────────┐
   Admins  ───▶  │  apps/admin (Vite+React) │  SPA, AntD, behind login
                 │  admin dashboard         │
                 └─────────────────────────┘

   packages/shared : TS types, enums (Category, Region, Incoterm, Badge, QuoteStatus,
                     Locale, Outlook), zod schemas, generated API client — used by all.
```

**Contract-first:** the backend's OpenAPI spec is the single source of truth; both frontends
consume a generated, typed client. Shared enums live in `packages/shared`.

---

## Core data model (overview — full schema in step 02)

`Product` · `Category` · `Region` · `ProductSpec` · `Badge`/`ProductBadge` · `NewsArticle` ·
`ProcessStep` · `SiteStat` · `SiteContent` · `Translation` · `QuoteRequest`(+`QuoteItem`) ·
`User`(admin/staff) · `Role` · `AuditLog` · `MediaAsset`.

## Roles (RBAC)

`ADMIN` (everything) · `SALES` (quotes, products read) · `EDITOR` (content, news, products) ·
`VIEWER` (read-only). Public endpoints are unauthenticated and read-only.

---

## Domain glossary (so the team speaks ALTAN)

- **Incoterms** — EXW / FCA / FOB / CIF / DDP etc.: who pays/risks what in delivery. Quote & product surfaces use these.
- **HS code** — Harmonized System customs code (e.g. Tungsten `8101 99 9000`).
- **OʻzMSt** — Uzbek national standard (e.g. `OʻzMSt 227:2024`) shown as product `standard`.
- **APT / MTU** — Ammonium Paratungstate; MTU = Metric Tonne Unit (tungsten pricing).
- **CoA / CoO** — Certificate of Analysis / Certificate of Origin (quality & customs docs).
- **RFQ / Quote** — buyer requests a price; sales responds within the **12h** SLA.
- **Outlook** — market direction tag on news: Firm / Bullish / Bearish / Mixed.
- **Grade / assay** — purity, e.g. `W ≥ 96.3%`, `Re ≥ 99.54%`, `Mo 55–75%`.

---

## Step index & status tracker

Statuses: ☐ not started · ◐ in progress · ✅ done

| #   | Step                                                                     | Phase        | Owner    | Depends on  | Status |
| --- | ------------------------------------------------------------------------ | ------------ | -------- | ----------- | ------ |
| 01  | [Monorepo, tooling & local infra](01-monorepo-and-tooling.md)            | Foundations  | backend  | —           | ✅     |
| 02  | [Database schema & shared types](02-database-schema-and-shared-types.md) | Foundations  | backend  | 01          | ✅     |
| 03  | [Backend core scaffolding](03-backend-core-scaffolding.md)               | Foundations  | backend  | 01,02       | ✅     |
| 04  | [Auth & RBAC](04-auth-and-rbac.md)                                       | Backend APIs | backend  | 03          | ✅     |
| 05  | [Products & catalog API](05-products-and-catalog-api.md)                 | Backend APIs | backend  | 03          | ✅     |
| 06  | [News / market intelligence API](06-news-intelligence-api.md)            | Backend APIs | backend  | 03          | ✅     |
| 07  | [Quote requests API](07-quote-requests-api.md)                           | Backend APIs | backend  | 03,04       | ✅     |
| 08  | [Content & i18n API](08-content-and-i18n-api.md)                         | Backend APIs | backend  | 03,04       | ✅     |
| 09  | [Seed & data migration](09-data-seeding-and-migration.md)                | Backend APIs | backend  | 02,05,06,08 | ✅     |
| 10  | [Public site shell (apps/web)](10-public-site-shell.md)                  | Public panel | frontend | 02,05,06,08 | ✅     |
| 11  | [Homepage](11-public-homepage.md)                                        | Public panel | frontend | 10,05,06,08 | ✅     |
| 12  | [Catalog & product detail](12-public-catalog.md)                         | Public panel | frontend | 10,05       | ✅     |
| 13  | [Quote modal & request flow](13-public-quote-modal.md)                   | Public panel | frontend | 10,07       | ✅     |
| 14  | [Admin shell & auth (apps/admin)](14-admin-shell-and-auth.md)            | Admin        | frontend | 04,10       | ✅     |
| 15  | [Admin: products & taxonomy](15-admin-product-management.md)             | Admin        | frontend | 14,05       | ✅     |
| 16  | [Admin: news](16-admin-news-management.md)                               | Admin        | frontend | 14,06       | ✅     |
| 17  | [Admin: quotes](17-admin-quote-management.md)                            | Admin        | frontend | 14,07       | ✅     |
| 18  | [Admin: content & translations](18-admin-content-and-translations.md)    | Admin        | frontend | 14,08       | ✅     |
| 19  | [Testing & QA](19-testing-and-qa.md)                                     | Quality      | both     | all         | ✅     |
| 20  | [Deployment, CI/CD & observability](20-deployment-and-ops.md)            | Launch       | backend  | all         | ✅     |

**Critical path:** 01 → 02 → 03 → (04–08 in parallel) → 09 → 10 → (11–13 ∥ 14 → 15–18) → 19 → 20.
A usable MVP slice = steps 01–13 (public site fully dynamic). Admin (14–18) can follow.

---

## Key decisions

**Architecture (change here if you disagree — it ripples through the steps):**

- **Next.js for the public site** (not a plain SPA) — SEO/SSR matters for a public B2B
  catalog. Admin stays a Vite SPA. _Fallback:_ collapse to one Vite SPA if SEO is a non-goal.
- **NestJS + PostgreSQL + Prisma**, Redis + BullMQ for async/notifications.
- **DB-backed translations** (admin-editable) served via API, with static fallback catalogs.

**Resolved with the owner (2026-06-18):**

1. **Supply regions — fully dynamic.** `Region` is a table with admin CRUD; seed CA + EU and
   let admins add the rest. Nothing region-related is hard-coded.
2. **Email — owner-provided.** The backend dispatches quote notifications through an abstract
   `MailerService` port (dev log/no-op adapter); the owner implements the real provider. We do
   not build/choose an email vendor.
3. **Product media — fully dynamic.** `MediaAsset` upload + admin management; storage location
   finalized at deploy (server filesystem or object store), served via the API.
4. **Auth scope** — admin/staff only for now (no buyer accounts yet).
5. **Deployment — self-managed server** (not Vercel). All three apps containerized and run on
   the owner's server behind a reverse proxy + TLS; **server credentials provided at handoff**
   after the platform is built. See step 20.
6. **No legacy files** — the original `products-data.js` / `app.js` are not available; we build
   and seed from this spec.

## Definition of done (applies to every step)

TypeScript strict, no `any` without reason · lint + typecheck clean · tests for logic and
critical flows · EN/RU/UZ where user-facing · accessible · documented (OpenAPI / README) ·
acceptance criteria in the step file all checked.
