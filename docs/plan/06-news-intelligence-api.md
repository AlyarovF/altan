# Step 06 — News / market intelligence API

|                |                  |
| -------------- | ---------------- |
| **Phase**      | Backend APIs     |
| **Owner**      | backend-engineer |
| **Depends on** | 03               |
| **Status**     | ✅ Done          |

## Objective

Serve the "Market Intelligence" articles publicly and provide guarded admin CRUD — replacing
the hard-coded 3 news cards.

## API surface

- **Public:** `GET /news` (paginate, filter by `commodity`, `locale`), `GET /news/:slug`.
- **Admin:** `POST/PATCH/DELETE /admin/news`.

Fields per article: `title, commodity, publishedAt, priceLabel ($292 APT/MTU),
changeLabel (+8.4% YTD), changeDirection (UP|DOWN|FLAT), outlook (FIRM|BULLISH|BEARISH|MIXED),
summary, body, status`, localized (EN/RU/UZ).

## Tasks

1. DTOs + validation + Swagger; pagination; localized output.
2. Caching headers for public reads; audit writes.
3. Sort by `publishedAt` desc by default.

## Acceptance criteria

- [ ] Public list + detail work and paginate; filter by commodity.
- [ ] Admin CRUD guarded by role; localized.
- [ ] The 3 seed articles (Tungsten/APT, Rhenium, FeMo) return with price, change direction, and outlook intact.

## ALTAN-specific notes

- `changeDirection` drives the up/down/flat color on the frontend; `outlook` drives the Firm/Bullish/Bearish/Mixed badge.
