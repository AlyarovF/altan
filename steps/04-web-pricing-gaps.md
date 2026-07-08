# Step 04 — Web: close the pricing WIP gaps

## Changes

- **`apps/web/messages/{en,ru,uz}.json`** — add:
  - `common.price` — "Indicative price" / "Индикативная цена" / "Indikativ narx"
  - `common.priceOnRequest` — "Price on request" / "Цена по запросу" / "Narx so'rov bo'yicha"
  - `product.priceBasis`, `product.priceUpdated`, `product.priceDisclaimer`
    ("Indicative price — final pricing via RFQ." + RU/UZ equivalents)

  This immediately fixes ProductCard's currently-broken `t('common.price')` /
  `t('common.priceOnRequest')` calls — no component change needed there.

- **`apps/web/app/[locale]/catalog/[slug]/page.tsx`** — the file imports `formatPrice` but
  never uses it. In the sticky facts aside, add a price block above the `Descriptions`:
  - `formatPrice(product.priceAmount, product.priceCurrency, product.priceUnit, locale)` in
    the heavy mono treatment;
  - basis line (`t('product.priceBasis')`: incoterm + `priceNote`);
  - updated date via `Intl.DateTimeFormat(locale, { dateStyle: 'medium' })` on `priceUpdatedAt`;
  - small `priceDisclaimer` footnote;
  - fallback `common.priceOnRequest` when unpriced.
  - Extend `jsonLd` with `offers` only when priced:
    `{ '@type': 'Offer', price, priceCurrency, priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency, unitText: priceUnit }, availability: 'https://schema.org/InStock' }`
    (use `unitText`, not `unitCode` — no clean UN/CEFACT mapping for `mtu`).

## Verify

`pnpm --filter web typecheck`; open a priced product (ferromolybdenum) and an unpriced one;
inspect the JSON-LD.
