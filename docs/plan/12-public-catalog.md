# Step 12 — Catalog & product detail

|                |                   |
| -------------- | ----------------- |
| **Phase**      | Public panel      |
| **Owner**      | frontend-engineer |
| **Depends on** | 10, 05            |
| **Status**     | ✅ Done           |

## Objective

Rebuild `catalog.html` as a dynamic, filterable, SEO-friendly catalog plus per-product detail
pages.

## Scope & deliverables

- **Catalog page**: filters — category, region (ca/eu/…), featured, badge, and a search box —
  bound to **URL query params** (shareable, SSR-rendered). Product cards (name, category, grade,
  badges, min order, HS code, region), sorting, pagination, and an empty state.
- **Product detail** (`/[locale]/catalog/[slug]`): specs table, grade, HS code, standard
  (OʻzMSt), origin, min order, description, badges, and a **"Request quote for this product"**
  button that opens the modal **prefilled** with the product.
- SEO: per-product `metadata` + **JSON-LD `Product`**; ISR revalidation.

## Tasks

1. Build filter UI (AntD Select/Checkbox/Input) synced to the URL; fetch via the API on the server.
2. Card + detail components; specs table; badge rendering.
3. Wire the prefilled quote CTA; localized everything.

## Acceptance criteria

- [ ] Filtering (category/region/featured/badge) + search + sort + pagination work and are URL-synced + SSR.
- [ ] Detail page shows all product fields; "Request quote" prefills the modal.
- [ ] Localized in EN/RU/UZ; per-product SEO tags + JSON-LD present.

## ALTAN-specific notes

- Catalog is a key SEO surface (buyers search "tungsten supplier", "rhenium metal", HS codes) — ensure server rendering and clean URLs.
