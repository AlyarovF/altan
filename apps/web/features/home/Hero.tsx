'use client';

import { useTranslations } from 'next-intl';
import { Button } from 'antd';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { ProductCard, SiteStat } from '@altan/shared';
import { Link } from '@/i18n/routing';
import { useQuoteModal } from '@/features/quote/QuoteModalContext';
import { ElementTile } from '@/components/ElementTile';
import { formatMinOrder } from '@/lib/format';
import { purityFromGrade } from '@/lib/materials';

/**
 * Home hero — the thesis: a trading desk for critical materials. The headline
 * states the value proposition; the right rail renders live featured materials
 * as a "materials desk" board (element tile + grade + region), which is the most
 * characteristic thing in this business and doubles as a real entry point.
 */
export function Hero({
  tagline,
  tag,
  heroStats,
  featured,
  locale,
}: {
  tagline: string;
  tag: string;
  heroStats: SiteStat[];
  featured: ProductCard[];
  locale: string;
}) {
  const t = useTranslations('common');
  const th = useTranslations('home');
  const { openQuote } = useQuoteModal();

  return (
    <section className="surface-dark relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-blueprint opacity-70"
        style={{ backgroundSize: '46px 46px' }}
        aria-hidden
      />
      <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
        {/* Left — value proposition. min-w-0 lets this grid track shrink below its
            content's intrinsic width so long admin-authored (CMS) eyebrow/tagline
            copy wraps instead of forcing horizontal page overflow on mobile. */}
        <div className="min-w-0 max-w-2xl">
          <p className="flex items-center gap-2.5 animate-fade-up">
            <span className="h-px w-6 bg-amber" aria-hidden />
            <span className="eyebrow-light">{tag}</span>
          </p>
          <h1
            className="mt-6 font-display text-display-lg font-medium text-white animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            {tagline}
          </h1>
          <div
            className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <Button type="primary" size="large" onClick={() => openQuote()}>
              {t('requestQuote')}
            </Button>
            <Link href="/capabilities">
              <Button
                size="large"
                ghost
                className="!border-white/25 !text-white hover:!border-amber-bright hover:!text-amber-bright"
              >
                <span className="inline-flex items-center gap-1.5">
                  {th('heroSecondary')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>

          {heroStats.length > 0 && (
            <dl
              className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6 animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >
              {heroStats.map((stat) => (
                <div key={stat.id}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-mono text-2xl font-semibold text-amber-bright">
                    {stat.value}
                  </dd>
                  <dd className="mt-0.5 text-xs uppercase tracking-ticker text-steel-400">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Right — the materials desk */}
        {featured.length > 0 && (
          <div
            className="tick min-w-0 rounded-card border border-white/10 bg-white/[0.03] p-1.5 shadow-lift backdrop-blur-sm animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            <div className="rounded-[10px] bg-ink-900/60 ring-1 ring-inset ring-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="font-mono text-[11px] uppercase tracking-ticker text-steel-300">
                  {th('deskTitle')}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-ticker text-signal-upBright">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-upBright" aria-hidden />
                  {th('deskLive')}
                </span>
              </div>

              <ul className="divide-y divide-white/[0.06]">
                {featured.slice(0, 4).map((p) => {
                  const purity = purityFromGrade(p.grade);
                  const minOrder = formatMinOrder(p.minOrderQty, p.minOrderUnit, locale);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/catalog/${p.slug}`}
                        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
                      >
                        <ElementTile name={p.name} grade={p.grade} size="sm" tone="plate" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-white">
                              {p.name}
                            </span>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-steel-500 transition-colors group-hover:text-amber-bright" />
                          </div>
                          <div className="mt-0.5 truncate font-mono text-xs text-steel-400">
                            {p.region.name}
                            {minOrder ? ` · ${th('deskMoq')} ${minOrder}` : ''}
                          </div>
                        </div>
                        {purity && (
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold text-amber-bright">
                              {purity}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                              {th('deskPurity')}
                            </div>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-white/10 px-4 py-3">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-ticker text-steel-300 transition-colors hover:text-amber-bright"
                >
                  {th('deskViewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
