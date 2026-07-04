import { ChangeDirection, Outlook } from '@altan/shared';
import { formatDateShort } from '@/lib/format';
import type { NewsFormValues } from './schema';

/** Outlook → brand/semantic Tailwind class (no raw hexes; mirrors signal.* tokens). */
const OUTLOOK_BG: Record<Outlook, string> = {
  [Outlook.FIRM]: 'bg-signal-up',
  [Outlook.BULLISH]: 'bg-signal-up',
  [Outlook.BEARISH]: 'bg-signal-down',
  [Outlook.MIXED]: 'bg-amber',
};

const DIRECTION: Record<ChangeDirection, { sign: string; className: string }> = {
  [ChangeDirection.UP]: { sign: '▲', className: 'text-signal-up' },
  [ChangeDirection.DOWN]: { sign: '▼', className: 'text-signal-down' },
  [ChangeDirection.FLAT]: { sign: '▬', className: 'text-signal-flat' },
};

/** Mirrors the public Market Intelligence card so editors see the live result. */
export function NewsCardPreview({ values }: { values: NewsFormValues }) {
  const dir = DIRECTION[values.changeDirection];
  return (
    <div className="rounded-lg border border-steel-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-steel-500">
          {values.commodity || 'Commodity'}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-semibold text-white ${OUTLOOK_BG[values.outlook]}`}
        >
          {values.outlook}
        </span>
      </div>
      <h3 className="mb-1 text-base font-semibold text-ink">{values.title || 'Article title'}</h3>
      {values.summary ? <p className="mb-3 text-sm text-steel-600">{values.summary}</p> : null}
      <div className="flex items-center gap-3">
        {values.priceLabel ? (
          <span className="text-lg font-bold text-ink">{values.priceLabel}</span>
        ) : null}
        {values.changeLabel ? (
          <span className={`text-sm font-semibold ${dir.className}`}>
            {dir.sign} {values.changeLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-xs text-steel-500">
        {values.publishedAt ? formatDateShort(values.publishedAt) : 'Unpublished'} · {values.status}
      </div>
    </div>
  );
}
