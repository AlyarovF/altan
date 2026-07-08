# Step 02 — API: finish pricing contract + prices-board data

Decision: **reuse `GET /products`** — no new endpoint. It is already `@Public()`, paginated,
localized and cached.

## Changes

- **Write DTOs** (`apps/api/src/products/dto/product-write.dto.ts`, Create + Update) and the
  public RFQ `QuoteItemInputDto` (`apps/api/src/quotes/dto/`): `@IsIn(UNITS)` (import from
  `@altan/shared`) on `priceUnit`, `minOrderUnit`, `unit` — replacing bare `@IsString()`.
- **`ProductCardDto`** (`dto/product-response.dto.ts`): add `priceBasis?: string | null` and
  `priceUpdatedAt?: string | null` (prices board needs both per row); extend the card mapper
  in `products.service.ts`; remove the now-duplicated fields from `ProductDetailDto` (it
  extends the card DTO).
- **`ProductQueryDto`**: add `priced?` boolean-string (`@IsBooleanString()`); in
  `listPublic`, when `priced === 'true'` add `where: { priceAmount: { not: null } }`.

## Contract regen (mandatory sequence)

```
pnpm --filter @altan/api openapi:export
pnpm --filter @altan/shared api:generate
pnpm --filter @altan/shared build
```

## Tests

Extend `apps/api/src/products/products.service.spec.ts`: card mapper returns
`priceBasis`/`priceUpdatedAt`; `listPublic({ priced: 'true' })` filters unpriced products.
Run `pnpm --filter @altan/api test`.

## Verify

`curl 'localhost:<port>/products?priced=true'` returns only priced products, each with
basis + updatedAt.
