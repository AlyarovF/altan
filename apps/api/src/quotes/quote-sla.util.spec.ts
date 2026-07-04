import { SLA_QUOTE_RESPONSE_HOURS } from '@altan/shared';
import {
  computeSlaDueAt,
  formatQuoteRef,
  isOverdue,
  isSlaMet,
  quoteRefPrefix,
} from './quote-sla.util';

describe('quote-sla.util', () => {
  describe('formatQuoteRef', () => {
    it('formats ALT-<year>-<6-digit zero-padded>', () => {
      expect(formatQuoteRef(2026, 1)).toBe('ALT-2026-000001');
      expect(formatQuoteRef(2026, 123)).toBe('ALT-2026-000123');
      expect(formatQuoteRef(2026, 1_000_000)).toBe('ALT-2026-1000000');
    });

    it('prefix matches the ref start', () => {
      expect(quoteRefPrefix(2026)).toBe('ALT-2026-');
      expect(formatQuoteRef(2026, 7).startsWith(quoteRefPrefix(2026))).toBe(true);
    });
  });

  describe('computeSlaDueAt', () => {
    it('adds exactly the SLA window (12h) to createdAt', () => {
      const created = new Date('2026-06-20T10:00:00.000Z');
      const due = computeSlaDueAt(created);
      expect(due.getTime() - created.getTime()).toBe(SLA_QUOTE_RESPONSE_HOURS * 3_600_000);
      expect(due.toISOString()).toBe('2026-06-20T22:00:00.000Z');
    });
  });

  describe('isSlaMet', () => {
    const due = new Date('2026-06-20T22:00:00.000Z');

    it('true when responded before due', () => {
      expect(isSlaMet(new Date('2026-06-20T21:59:59.000Z'), due)).toBe(true);
    });
    it('true at the exact boundary', () => {
      expect(isSlaMet(new Date('2026-06-20T22:00:00.000Z'), due)).toBe(true);
    });
    it('false when responded after due', () => {
      expect(isSlaMet(new Date('2026-06-20T22:00:01.000Z'), due)).toBe(false);
    });
    it('false when not responded or no due', () => {
      expect(isSlaMet(null, due)).toBe(false);
      expect(isSlaMet(new Date(), null)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    const due = new Date('2026-06-20T22:00:00.000Z');

    it('true when now past due and unanswered', () => {
      expect(isOverdue(new Date('2026-06-20T22:00:01.000Z'), due, null)).toBe(true);
    });
    it('false at/just before due', () => {
      expect(isOverdue(new Date('2026-06-20T22:00:00.000Z'), due, null)).toBe(false);
      expect(isOverdue(new Date('2026-06-20T21:00:00.000Z'), due, null)).toBe(false);
    });
    it('false once responded, even if late', () => {
      expect(isOverdue(new Date('2026-06-21T00:00:00.000Z'), due, new Date())).toBe(false);
    });
    it('false when no due date', () => {
      expect(isOverdue(new Date(), null, null)).toBe(false);
    });
  });
});
