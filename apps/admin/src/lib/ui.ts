/**
 * Enlarges a dense `size="small"` row-action button's touch target to ~44x44px
 * (WCAG 2.5.5 / touch guidance) without changing its visual size: a transparent
 * `::before` overlay extends the clickable area beyond the 24px button. Pair with
 * a `size="middle"` Space so adjacent targets don't overlap.
 */
export const ROW_ACTION_HIT = "relative before:absolute before:-inset-[10px] before:content-['']";
