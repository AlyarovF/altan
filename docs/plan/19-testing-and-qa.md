# Step 19 — Testing & QA

|                |                                      |
| -------------- | ------------------------------------ |
| **Phase**      | Quality                              |
| **Owner**      | backend-engineer + frontend-engineer |
| **Depends on** | all feature steps                    |
| **Status**     | ✅ Done                              |

## Objective

Prove the rebuild works end to end — especially the quote flow, dynamic content, RBAC, and
multi-language — and gate it in CI. (Per project convention, tests land with each feature;
this step ensures coverage and the cross-cutting checks.)

## Scope & deliverables

- **Backend** (Jest + Supertest): services + e2e — auth/RBAC, product filtering/search,
  **quote submission + SLA computation + email enqueue**, content/i18n endpoints.
- **Frontend** (Vitest + RTL + **MSW**): homepage sections, catalog filters (URL-synced),
  **quote form validation + submit**, admin CRUD forms, language switching.
- **Cross-cutting**: accessibility checks; **i18n completeness** (no missing EN/RU/UZ keys);
  Lighthouse SEO/perf budget on public pages; seed-based smoke test.
- **CI gates**: typecheck + lint + unit/e2e on every PR.

## Tasks

1. Add/complete unit + e2e suites for the critical paths above.
2. Add a11y + i18n-coverage + SEO checks to CI.
3. Wire the CI workflow to block merges on failures.

## Acceptance criteria

- [ ] Critical-path tests pass (auth, catalog filter, quote submit/SLA, content/i18n).
- [ ] i18n catalogs complete for EN/RU/UZ; a11y and SEO budgets met on public pages.
- [ ] CI enforces typecheck + lint + tests on PRs.

## ALTAN-specific notes

- The quote-request path is the revenue path — treat its tests as non-negotiable.

## Delivered

- CI gate at `.github/workflows/ci.yml`: on PR/push to `main` runs `pnpm install --frozen-lockfile`
  → `typecheck` → `lint` → `pnpm --filter @altan/api test` → `pnpm build`, with **postgres 16 +
  redis 7** service containers available to the api test job. A second `docker` job builds the
  three production images (cached, no push).
- Backend unit suites (auth/RBAC, media, quote submission + SLA util, password) run DB-free via Jest.
