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
  // Graphite ink — cool near-black canvas for dark surfaces.
  ink: {
    DEFAULT: '#0C0F14',
    900: '#0C0F14',
    800: '#12161C',
    700: '#191E26',
    600: '#232A34',
    soft: '#191E26',
    muted: '#3A424E',
  },
  // Cool-steel neutrals — borders, surfaces, muted text.
  steel: {
    50: '#F5F6F8',
    100: '#ECEEF1',
    200: '#DEE2E7',
    300: '#C1C8D1',
    400: '#8C96A4',
    500: '#5E6876',
    600: '#454E5A',
    700: '#333A44',
    800: '#232A34',
    900: '#12161C',
  },
  // Molten-brass accent — the single brand color, used with restraint.
  amber: {
    DEFAULT: '#C8881C',
    bright: '#E9A227',
    deep: '#9A6A00',
    tint: '#F3E7CE',
    // AA-safe eyebrow brass: deeper than `deep` so the tracked 11px eyebrow clears
    // 4.5:1 on BOTH white and steel-50. Deliberately off the display ramp.
    eyebrow: '#8A5E00',
  },
  // Market signals — muted, never louder than the brass.
  signal: {
    up: '#2E7D5B',
    upBright: '#3E9E73',
    down: '#C8503C',
    flat: '#8C96A4',
  },
} as const;
