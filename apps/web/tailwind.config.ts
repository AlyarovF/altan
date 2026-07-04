import type { Config } from 'tailwindcss';
import { palette } from './lib/tokens';

/**
 * ALTAN public site — Tailwind design tokens.
 *
 * Design language: "commodity trading desk / assay certificate." A disciplined
 * graphite-ink canvas, a single molten-brass accent, cool-steel neutrals, and a
 * ledger-like use of tabular figures (Montserrat everywhere; the figure role just
 * enables tabular/lining numerals). Everything below is the single source of
 * truth for layout/utility styling and is kept in sync with the Ant Design
 * `ConfigProvider` theme (see `lib/theme.ts`) so components and layout agree.
 *
 * Coexistence with Ant Design v5: Tailwind's `preflight` is DISABLED so its reset
 * does not fight antd's own reset; a small scoped base layer lives in globals.css.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Brand palette lives in `lib/tokens.ts` (shared with the antd theme in
      // `lib/theme.ts`) so utility and component layers can't drift.
      // - ink: graphite near-black canvas for dark surfaces.
      // - steel: cool neutrals for borders/surfaces/muted text.
      // - amber: the single molten-brass accent, used with restraint.
      // - signal.upBright: brighter green reserved for small text on dark surfaces
      //   (5.8:1 on ink vs. `up`'s 3.84:1); do not use on light surfaces.
      colors: {
        ink: palette.ink,
        steel: palette.steel,
        amber: palette.amber,
        signal: palette.signal,
      },
      fontFamily: {
        // Montserrat everywhere — hierarchy comes from weight/size, not family.
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        // Figure / ledger role: Montserrat with tabular + lining numerals so HS
        // codes, prices, grades and stat rails align in columns. Not monospaced.
        mono: [
          ['var(--font-mono)', 'system-ui', 'sans-serif'],
          { fontFeatureSettings: '"tnum", "lnum"' },
        ],
      },
      fontSize: {
        // Fluid display sizes for the hero + page heroes.
        'display-lg': [
          'clamp(2.6rem, 5.2vw, 4.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.02em' },
        ],
        'display-md': [
          'clamp(2.1rem, 3.6vw, 3.25rem)',
          { lineHeight: '1.05', letterSpacing: '-0.018em' },
        ],
      },
      letterSpacing: {
        eyebrow: '0.2em',
        ticker: '0.14em',
      },
      maxWidth: {
        shell: '1220px',
        prose: '68ch',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        // Soft, low-contrast elevation — industrial, not glossy.
        card: '0 1px 2px rgba(12,15,20,0.04), 0 10px 30px -18px rgba(12,15,20,0.20)',
        lift: '0 20px 50px -24px rgba(12,15,20,0.32)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(140,150,164,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(140,150,164,0.10) 1px, transparent 1px)',
        'grid-blueprint':
          'linear-gradient(to right, rgba(233,162,39,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(233,162,39,0.06) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
