/**
 * ALTAN brand identity assets.
 *
 * `BrandMark` — the letter-A mark from the official identity: two angled stroke
 * legs with a gold horizontal crossbar that extends slightly past them. As
 * before, the mark carries its own navy tile so the white legs and gold bar
 * read identically on any surface (dark header, dark footer, light pages).
 *
 * `BrandWordmark` — the two-line logotype (serif letter-spaced "ALTAN" over a
 * gold "CRITICAL RAW MATERIALS" sub-line). The strings are brand constants,
 * not i18n copy — a logotype is never translated. Both are decorative
 * (`aria-hidden`); accessible names stay on the surrounding link/landmark via
 * `companyName`.
 */

/** Brand constants — logotype text, deliberately not translated. */
export const BRAND_WORDMARK = 'ALTAN';
export const BRAND_TAGLINE = 'CRITICAL RAW MATERIALS';

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-[7px] bg-ink-800 ring-1 ring-inset ring-white/10"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.66}
        height={size * 0.66}
        viewBox="0 0 24 24"
        fill="none"
        role="presentation"
      >
        {/* Legs of the A — white strokes, apex at top center. */}
        <path
          d="M5.8 20.5 L12 3.6 L18.2 20.5"
          stroke="#FFFFFF"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Gold crossbar — overhangs the legs slightly, per the identity. */}
        <path
          d="M6.4 14.7 H17.6"
          stroke="var(--amber, #C9A227)"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/**
 * Two-line logotype for dark surfaces (header, footer, mobile drawer). Serif
 * wordmark in white, tracked wide; gold sub-line beneath.
 */
export function BrandWordmark() {
  return (
    <span aria-hidden className="flex min-w-0 flex-col">
      <span className="whitespace-nowrap font-display text-[17px] font-medium uppercase leading-none tracking-[0.18em] text-white">
        {BRAND_WORDMARK}
      </span>
      <span className="mt-[5px] whitespace-nowrap font-sans text-[9px] font-medium uppercase leading-none tracking-[0.3em] text-amber-bright">
        {BRAND_TAGLINE}
      </span>
    </span>
  );
}
