# Step 05 — Public `/prices` board + nav

Metal.com-style public price board. Fully public, SEO-friendly.

## Changes

- **New `apps/web/app/[locale]/prices/page.tsx`** — server component, `export const
revalidate = 300`, fetch `fetchProducts({ priced: true, limit: 100, sort: 'sortOrder', locale })`.
  - Dark `PageHero`, then a dense table styled with existing `font-mono`/steel tokens (plain
    `<table>`, NOT AntD Table in an RSC): Material (link to `/catalog/[slug]`, grade
    sub-line) | Price (`formatPrice`) | Unit | Basis (incoterm + note) | Updated (localized
    date). Group rows by `category.name`.
  - Disclaimer strip + "Request a firm quote" `QuoteButton` at the bottom.
  - Mobile: collapse to stacked card rows (`sm:` breakpoint).
  - `generateMetadata` with localized title/description.
- **`apps/web/lib/api/catalog.ts`**: add `priced?: boolean` to `ProductFilters` → query param.
- **`components/Header.tsx`** NAV array: add `{ href: '/prices', key: 'prices' }` (desktop +
  drawer render from the same array — one edit).
- **`messages/{en,ru,uz}.json`**: `nav.prices` = "Prices" / "Цены" / "Narxlar"; new
  `prices.*` namespace (hero eyebrow/title/lede, column headers material/grade/price/basis/
  updated, disclaimer, empty state, CTA).
- **`app/sitemap.ts`**: add `/prices`.

Depends on step 02 (`priced` filter + card basis/updatedAt) and step 04 (price i18n keys).

## Verify

`/en/prices` and `/ru/prices` render only priced rows; header nav shows Prices on desktop and
in the drawer; unpriced products absent.
