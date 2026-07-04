import { SLA_QUOTE_RESPONSE_HOURS } from '@altan/shared';

const MS_PER_HOUR = 3_600_000;

/** SLA due timestamp = createdAt + SLA_QUOTE_RESPONSE_HOURS (12h). Pure, DB-free. */
export function computeSlaDueAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + SLA_QUOTE_RESPONSE_HOURS * MS_PER_HOUR);
}

/**
 * Was the SLA met? True when the quote was responded to at/before the due time.
 * Returns false if not yet responded or if there is no due time.
 */
export function isSlaMet(
  respondedAt: Date | null | undefined,
  slaDueAt: Date | null | undefined,
): boolean {
  if (!respondedAt || !slaDueAt) return false;
  return respondedAt.getTime() <= slaDueAt.getTime();
}

/**
 * Is the quote currently overdue? True when it has a due time in the past AND has not
 * been responded to yet. A responded quote is never "overdue" (use isSlaMet for that).
 */
export function isOverdue(
  now: Date,
  slaDueAt: Date | null | undefined,
  respondedAt: Date | null | undefined,
): boolean {
  if (respondedAt) return false;
  if (!slaDueAt) return false;
  return now.getTime() > slaDueAt.getTime();
}

/** Build the year-scoped ref string from a year and a monotonic counter. */
export function formatQuoteRef(year: number, counter: number): string {
  return `ALT-${year}-${String(counter).padStart(6, '0')}`;
}

/** Ref prefix for a given year (used to count existing rows for the counter). */
export function quoteRefPrefix(year: number): string {
  return `ALT-${year}-`;
}
