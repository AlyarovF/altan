# Step 15 — Admin: products & taxonomy management

|                |                   |
| -------------- | ----------------- |
| **Phase**      | Admin             |
| **Owner**      | frontend-engineer |
| **Depends on** | 14, 05            |
| **Status**     | ✅ Done           |

## Objective

Give editors full control of the catalog — the heart of "make products dynamic".

## Scope & deliverables

- **Products table** (AntD `Table`): server pagination/sort + filters (category, region,
  featured, status) + search; row actions (edit, publish/unpublish, feature, delete).
- **Create/Edit form** (drawer or page, RHF + zod): name, slug, category, region, grade,
  hsCode, standard (OʻzMSt), origin, min order (qty + unit), short/long description, status,
  **featured** toggle, **badges** multi-select, and a **specs editor** (repeatable
  label/value/unit rows, reorderable). Media upload. **Localized fields** via EN/RU/UZ tabs.
- **Taxonomy management**: Categories, Regions, Badges CRUD + reorder (`sortOrder`).

## Tasks

1. Build the table with server-driven query state and bulk/row actions.
2. Build the product form incl. the specs repeater and locale tabs; validate with shared zod.
3. Build category/region/badge management screens.

## Acceptance criteria

- [ ] Create/edit/delete/publish/feature a product and see it reflected on the public site.
- [ ] Specs editor adds/edits/reorders spec rows; badges and featured toggle work.
- [ ] All localized fields editable in EN/RU/UZ; taxonomy editable and reorderable.

## ALTAN-specific notes

- Validate HS code format and require grade/standard for published products (matches how the public catalog presents materials).
