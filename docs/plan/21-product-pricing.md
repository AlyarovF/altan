# 21 — Product Pricing (Indicative Prices)

## Goal

Admins set/update an **indicative price** per product; public visitors see current
prices on the catalog (card + detail). This is commodity trading: prices are
**per-unit** (USD/MT, USD/kg, USD/mtu), tied to a **price basis** (Incoterm), and
time-stamped so buyers know how fresh the number is. The binding price still comes
via the RFQ → Quote flow — public prices are indicative and carry a disclaimer.

## Data model (`apps/api/prisma/schema.prisma`)

New enum (mirrored in `packages/shared`):

```prisma
enum Currency {
  USD
  EUR
  CNY
  RUB
  UZS
}
```

New optional fields on `Product` (all-or-nothing group in practice; product without a
price shows "Price on request"):

| Field            | Type                          | Notes                                                                     |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `priceAmount`    | `Decimal? @db.Decimal(18, 2)` | Per-unit price. Decimal-as-string over API.                               |
| `priceCurrency`  | `Currency?`                   | USD primary.                                                              |
| `priceUnit`      | `String?`                     | e.g. `MT`, `kg`, `mtu` — same style as `minOrderUnit`.                    |
| `priceBasis`     | `Incoterm?`                   | Reuses existing enum, e.g. `FCA`.                                         |
| `priceNote`      | `String?`                     | Free text, e.g. "FCA Tashkent, min 5 MT".                                 |
| `priceUpdatedAt` | `DateTime?`                   | Set by the service whenever any price field changes. Never set by client. |

## API contract

- `CreateProductDto` / `UpdateProductDto`: `priceAmount?: number` (`@Min(0)`),
  `priceCurrency?: Currency`, `priceUnit?: string`, `priceBasis?: Incoterm`,
  `priceNote?: string`. `priceUpdatedAt` is **not** writable.
- `ProductCardDto`: `priceAmount: string | null`, `priceCurrency`, `priceUnit`.
- `ProductDetailDto` (extends card): + `priceBasis`, `priceNote`, `priceUpdatedAt`.
- `AdminProductDto` / `AdminProductDetailDto`: all price fields + `priceUpdatedAt`.
- Service sets `priceUpdatedAt = now()` in create/update when any of the five price
  fields is present in the payload and its value changed.
- All price fields go into the audit `snapshot()` — "who changed a price and when"
  falls out of the existing `AuditLog`.
- Validation: if `priceAmount` is set, `priceCurrency` and `priceUnit` are required
  (DTO-level custom check or service-level guard).

Contract flow after backend change: `openapi:export` → shared `api:generate` →
`pnpm --filter @altan/shared build`.

## Admin (`apps/admin/src/features/products/`)

- `schema.ts`: zod fields (amount positive, currency/unit required when amount set —
  `superRefine`).
- `ProductFormDrawer.tsx`: "Pricing" section in `CoreFields` — `InputNumber` (amount) +
  `Select` (currency) + `Input` (unit) + `Select` (Incoterm basis, optional) +
  `Input` (note). Prefill in `reset`, map in `toPayload`.
- `ProductsPage.tsx`: price column in the table (`33,500 USD / MT` or `—`).

## Public web (`apps/web`)

- `lib/format.ts`: `formatPrice(amount, currency, unit, locale)` →
  `Intl.NumberFormat` currency style, e.g. `US$33,500 / MT`.
- `components/ProductCard.tsx`: price row in the `<dl>`; fallback
  `t('common.priceOnRequest')`.
- `catalog/[slug]/page.tsx`: price block in facts (amount, basis, note, updated date)
  - indicative disclaimer; JSON-LD `offers` (`priceCurrency`, `price`,
    `priceSpecification` with `unitCode` when mappable) only when price present.
- `messages/{en,ru,uz}.json`: `common.price`, `common.priceOnRequest`,
  `product.priceBasis`, `product.priceUpdated`, `product.priceDisclaimer`.

## Seed

`apps/api/prisma/fixtures/index.ts`: add realistic indicative prices to
`ProductFixture` + the `products` array (e.g. APT ≈ USD 330/mtu, FeMo ≈ USD 33.5/kg Mo);
`seed.ts` maps them into `base` and sets `priceUpdatedAt`.

## Tests

- `products.service.spec.ts`: price mapping create/update, `priceUpdatedAt` bump only
  on actual change, Decimal-as-string in card/detail mappers, snapshot includes price.

## Out of scope (later phases)

- Per-company / contract pricing, FX conversion & multi-currency display, price
  history table (audit log covers traceability for now), price on `QuoteItem`
  snapshots.
