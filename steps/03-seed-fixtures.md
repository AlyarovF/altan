# Step 03 — Seed fixtures: units, contacts, hero tag, trust badges

Single file: `apps/api/prisma/fixtures/index.ts`.

## Changes

- **Units normalization:** `priceUnit: 'kg Mo'` (FeMo product) → `'kg'`, move the
  contained-metal nuance into that product's `priceNote` (e.g. "per kg Mo contained, FCA
  basis"). Audit all `priceUnit`/`minOrderUnit` values against `UNITS`; type the fixture
  fields as `Unit` so TS enforces the canon.
- **Contacts** — in the `footer` siteContent value AND both RU/UZ translation variants:
  - `email: 'sales@altan.info'`
  - `phone: '+7 776 5300300'`
  - `address`: `'Almaty, Kazakhstan'` / `'Алматы, Казахстан'` / `'Almati, Qozogʻiston'`
  - `companyName`: `'ALTAN Trading House'` → `'ALTAN'`; copyright → `'© 2026 ALTAN. All rights reserved.'`
    (brand wordmark carries the "Critical Raw Materials" sub-line).
- **Hero `tag`**: EN `'Global Hub for Critical Raw Materials'`;
  RU `'Глобальный хаб критически важного сырья'`;
  UZ `'Muhim xom ashyo uchun global markaz'`.
- **`trustBadges`** (all 3 locales): replace `'EXW/CIF/FOB/DDP'` with
  `'Independent assay'` / `'Независимый анализ'` / `'Mustaqil tahlil'`.
- **translations overlay array:** delete the `home.processHeading` entry (section removed in
  step 07). No other removed keys exist in the overlay.

## Risk notes

- `seed.ts` upserts with `update: { valueJson }` — re-running the seed applies these fixture
  changes but **overwrites any admin-authored DB edits** for the same keys.
- Removed fixture entries are NOT deleted from the DB by the seed (upsert-only). Stale
  `home.processHeading` Translation rows are harmless (no consumer).
- After re-seed, revalidate ISR: `POST /admin/content/revalidate` (or wait out
  `revalidate = 300`).

## Verify

```
pnpm --filter @altan/api exec prisma db seed
curl 'localhost:<port>/content?locale=ru' | jq '.footer, .tag, .trustBadges'
```
