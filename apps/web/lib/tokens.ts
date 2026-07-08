/**
 * ALTAN brand palette — the single source of truth for every raw brand hex on
 * the JS/TS side. Both `tailwind.config.ts` (utility/layout tokens) and
 * `lib/theme.ts` (Ant Design `ConfigProvider` tokens) import from here so the two
 * systems can never drift. Plain hex strings so Tailwind's alpha utilities
 * (`bg-amber/50`) and antd's colour-derivation algorithm both consume them
 * directly.
 *
 * NOTE: `app/globals.css` mirrors these same values as `:root` CSS custom
 * properties (a stylesheet can't import TS without a codegen step). Keep the two
 * in sync — this module and the `:root` block in globals.css are the two canonical
 * anchors, each internally deduped.
 */
export const palette = {
  // Deep-navy ink — the brand's dark canvas (per the ALTAN identity: navy,
  // gold, white). Token keeps the `ink` name so no Tailwind class churns.
  ink: {
    DEFAULT: '#101A30',
    900: '#101A30',
    800: '#16233E',
    700: '#1C2C4C',
    600: '#27395E',
    soft: '#1C2C4C',
    muted: '#3E4E70',
  },
  // Blue-grey neutrals — borders, surfaces, muted text; tinted toward the navy
  // canvas so light and dark surfaces share one temperature.
  steel: {
    50: '#F4F6FA',
    100: '#E9EDF4',
    200: '#D8DFEA',
    300: '#B7C2D4',
    400: '#8494AC',
    500: '#5A6B87',
    600: '#43536D',
    700: '#324259',
    800: '#24314A',
    900: '#131C30',
  },
  // Gold accent — the single brand color (the crossbar of the A-mark), used
  // with restraint. `deep` is the interactive gold: white on it is 4.72:1 (AA),
  // so it drives antd's colorPrimary.
  amber: {
    DEFAULT: '#C9A227',
    bright: '#E3BE4C',
    deep: '#8F6F14',
    tint: '#F5EBCB',
    // AA-safe eyebrow gold: deeper than `deep` so the tracked 11px eyebrow clears
    // 4.5:1 on BOTH white (5.86:1) and steel-50 (5.42:1). Deliberately off the
    // display ramp.
    eyebrow: '#7A6210',
  },
  // Market signals — muted, never louder than the gold.
  signal: {
    up: '#2E7D5B',
    upBright: '#3E9E73',
    down: '#C8503C',
    flat: '#8494AC',
  },
} as const;
