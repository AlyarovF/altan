# Step 05 — Products & catalog API

|                |                  |
| -------------- | ---------------- |
| **Phase**      | Backend APIs     |
| **Owner**      | backend-engineer |
| **Depends on** | 03 (02)          |
| **Status**     | ✅ Done          |

## Objective

Serve the product catalog publicly (filter/search/paginate, localized) and provide guarded
admin CRUD for products and taxonomy — replacing the static `products-data.js`.

## API surface

**Public (read-only):**

- `GET /products` — filters: `category`, `region` (ca/eu/…), `featured`, `badge`, `q` (search),
  `locale`; plus pagination + sort. Returns cards with grade, badges, min order, HS code, region.
- `GET /products/:slug` — detail: specs[], grade, hsCode, standard (OʻzMSt), origin, minOrder,
  badges, description (localized).
- `GET /categories`, `GET /regions`, `GET /badges`.

**Admin (guarded):**

- `POST/PATCH/DELETE /admin/products` (+ nested specs, badge assignment, featured, publish/draft, reorder).
- CRUD for `/admin/categories`, `/admin/regions`, `/admin/badges`.

## Tasks

1. DTOs + validation + Swagger for all endpoints; pagination meta envelope.
2. Search via Postgres `ilike`/full-text over name + grade + description.
3. Localized output driven by `?locale=` (fallback to default).
4. ETag/`Cache-Control` for public reads (ISR-friendly); audit writes.

## Acceptance criteria

- [ ] Filtering by category/region/featured/badge + search + pagination + sort all work.
- [ ] Detail returns every product field from the spec; localized correctly.
- [ ] Admin CRUD guarded by role; specs/badges/featured/publish editable; reorder persists.
- [ ] Public reads send caching headers.

## ALTAN-specific notes

- The 4 featured products (Tungsten, Rhenium, FeMo 60/70, Brazed Carbide Inserts) must come back with their exact grades/HS codes/min orders (seeded in step 09).
