import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SLA_QUOTE_RESPONSE_HOURS } from '@altan/shared';

dayjs.extend(relativeTime);

export { dayjs };

export function formatDate(value?: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—';
}

export function formatDateShort(value?: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

export type SlaState = 'met' | 'overdue' | 'due' | 'none';

export interface SlaInfo {
  state: SlaState;
  /** Human label, e.g. "due in 3h" / "overdue 5h" / "met". */
  label: string;
  dueAt?: string | null;
}

/**
 * Derive SLA presentation from a quote's server fields. The server already
 * computes `overdue`/`slaMet`; we layer the time-to-due label on top.
 */
export function slaInfo(q: {
  slaDueAt?: string | null;
  respondedAt?: string | null;
  overdue?: boolean;
  slaMet?: boolean;
}): SlaInfo {
  if (q.respondedAt) {
    return {
      state: q.slaMet ? 'met' : 'overdue',
      label: q.slaMet ? 'Met' : 'Missed',
      dueAt: q.slaDueAt,
    };
  }
  if (!q.slaDueAt) return { state: 'none', label: '—' };
  const due = dayjs(q.slaDueAt);
  if (q.overdue || due.isBefore(dayjs())) {
    return { state: 'overdue', label: `Overdue ${dayjs().to(due, true)}`, dueAt: q.slaDueAt };
  }
  return { state: 'due', label: `Due ${due.fromNow()}`, dueAt: q.slaDueAt };
}

export const SLA_HOURS = SLA_QUOTE_RESPONSE_HOURS;

/** Slugify a name for the slug field (lowercase, dash-separated, ascii). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build a CSV string and trigger a browser download. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    const blob = new Blob([''], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
    return;
  }
  const headers = Object.keys(rows[0] as Record<string, unknown>);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Trigger a JSON download (used by the translations export). */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}
