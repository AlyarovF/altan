/** Format a min-order quantity (decimal-as-string) + unit, e.g. "1,000 kg". */
export function formatMinOrder(
  qty: string | null | undefined,
  unit: string | null | undefined,
  locale: string,
): string | null {
  if (!qty) return null;
  const n = Number(qty);
  const value = Number.isFinite(n) ? new Intl.NumberFormat(locale).format(n) : qty;
  return unit ? `${value} ${unit}` : value;
}

/** Map a news change direction to a Tailwind text color + signal class. */
export function changeColor(direction: 'UP' | 'DOWN' | 'FLAT'): string {
  switch (direction) {
    case 'UP':
      return 'text-signal-up';
    case 'DOWN':
      return 'text-signal-down';
    default:
      return 'text-signal-flat';
  }
}

/** Map a news outlook to an AntD Tag color. */
export function outlookColor(outlook: 'FIRM' | 'BULLISH' | 'BEARISH' | 'MIXED'): string {
  switch (outlook) {
    case 'BULLISH':
      return 'green';
    case 'BEARISH':
      return 'red';
    case 'FIRM':
      return 'gold';
    default:
      return 'default';
  }
}
