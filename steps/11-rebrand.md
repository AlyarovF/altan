# Step 11 — Rebrand: navy + gold, serif display, new mark

Target identity (from the brand screenshot): deep navy background, gold accent, white; serif
letter-spaced "ALTAN" wordmark; gold sub-line "CRITICAL RAW MATERIALS"; logo = letter A whose
crossbar is a gold bar.

## Changes

- **`apps/web/lib/tokens.ts`** (keep exported names `ink`/`steel`/`amber` → zero Tailwind
  class churn):
  - `ink` → navy ramp: DEFAULT/900 `#101A30`, 800 `#16233E`, 700 `#1C2C4C`, 600 `#27395E`,
    soft `#1C2C4C`, muted `#3E4E70`.
  - `amber` → gold: DEFAULT `#C9A227`, bright `#E3BE4C`, deep `#8F6F14`, tint `#F5EBCB`,
    eyebrow ~`#7A6210`. **Verify contrast**: white on `deep` ≥ 4.5:1 (AntD `colorPrimary`
    buttons), eyebrow ≥ 4.5:1 on white and steel-50 — darken if needed.
  - `steel` → blue-grey ramp (e.g. 50 `#F4F6FA` … 900 `#131C30`) so dark surfaces harmonize.
- **`app/globals.css`**: mirror the `:root` custom properties exactly; review heading
  letter-spacing for serif (≈0 instead of -0.015em) and swap the display fallback to
  `Georgia, serif`.
- **Hardcoded hex sweep**: `grep -rn '#0C0F14\|#C8881C\|#E9A227\|#9A6A00' apps/web` — Header
  Drawer styles (×2), motifs, `app/icon.svg`, etc.
- **`lib/fonts.ts`**: `--font-display` → `Playfair_Display` from `next/font/google`
  (`subsets: ['latin','cyrillic']`, weights 500–700). Keep Montserrat for `--font-sans` and
  `--font-mono`.
- **`components/BrandMark.tsx`**: replace the crystal SVG with the letter-A mark — white
  legs, **gold horizontal crossbar** extending slightly past the legs; same `{ size }`
  signature so Header/Footer callsites don't change. Update `app/icon.svg` to match.
- **Wordmark** in Header + Footer: two-line logotype — `ALTAN` in `font-display` serif,
  uppercase, `tracking-[0.18em]`, white; beneath it `CRITICAL RAW MATERIALS` at ~9–10px,
  gold (`text-amber-bright` on dark), `tracking-[0.3em]`, uppercase. Hardcoded brand
  constant (not i18n); keep `companyName` for `aria-label`/metadata/copyright. Drawer title
  likewise.
- Run the `impeccable`/`frontend-design` pass for visual quality.

## Verify

Visual smoke on home/catalog/prices/contact in all 3 locales (dark surfaces navy, buttons
gold, headings serif); AntD primary button contrast; `pnpm --filter web build`.
