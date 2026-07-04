import { QuoteStatus } from '@altan/shared';

/**
 * Brand color tokens mirrored from `tailwind.config.ts` for the (few) places
 * that need a raw hex — AntD `valueStyle`, chart palettes — instead of a class.
 * Keep in sync with the Tailwind theme so the two systems agree.
 */
export const BRAND = {
  ink: '#0C0F14',
  amber: '#C8881C',
  amberBright: '#E9A227',
  amberDeep: '#9A6A00',
  signalUp: '#2E7D5B',
  signalDown: '#E8543F',
  signalFlat: '#8C96A4',
  steel400: '#8C96A4',
  steel500: '#5E6876',
} as const;

/**
 * One canonical Quote status → AntD Tag preset color map so NEW/IN_REVIEW/QUOTED
 * and the terminal states are scannable at a glance (previously all rendered gray).
 * Uses AntD preset color names so the tags stay theme-aware.
 */
const QUOTE_STATUS_TAG: Record<QuoteStatus, string> = {
  [QuoteStatus.NEW]: 'gold', // brand amber — needs triage
  [QuoteStatus.IN_REVIEW]: 'blue', // in progress
  [QuoteStatus.QUOTED]: 'cyan', // responded, awaiting buyer
  [QuoteStatus.WON]: 'green', // success
  [QuoteStatus.LOST]: 'red', // lost
  [QuoteStatus.CLOSED]: 'default', // done / neutral
};

export function quoteStatusColor(status: QuoteStatus | string): string {
  return QUOTE_STATUS_TAG[status as QuoteStatus] ?? 'default';
}

/**
 * Donut palette for "Quotes by status" — brand amber gradient for the active
 * pipeline (NEW → IN_REVIEW → QUOTED) plus semantic signal tones for the
 * terminal states. Pinned by `domain` so each status keeps its color even when
 * some statuses have zero quotes and are filtered out of the series.
 */
export const QUOTE_STATUS_CHART: { domain: QuoteStatus[]; range: string[] } = {
  domain: [
    QuoteStatus.NEW,
    QuoteStatus.IN_REVIEW,
    QuoteStatus.QUOTED,
    QuoteStatus.WON,
    QuoteStatus.LOST,
    QuoteStatus.CLOSED,
  ],
  range: [
    BRAND.amber,
    BRAND.amberDeep,
    BRAND.amberBright,
    BRAND.signalUp,
    BRAND.signalDown,
    BRAND.steel400,
  ],
};
