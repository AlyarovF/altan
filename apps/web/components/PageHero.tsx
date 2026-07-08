import type { ReactNode } from 'react';

/**
 * Decorative "assay plate" motif used to balance interior heroes that don't pass
 * their own figure — otherwise the two-column hero leaves ~half the dark band
 * empty. Purely ornamental (aria-hidden) and built from universal tokens
 * (incoterms, element symbols, coordinates) so it needs no translation.
 */
function HeroPlate() {
  return (
    <div
      className="tick relative hidden w-full max-w-md rounded-card border border-white/10 bg-white/[0.03] p-6 shadow-lift backdrop-blur-sm lg:block"
      aria-hidden
    >
      <div className="rounded-[10px] bg-ink-900/60 p-5 ring-1 ring-inset ring-white/5">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-ticker text-steel-400">
          <span>Assay / Origin</span>
          <span className="text-amber-bright">CIS · CA</span>
        </div>

        <svg viewBox="0 0 320 150" className="mt-4 h-auto w-full" role="presentation">
          {/* Blueprint grid */}
          <defs>
            <pattern id="hp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="rgba(140,150,164,0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="320" height="150" fill="url(#hp-grid)" />
          {/* Corridor arc: origin → transit → market */}
          <path
            d="M 30 116 C 110 60, 210 60, 290 34"
            fill="none"
            stroke="#C8881C"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
          />
          {[
            [30, 116],
            [160, 80],
            [290, 34],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="7" fill="#0C0F14" stroke="#E9A227" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="2.4" fill="#E9A227" />
            </g>
          ))}
        </svg>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center font-mono">
          {[
            ['REE', 'La·Ce·Nd'],
            ['Purity', '≥ 99.9%'],
            ['Assay', 'CoA·CoO'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase tracking-ticker text-steel-500">{k}</dt>
              <dd className="mt-1 text-sm font-semibold text-amber-bright">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/**
 * Shared hero for interior/marketing pages. Keeps every page on the same dark
 * graphite key with the ledger eyebrow, a serif headline and an optional figure
 * slot (map, stat rail, element board). When no figure is supplied it falls back
 * to a decorative plate so the hero stays balanced instead of a half-empty band.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  figure,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
  figure?: ReactNode;
}) {
  const aside = figure ?? <HeroPlate />;

  return (
    <section className="surface-dark relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint opacity-30"
        style={{ backgroundSize: '48px 48px' }}
        aria-hidden
      />
      <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="min-w-0 max-w-2xl animate-fade-up">
          <p className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-amber" aria-hidden />
            <span className="eyebrow-light">{eyebrow}</span>
          </p>
          <h1 className="mt-5 font-display text-display-md font-medium text-white">{title}</h1>
          {lede && <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-300">{lede}</p>}
          {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        <div className="animate-fade-up lg:justify-self-end">{aside}</div>
      </div>
    </section>
  );
}
