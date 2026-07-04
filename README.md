# ALTAN Trading House — Platform Monorepo

B2B trading platform for critical raw materials. _"Where Critical Materials Meet Markets."_

This is a pnpm + Turborepo monorepo:

| Path              | Package         | Stack                   | Purpose                               |
| ----------------- | --------------- | ----------------------- | ------------------------------------- |
| `apps/web`        | `@altan/web`    | Next.js 14 (App Router) | Public user panel (SSR/SEO, EN/RU/UZ) |
| `apps/admin`      | `@altan/admin`  | Vite + React + AntD     | Internal admin dashboard              |
| `apps/api`        | `@altan/api`    | NestJS                  | REST API + OpenAPI                    |
| `packages/shared` | `@altan/shared` | TypeScript              | Shared types, enums, zod schemas      |

See [`CLAUDE.md`](./CLAUDE.md) for architecture/domain context and
[`docs/plan/`](./docs/plan/README.md) for the step-by-step build plan.

## Prerequisites

- **Node.js 20** (`.nvmrc`) and **pnpm 9** (via Corepack: `corepack enable`).
- **Docker** (for local Postgres + Redis).

## Getting started

```bash
corepack enable            # provides pnpm 9 (pinned in package.json)
pnpm install               # install the whole workspace
docker-compose up -d       # start Postgres + Redis (Postgres :5432, Redis :6379)
pnpm dev                   # run web (:3000), admin (:3002), api (:3001/api/v1) together
```

## Common scripts (run from the repo root)

| Command                             | Does                               |
| ----------------------------------- | ---------------------------------- |
| `pnpm dev`                          | Run all apps in watch mode (Turbo) |
| `pnpm build`                        | Build every package                |
| `pnpm typecheck`                    | Type-check every package           |
| `pnpm lint` / `pnpm lint:fix`       | Lint the workspace                 |
| `pnpm format`                       | Prettier-format the workspace      |
| `pnpm infra:up` / `pnpm infra:down` | Start/stop local Postgres + Redis  |

## Conventions

TypeScript strict everywhere · Conventional Commits (enforced by commitlint + husky) ·
ESLint + Prettier · shared types live in `@altan/shared`.

## Ports

- Public site `@altan/web` → http://localhost:3000
- API `@altan/api` → http://localhost:3001/api/v1 (health: `/api/v1/health`)
- Admin `@altan/admin` → http://localhost:3002
