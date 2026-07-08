# Step 07 — Remove home "Coverage" + "How ALTAN works" sections

User request: the "From landlocked mines to any port" (Coverage) block and the "How we work"
(ProcessSteps / "How ALTAN works") section are removed entirely.

## Changes

- **`apps/web/app/[locale]/page.tsx`**: remove `<Coverage />` and
  `<ProcessSteps steps ... />`, their imports, and `fetchProcessSteps` from the `Promise.all`
  (keep `fetchStats` — the hero uses the `HERO` stats group).
- **Delete** `apps/web/features/home/Coverage.tsx` and `apps/web/features/home/ProcessSteps.tsx`.
- **`messages/{en,ru,uz}.json`**: delete `home.coverageEyebrow`, `home.coverageHeading`,
  `home.coverageSubheading`, `home.coverageCta`, `home.processEyebrow`, `home.processHeading`,
  `home.processSubheading`, `home.processStep.*`.
- Seed overlay entry `home.processHeading` is removed in step 03.

## Decision (recorded)

Keep the `/process-steps` API, Prisma model, seed data and admin CRUD — **web-only removal**.
Zero migration risk, admin screens keep working, the section can return later. The
`PROCESS_BAR` stats group becomes unused on the public site (left in place).

## Verify

Home renders hero → trust bar → capabilities → featured → news;
`grep -r "coverageHeading\|processStep" apps/web` is empty; typecheck passes.
