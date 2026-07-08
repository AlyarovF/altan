# Step 06 — Unit dropdowns (quote modal + admin) & admin pricing section

## Changes

- **`apps/web/features/quote/QuoteModal.tsx`**: replace the free-text unit `Input` with
  `<Select options={UNITS.map(u => ({ value: u, label: u }))} />` (import `UNITS` from
  `@altan/shared`). Guard prefill in `buildDefaults`:
  `UNITS.includes(unit as Unit) ? unit : 'kg'` so a legacy/CMS unit can never produce an
  invalid zod-enum default. `EMPTY_ITEM` keeps `'kg'`.
- **Admin** (`apps/admin/src/features/products/` — pricing UI was never implemented):
  - `schema.ts`: zod price fields — `priceAmount` positive optional; `priceCurrency` +
    `priceUnit` required-when-amount via `superRefine`; `priceUnit: z.enum(UNITS)`;
    `priceBasis: z.enum(INCOTERMS)` optional; `priceNote` optional. Switch `minOrderUnit` to
    `z.enum(UNITS).optional().or(z.literal(''))`.
  - `ProductFormDrawer.tsx`: "Pricing" section in CoreFields — `InputNumber` +
    `Select`(CURRENCIES) + `Select`(UNITS) + `Select`(INCOTERMS) + `Input`(note);
    `minOrderUnit` Input → Select; prefill in `reset`, map in `toPayload`.
  - `ProductsPage.tsx`: price column ("33,500 USD / MT" or "—").

Depends on: 01 (UNITS), 02 (DTO accepts writes), 03 (seed values valid — otherwise editing a
seeded product with `kg Mo` fails validation).

## Verify

Admin create/edit round-trips price fields; quote modal submits with a selected unit; API
rejects `priceUnit: 'tonnes'` with 400.
