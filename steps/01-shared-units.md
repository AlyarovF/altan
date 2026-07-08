# Step 01 — Canonical units in `packages/shared`

Foundation for every other pricing/units change.

## Changes

`packages/shared/src/index.ts`, next to `INCOTERMS`:

```ts
export const UNITS = ['MT', 'kg', 'g', 'lb', 'mtu', 'pcs'] as const;
export type Unit = (typeof UNITS)[number];
```

- Tighten `quoteItemSchema`: `unit: z.enum(UNITS)` (was `z.string().min(1).max(20)`).
  This flows into the web QuoteModal via `quoteRequestSchema` and into API RFQ validation.

## Verify

- `pnpm --filter @altan/shared build` passes.
- `pnpm -w typecheck` failures elsewhere are the worklist for steps 02 and 06.
