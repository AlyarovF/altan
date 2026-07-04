import { Montserrat } from 'next/font/google';

/**
 * Type system — **Montserrat everywhere** (display, body/UI, and figures).
 *
 * A single geometric sans drives all three roles; hierarchy comes from weight and
 * size, not from switching families. Montserrat ships full Latin **and Cyrillic**,
 * so EN / RU / UZ never fall back to a system font. The three CSS variables
 * (`--font-sans` / `--font-display` / `--font-mono`) are all mapped to Montserrat,
 * so every existing `font-sans` / `font-display` / `font-mono` usage across the app
 * resolves to the same family.
 *
 * (next/font requires each call to use explicit object literals — no shared spread.)
 */

/** Body / UI. */
export const fontSans = Montserrat({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

/** Display / headings — same family, heavier weights applied via utilities. */
export const fontDisplay = Montserrat({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
});

/**
 * Figure / ledger role — HS codes, prices, grades, eyebrows. Montserrat (not a
 * monospaced family); the `font-mono` utility applies tabular + lining numerals
 * (see tailwind.config.ts) so figures align in columns.
 */
export const fontMono = Montserrat({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-mono',
});

export const fontVariables = `${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`;
