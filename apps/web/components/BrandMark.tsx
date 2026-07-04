/**
 * ALTAN brand mark — a faceted mineral/crystal glyph in brass on graphite,
 * nodding to mined raw materials. Inline SVG (CSP-safe, crisp at any size).
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-[7px] bg-ink-800 ring-1 ring-inset ring-white/10"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="none">
        <path d="M12 2 L21 8 L17.5 21 H6.5 L3 8 Z" fill="#E9A227" opacity="0.16" />
        <path d="M12 2 L21 8 L12 11 Z" fill="#E9A227" />
        <path d="M12 2 L3 8 L12 11 Z" fill="#C8881C" />
        <path d="M3 8 L12 11 L6.5 21 Z" fill="#9A6A00" />
        <path d="M21 8 L12 11 L17.5 21 Z" fill="#B87A14" />
        <path d="M6.5 21 L12 11 L17.5 21 Z" fill="#E9A227" />
      </svg>
    </span>
  );
}
