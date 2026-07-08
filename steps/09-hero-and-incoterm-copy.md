# Step 09 — Hero copy + incoterm-listing removals (web side)

User requests: "GLOBAL TRADING HOUSE…" → "GLOBAL HUB FOR CRITICAL RAW MATERIALS"; remove the
"Tungsten, rhenium, ferromolybdenum and carbide — … on any incoterm." lede; remove
"all incoterms"-style strings.

## Changes

- **`home.heroTag`** in all 3 JSONs → the same "Global Hub…" values as the seed in step 03
  (JSON is the API-down fallback; they must match):
  EN `Global Hub for Critical Raw Materials` · RU `Глобальный хаб критически важного сырья` ·
  UZ `Muhim xom ashyo uchun global markaz`.
- **Remove `heroLede`**: drop the `lede` prop and its `<p>` in
  `apps/web/features/home/Hero.tsx`; stop passing `lede={t('heroLede')}` in
  `app/[locale]/page.tsx`; delete `home.heroLede` from all 3 JSONs (the RU/UZ "любых
  условиях Инкотермс" / "istalgan Inkoterms" strings die here).
- **`components/Footer.tsx`**: delete the hardcoded bottom-bar
  `EXW · FCA · FOB · CFR · CIF · DAP · DDP` span (keep copyright row and the Incoterms
  column link).
- **`home.trustBadges`** JSON fallbacks in 3 files: mirror step 03
  (`EXW/CIF/FOB/DDP` → `Independent assay` variants).
- **`app/[locale]/layout.tsx`** metadata description fallback: "Global trading house…" →
  "Global hub for critical raw materials…".

## Verify

Home hero shows eyebrow + headline + CTAs with no lede paragraph; view-source contains no
"EXW/CIF" strings outside `/incoterms` and the quote-modal incoterm select.
