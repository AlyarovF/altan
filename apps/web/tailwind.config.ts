import type { Config } from 'tailwindcss';
import { palette } from './lib/tokens';

/**
 * ALTAN public site — Tailwind design tokens.
 *
 * Design language: "commodity trading desk / assay certificate." A disciplined
 * deep-navy canvas, a single gold accent, blue-grey neutrals, a serif display
 * face (Playfair Display) over Montserrat body/UI, and a ledger-like use of
 * tabular figures. Everything below is the single source of
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
      // - ink: deep-navy canvas for dark surfaces.
      // - steel: blue-grey neutrals for borders/surfaces/muted text.
      // - amber: the single gold accent, used with restraint.
      // - signal.upBright: brighter green reserved for small text on dark surfaces
      //   (5.8:1 on ink vs. `up`'s 3.84:1); do not use on light surfaces.
      colors: {
        ink: palette.ink,
        steel: palette.steel,
        amber: palette.amber,
        signal: palette.signal,
      },
      fontFamily: {
        // Montserrat for body/UI; the display role is the brand serif.
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        // Figure / ledger role: Montserrat with tabular + lining numerals so HS
        // codes, prices, grades and stat rails align in columns. Not monospaced.
        mono: [
          ['var(--font-mono)', 'system-ui', 'sans-serif'],
          { fontFeatureSettings: '"tnum", "lnum"' },
        ],
      },
      fontSize: {
        // Fluid display sizes for the hero + page heroes. Zero tracking — the
        // serif display face carries its own fit (the old negative tracking was
        // tuned for the geometric sans).
        'display-lg': ['clamp(2.6rem, 5.2vw, 4.5rem)', { lineHeight: '1.06', letterSpacing: '0' }],
        'display-md': ['clamp(2.1rem, 3.6vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '0' }],
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
        // Soft, low-contrast elevation — industrial, not glossy. Shadow color is
        // the navy ink (16,26,48 = #101A30) so elevation stays on-palette.
        card: '0 1px 2px rgba(16,26,48,0.04), 0 10px 30px -18px rgba(16,26,48,0.20)',
        lift: '0 20px 50px -24px rgba(16,26,48,0.32)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        // 132,148,172 = steel-400 #8494AC; 227,190,76 = amber.bright #E3BE4C.
        'grid-faint':
          'linear-gradient(to right, rgba(132,148,172,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(132,148,172,0.10) 1px, transparent 1px)',
        'grid-blueprint':
          'linear-gradient(to right, rgba(227,190,76,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,190,76,0.06) 1px, transparent 1px)',
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
