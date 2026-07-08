# Step 10 — Copy edits: independent assay, contact coverage block

## Changes

- **`quality.assurance.i2.body`** (all 3 JSONs; RU/UZ currently fall back to EN — add proper
  translations): "Third-party laboratories verify…" → "Independent laboratories verify
  chemistry, purity and particle size against your grade."
  RU: "Независимые лаборатории проверяют химический состав, чистоту и гранулометрию по
  вашему грейду." UZ: "Mustaqil laboratoriyalar kimyoviy tarkib, tozalik va zarracha
  o'lchamini sizning greydingizga muvofiq tekshiradi."
- **`about.principles.i2.body`**: "Third-party assay before material enters the chain." →
  "Independent assay before material enters the chain." (+ RU/UZ equivalents).
- **`apps/web/app/[locale]/contact/page.tsx`**: delete the "One desk, global reach" coverage
  `<section>` (~lines 112–129), the `desks` mapping, and any orphaned imports; delete
  `contact.coverage.*` (title, lede, d1–d3) from all 3 JSONs.

## Verify

`grep -ri "third-party" apps/web/messages` is empty; contact page ends after the details
section; typecheck passes.
