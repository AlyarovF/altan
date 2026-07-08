# ALTAN — Real Product Overhaul: Overview

ALTAN is a real B2B critical-raw-materials trading company — the public site must become a
real product in the spirit of metal.com / fastmarkets / argusmedia: visitors can openly see
material prices; the site carries the official brand identity (deep navy + gold, serif
"ALTAN" wordmark with "CRITICAL RAW MATERIALS" sub-line, A-mark with gold crossbar); several
marketing sections are removed; measurement units are fixed; contacts become the real
Kazakhstan details.

## Confirmed decisions

- Email: **sales@altan.info**
- Phone: **+7 776 5300300**
- Office: **Almaty, Kazakhstan** (RU: Алматы, Казахстан / UZ: Almati, Qozogʻiston)
- Prices board: **fully public** (no login)
- Rebrand: **full** — navy + gold palette, serif display, new A-mark logo

## Key architecture facts

- Hero copy, trust badges, footer contacts are **CMS-driven** (DB `SiteContent`, seeded from
  `apps/api/prisma/fixtures/index.ts`) with `apps/web/messages/{en,ru,uz}.json` as fallback —
  both sides must change; DB values only update after a seed re-run + ISR revalidate.
- Uncommitted product-pricing WIP exists (migration `20260704165145_product_pricing`, DTOs,
  service, spec) — it is kept and completed, not reverted.
- `/incoterms` is currently a redirect to `/sourcing` — deleting sourcing requires making it
  a real page (the footer links to it).

## Steps

| #   | File                            | Scope                                                            |
| --- | ------------------------------- | ---------------------------------------------------------------- |
| 01  | 01-shared-units.md              | Canonical UNITS in packages/shared                               |
| 02  | 02-api-pricing-contract.md      | API DTO validation, card fields, `priced` filter, contract regen |
| 03  | 03-seed-fixtures.md             | Units normalization, KZ contacts, hero tag, trust badges         |
| 04  | 04-web-pricing-gaps.md          | i18n price keys, catalog detail price block + JSON-LD            |
| 05  | 05-prices-board.md              | Public `/prices` page + nav                                      |
| 06  | 06-unit-dropdowns-admin.md      | Quote modal unit Select, admin pricing UI                        |
| 07  | 07-remove-home-sections.md      | Remove Coverage + "How ALTAN works"                              |
| 08  | 08-remove-sourcing-incoterms.md | Delete Sourcing, real /incoterms page                            |
| 09  | 09-hero-and-incoterm-copy.md    | "Global Hub…" tag, drop hero lede, incoterm strips               |
| 10  | 10-copy-edits.md                | Assay copy, contact "One desk" removal                           |
| 11  | 11-rebrand.md                   | Navy+gold tokens, serif display, BrandMark, wordmark             |
| 12  | 12-verification.md              | Lint/typecheck/tests/build, seed re-run, smoke                   |

**Commit sequence** (each leaves the tree green): 00–02 (contract) → 03 (seed) → 04–06
(pricing product) → 07–08 (removals) → 09–10 (copy) → 11 (rebrand) → 12 (verify).
Conventional Commits.
