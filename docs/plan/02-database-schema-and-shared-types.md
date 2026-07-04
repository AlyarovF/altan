# Step 02 — Database schema & shared domain types

|                   |                  |
| ----------------- | ---------------- |
| **Phase**         | Foundations      |
| **Owner**         | backend-engineer |
| **Collaborators** | product-manager  |
| **Depends on**    | 01               |
| **Status**        | ✅ Done          |

## Objective

Model the ALTAN domain in Prisma (PostgreSQL) and single-source the enums/types in
`packages/shared` so backend and both frontends never drift.

## Entities (Prisma `schema.prisma`)

- **Product** — `id, slug, name, categoryId, regionId, featured, grade, hsCode, standard
(OʻzMSt), origin, minOrderQty, minOrderUnit, shortDescription, description, status
(DRAFT|PUBLISHED), sortOrder, timestamps`. Relations: `specs[]`, `badges[]`, `media[]`,
  `translations[]`.
- **ProductSpec** — `id, productId, label, value, unit?, sortOrder` (the prototype `specs` array).
- **ProductTranslation** / **NewsTranslation** — localized `name/description` / `title/summary/body` per `locale`.
- **Category** — `id, slug, name, sortOrder` (seed: Metals & Alloys, Carbide Tooling, Technical Ceramics, Instruments & Equipment).
- **Region** — `id, code, name, sortOrder` (seed `ca`=Central Asia, `eu`=Europe; table is extensible to the 4 supply regions).
- **Badge** + **ProductBadge** — `code (HOT|NEW), label, emoji, color` (🔥 Hot, ✨ NEW).
- **NewsArticle** — `id, slug, title, commodity, publishedAt, priceLabel, changeLabel,
changeDirection (UP|DOWN|FLAT), outlook (FIRM|BULLISH|BEARISH|MIXED), summary, body, status, sortOrder`.
- **ProcessStep** — `id, stepNo, key (source|qualify|ship|confirm), title, subtitle, icon, sortOrder`.
- **SiteStat** — `id, key, label, value, group (HERO|PROCESS_BAR), sortOrder`.
- **SiteContent** — `id, key, valueJson` (company name, tagline, tag, trust badges, footer…).
- **Translation** — `id, namespace, key, locale (EN|RU|UZ), value` — unique `(namespace,key,locale)`.
- **QuoteRequest** — `id, ref, companyName, contactName, email, phone, country, incoterm,
destination, message, status (NEW|IN_REVIEW|QUOTED|WON|LOST|CLOSED), slaDueAt, respondedAt, source, createdAt`.
- **QuoteItem** — `id, quoteId, productId?, productNameSnapshot, quantity, unit, notes`.
- **User** — `id, email, passwordHash, name, role (Role), isActive, lastLoginAt`.
- **AuditLog** — `id, actorId, action, entity, entityId, before(json), after(json), createdAt`.
- **MediaAsset** — `id, url, alt, type, width, height, createdAt`.

## Shared enums/types/schemas (`packages/shared`)

`Locale(EN,RU,UZ)`, `Incoterm(EXW,FCA,FOB,CIF,CFR,DAP,DDP)`, `BadgeCode`, `Outlook`,
`ChangeDirection`, `QuoteStatus`, `Role(ADMIN,SALES,EDITOR,VIEWER)`, `ProductStatus`. Plus
zod schemas for quote submission and product/news payloads (reused by API + forms).

## Tasks

1. Author `schema.prisma`; run the initial migration; generate the Prisma client.
2. Mirror enums in `packages/shared` (single source); add zod schemas.
3. Document state machines: **QuoteStatus** and **ProductStatus** transitions.
4. Decide localization: child translation tables for product/news text; `Translation` table for site/i18n keys (documented).

## Acceptance criteria

- [x] `prisma migrate` runs clean; client generates.
- [x] Enums imported from `packages/shared` (single TS source; Prisma enum names mirror it 1:1).
- [x] Schema captures every field in the spec table (grade, hsCode, standard, origin, minOrder, specs, badges, outlook…).

## ALTAN-specific notes

- Money/price values are display strings here (`$292 APT/MTU`), not arithmetic — store as labels. If real pricing/orders arrive later, switch to `Decimal` + currency.
