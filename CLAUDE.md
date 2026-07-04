# ALTAN — B2B Critical Raw Materials Trading Platform

ALTAN is a B2B trading company specializing in **critical raw materials** (e.g. rare
earths, base & specialty metals, ores, concentrates) **sourced from Central Asia and
delivered globally**. This repository is a ground-up rebuild of the ALTAN platform.

## Domain context (read this before designing features)

This is commodity trading, not e-commerce. The mental model is **RFQ → Quote → Contract →
Order → Shipment → Settlement**, not "add to cart → checkout".

Things that are first-class in this domain and easy to get wrong if you forget them:

- **Counterparties, not consumers.** Buyers and suppliers are companies. KYC/AML
  onboarding, credit terms, and per-company pricing matter.
- **RFQ / quotation workflow.** Customers request quotes for a material + spec + quantity +
  destination; sales responds with priced, time-bound quotes.
- **Material specifications & quality.** Grade, purity/assay, particle size, packaging,
  certificates of analysis, certificates of origin. HS codes for customs.
- **Incoterms & logistics.** EXW/FCA/FOB/CIF/DAP etc. Central Asia is largely landlocked —
  multimodal logistics (rail, road, sea via transit corridors) and lead times are central.
- **Compliance.** Export controls, sanctions screening, dual-use checks. Treat this as a
  hard requirement, never an afterthought.
- **Multi-currency & multi-language.** Global buyers. USD primary; show FX. i18n from day one.
- **Documents.** Contracts, invoices, packing lists, bills of lading, CoA/CoO — generation,
  storage, and audit trail are core, not optional.
- **Auditability.** Who changed a price, a quote, an order, and when. Immutable audit log.

When a requirement is ambiguous, prefer the interpretation a commodity trader would expect.

## Architecture

Monorepo (pnpm workspaces + Turborepo):

```
altan/
  apps/
    web/        # PUBLIC user panel — Next.js (App Router) + TS, SSR/ISR for SEO   -> @altan/web
    admin/      # ADMIN dashboard — Vite + React + TS SPA (internal tool)          -> @altan/admin
    api/        # NestJS + TypeScript backend                                      -> @altan/api
  packages/
    shared/     # shared TS types, enums, zod schemas, generated API client        -> @altan/shared
  docs/         # product docs (PRDs/stories) + the build plan in docs/plan/
```

**Contract-first.** The backend is the source of truth for the API. It exposes an OpenAPI
spec via Swagger; the frontend generates a typed client from that spec (orval /
openapi-typescript). Shared domain types/enums live in `packages/shared`. Frontend and
backend must not drift — if the contract changes, regenerate the client.

## Tech stack (decided — see agent files for details & rationale)

**Public site** (`apps/web`): Next.js 14 (App Router) + TypeScript, Ant Design v5
(+ @ant-design/nextjs-registry), Tailwind CSS, next-intl (EN/RU/UZ locale routing + hreflang),
TanStack Query v5, Axios, dayjs. SSR/ISR for SEO on a public B2B marketing + catalog site.

**Admin** (`apps/admin`): React 18 + TypeScript, Vite, Ant Design v5, Tailwind CSS,
React Router v6, TanStack Query v5, Zustand, React Hook Form + Zod, i18next, Ant Design
Charts, Vitest + Testing Library + MSW.

**Backend** (`apps/api`): Node.js + TypeScript, NestJS, PostgreSQL + Prisma, Redis,
BullMQ, Passport + JWT + argon2, class-validator, @nestjs/swagger, nestjs-pino,
@nestjs/throttler + helmet, Jest + Supertest. Docker Compose for local infra.

## The agent team

Use the specialized subagents in `.claude/agents/` — they carry the deep stack/domain
knowledge and conventions:

- **product-manager** — turns business goals into PRDs, user stories, acceptance criteria,
  scope, and roadmap. Owns `docs/`. Start here when a feature is fuzzy.
- **backend-engineer** — NestJS API, data model, auth, business logic, the API contract.
- **frontend-engineer** — React UI, pages, components, state, data fetching, styling.

Typical flow: **product-manager** specs a feature → **backend-engineer** designs the data
model + API and publishes the OpenAPI contract → **frontend-engineer** builds the UI against
the generated client. Keep `packages/shared` as the single source of shared types.

## Conventions

- **TypeScript everywhere**, `strict` on. No `any` without a written reason.
- Conventional Commits. Small, reviewable changes.
- Tests for business logic and critical flows; don't skip them on money/compliance paths.
- Secrets via env, never committed. Validate env at boot.
