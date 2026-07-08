# Step 12 — Full verification & seed re-run

## Automated

- `pnpm -w lint && pnpm -w typecheck` (or `turbo run lint typecheck`)
- `pnpm --filter @altan/api test` — pricing spec suite must pass with the extended card mapper
- `pnpm --filter web build`
- `git diff packages/shared/src/api-types.ts` — additive changes only (card basis/updatedAt,
  `priced` param, unit enums)

## Database

- Apply the uncommitted `20260704165145_product_pricing` migration (`prisma migrate dev`/`deploy`)
- Re-run seed: `pnpm --filter @altan/api exec prisma db seed`
- `POST /admin/content/revalidate` (ISR caches up to 300 s)

## Manual smoke (EN/RU/UZ)

- `/` — hub eyebrow, no lede / Coverage / ProcessSteps / incoterm strip; navy+gold, serif headings
- `/prices` — priced rows only; nav link in desktop header and mobile drawer
- `/catalog/<priced>` (ferromolybdenum) — price block, basis, updated date, disclaimer,
  `offers` JSON-LD; `/catalog/<unpriced>` — "Price on request"
- `/incoterms` — 7 cards; `/sourcing` — permanent redirect
- `/contact` — sales@altan.info, +7 776 5300300, Almaty; no "One desk, global reach"
- Quote modal — unit Select over UNITS
- Admin — product pricing round-trip; price column in the table

## Runtime-override reminder

DB `SiteContent`/`Translation` rows win over bundled JSON at runtime — JSON-only edits to
hero tag/trustBadges will NOT show until the seed is re-run (or values are updated via
`/admin/content`), and ISR caches for up to 300 s.
