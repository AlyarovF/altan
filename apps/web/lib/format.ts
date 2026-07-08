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

/**
 * Format an indicative price (decimal-as-string) + ISO currency + unit,
 * e.g. "33,500 USD / MT". The currency code trails the number — consistent with
 * the min-order tone ("1,000 kg") and unambiguous across USD/EUR/CNY/RUB/UZS —
 * so we format via `formatToParts` and re-append the code ourselves regardless
 * of where the locale would place it. Returns null when amount or currency is
 * missing (caller renders "Price on request").
 */
export function formatPrice(
  amount: string | null | undefined,
  currency: string | null | undefined,
  unit: string | null | undefined,
  locale: string,
): string | null {
  if (!amount || !currency) return null;
  const n = Number(amount);
  let value = `${amount} ${currency}`;
  if (Number.isFinite(n)) {
    try {
      // style:'currency' validates the ISO code (throws RangeError on unknown
      // codes) and applies currency digit rules; the API trims trailing zeros
      // ("54", not "54.00"), so keep minimumFractionDigits at 0.
      const parts = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).formatToParts(n);
      const number = parts
        .filter((part) => part.type !== 'currency')
        .map((part) => part.value)
        .join('')
        .trim();
      value = `${number} ${currency}`;
    } catch {
      // Unknown/invalid currency code — fall back to the raw "amount CODE" form.
    }
  }
  return unit ? `${value} / ${unit}` : value;
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
