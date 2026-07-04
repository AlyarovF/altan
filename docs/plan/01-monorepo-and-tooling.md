# Step 01 — Monorepo, tooling & local infra

|                   |                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Phase**         | Foundations                                                                              |
| **Owner**         | backend-engineer                                                                         |
| **Collaborators** | frontend-engineer                                                                        |
| **Depends on**    | —                                                                                        |
| **Status**        | ✅ Done (2026-06-18) — installs, builds, typechecks, lints clean; API `/health` verified |

## Objective

Stand up the monorepo, shared tooling, and local infrastructure so every later step has a
consistent, reproducible home.

## Scope & deliverables

- pnpm workspaces + **Turborepo** with `apps/web`, `apps/admin`, `apps/api`, `packages/shared`.
- Placeholder apps that boot: Next.js (`web`), Vite+React (`admin`), NestJS (`api`).
- Shared config: base `tsconfig`, ESLint + Prettier, `.editorconfig`, `.nvmrc` (Node LTS).
- Conventional Commits (commitlint + husky + lint-staged).
- `docker-compose.yml` for local infra: **PostgreSQL**, **Redis**, **MailHog** (dev email).
- `.env.example` per app + a single bootstrapping story; secrets never committed.
- Root scripts via Turbo: `dev`, `build`, `lint`, `typecheck`, `test`.

## Tasks

1. `pnpm init` workspace; add Turborepo pipeline (`turbo.json`) with caching.
2. Scaffold the four packages with their own `package.json` and TS configs extending the base.
3. Add shared ESLint/Prettier config package; wire all apps to it.
4. Add husky pre-commit (lint-staged) + commit-msg (commitlint).
5. Write `docker-compose.yml` (postgres + redis + mailhog) with named volumes and healthchecks.
6. `.gitignore`, `README` at repo root with "getting started".

## Acceptance criteria

- [ ] `pnpm install` succeeds from a clean clone.
- [ ] `pnpm dev` boots all three apps; `docker compose up` brings up healthy postgres/redis/mailhog.
- [ ] `pnpm lint` and `pnpm typecheck` pass on the empty scaffolds.
- [ ] Commits are linted; non-conventional messages are rejected.

## ALTAN-specific notes

- Web and admin are separate apps on purpose (SSR/SEO vs internal SPA) — keep build configs independent but share `packages/shared`.
