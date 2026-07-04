import type { Badge } from '@altan/shared';

/** Fallback presentation for the two known badge codes (matches the seeded /badges). */
const FALLBACK: Record<string, { emoji: string; label: string; color: string }> = {
  HOT: { emoji: '🔥', label: 'Hot', color: '#E8543F' },
  NEW: { emoji: '✨', label: 'NEW', color: '#2E7D5B' },
};

/** Render a product's badges as compact pills. `badgeMeta` enriches from /badges when available. */
export function ProductBadges({
  codes,
  badgeMeta,
  size = 'sm',
}: {
  codes: string[];
  badgeMeta?: Badge[];
  size?: 'sm' | 'md';
}) {
  if (!codes?.length) return null;
  const byCode = new Map((badgeMeta ?? []).map((b) => [b.code, b]));

  return (
    <div className="flex flex-wrap gap-1.5">
      {codes.map((code) => {
        const meta = byCode.get(code as Badge['code']) ?? FALLBACK[code];
        if (!meta) return null;
        return (
          <span
            key={code}
            className={`inline-flex items-center gap-1 rounded-full border font-semibold leading-none ${
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
            }`}
            style={{
              color: meta.color,
              borderColor: `${meta.color}33`,
              backgroundColor: `${meta.color}12`,
            }}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}
