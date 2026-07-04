# Step 09 — Seed & data migration

|                |                  |
| -------------- | ---------------- |
| **Phase**      | Backend APIs     |
| **Owner**      | backend-engineer |
| **Depends on** | 02, 05, 06, 08   |
| **Status**     | ✅ Done          |

## Objective

Populate a fresh database with ALTAN's real content (from this spec — no legacy files) so the
public APIs return the actual site on first boot.

## Seed contents

- **Taxonomy:** 4 categories (Metals & Alloys, Carbide Tooling, Technical Ceramics, Instruments
  & Equipment); regions (CA=Central Asia, EU=Europe + placeholders for the 4 supply regions);
  badges (HOT 🔥, NEW ✨).
- **Featured products:**
  - Tungsten Metal — W ≥ 96.3%, sintered briquette, OʻzMSt 227:2024, HS 8101 99 9000, origin Central Asia, min 1,000 kg, 🔥 Hot.
  - Rhenium Metal — Re ≥ 99.54%, powder/granules, HS 8186 00 0000, min 1 kg, ✨ NEW.
  - Ferromolybdenum FeMo 60/70 — Mo 55–75%, HS 7202 70 0000, min 500 kg.
  - Brazed Carbide Inserts — WC-Co grades, ISO P/M/K, HS 8207 19 1000.
  - Plus stub rows to reach the advertised **26+ product lines**.
- **News:** the 3 articles (APT $292/MTU +8.4% YTD Firm; Rhenium $1,340/kg +12.1% YTD Bullish;
  FeMo $34.80/kg Mo −3.2% QoQ Mixed) with summaries/bodies.
- **Process steps:** Source / Qualify / Ship / Confirm (+ icons) and the process stats bar.
- **Site content:** company name, tagline, tag, trust badges; hero stats.
- **Translations:** EN/RU/UZ for all keys.
- **Initial admin user** (from step 04 seeder).

## Tasks

1. Idempotent `prisma db seed` using upserts (safe to re-run).
2. Keep seed data in typed fixtures for easy editing (no legacy JS files to ingest).
3. Verify public endpoints return the seeded ALTAN site.

## Acceptance criteria

- [ ] Fresh DB → seed → homepage/catalog/news/content APIs return ALTAN's real data.
- [ ] Re-running the seed does not duplicate rows.
- [ ] Seed data lives in typed fixtures; no dependency on legacy JS files.

## ALTAN-specific notes

- Treat this spec as the source of truth for the featured products/news/stats if the original JS files are not provided.
