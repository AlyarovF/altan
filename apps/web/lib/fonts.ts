import { Montserrat, Playfair_Display } from 'next/font/google';

/**
 * Type system — **Playfair Display (display) over Montserrat (body/UI/figures)**.
 *
 * The display role carries the brand's serif identity (the letter-spaced ALTAN
 * wordmark); body, UI and the figure/ledger role stay on the geometric sans so
 * dense trading copy remains crisp. Both families ship full Latin **and
 * Cyrillic**, so EN / RU / UZ never fall back to a system font. The three CSS
 * variables (`--font-sans` / `--font-display` / `--font-mono`) map every
 * existing `font-sans` / `font-display` / `font-mono` usage across the app.
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

/** Display / headings — the brand serif. Headings use `font-medium` (500);
 *  600/700 cover emphasis and the wordmark. */
export const fontDisplay = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['500', '600', '700'],
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
