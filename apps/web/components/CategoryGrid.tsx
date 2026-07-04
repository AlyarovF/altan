'use client';

import { useTranslations } from 'next-intl';
import { Layers, Drill, Hexagon, Gauge, Boxes, ArrowRight, type LucideIcon } from 'lucide-react';
import type { Category } from '@altan/shared';
import { Link } from '@/i18n/routing';
import { Reveal } from './Reveal';

/** Category slug → icon. Unknown slugs fall back to a neutral crate. */
const ICONS: Record<string, LucideIcon> = {
  'metals-alloys': Layers,
  'carbide-tooling': Drill,
  'technical-ceramics': Hexagon,
  'instruments-equipment': Gauge,
};

/**
 * The "what we trade" grid. Category names come from the API; the short blurb is
 * localized copy keyed by slug (`capabilities.cat.<slug>`) with a graceful blank
 * fallback. Each card routes into the filtered catalog.
 */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const t = useTranslations();
  if (!categories.length) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat, i) => {
        const Icon = ICONS[cat.slug] ?? Boxes;
        const descKey = `capabilities.cat.${cat.slug}`;
        const hasDesc = t.has(descKey as never);
        // Lead card: the first tile is inverted to a dark "desk" plate so the
        // grid has a clear entry point instead of four identical white cards.
        const isLead = i === 0;
        return (
          <Reveal key={cat.id} delay={i * 60}>
            <Link
              href={`/catalog?category=${cat.slug}`}
              className={
                isLead
                  ? 'tick surface-dark group flex h-full flex-col rounded-card border border-white/10 p-6 shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/50'
                  : 'tick group flex h-full flex-col rounded-card border border-steel-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-lift'
              }
            >
              {isLead && (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-ticker text-amber-bright">
                  <span className="h-1.5 w-1.5 rotate-45 bg-amber-bright" aria-hidden />
                  {t('capabilities.leadKicker')}
                </span>
              )}
              <span
                className={
                  isLead
                    ? 'grid h-12 w-12 place-items-center rounded-lg bg-amber text-ink transition-colors'
                    : 'grid h-12 w-12 place-items-center rounded-lg bg-ink text-amber-bright transition-colors'
                }
              >
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3
                className={
                  isLead
                    ? 'mt-5 font-display text-xl font-medium text-white transition-colors group-hover:text-amber-bright'
                    : 'mt-5 font-display text-xl font-medium text-ink transition-colors group-hover:text-amber-deep'
                }
              >
                {cat.name}
              </h3>
              {hasDesc && (
                <p
                  className={
                    isLead
                      ? 'mt-2 flex-1 text-sm leading-relaxed text-steel-300'
                      : 'mt-2 flex-1 text-sm leading-relaxed text-steel-600'
                  }
                >
                  {t(descKey as never)}
                </p>
              )}
              <span
                className={
                  isLead
                    ? 'mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-ticker text-amber-bright'
                    : 'mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-ticker text-steel-500 transition-colors group-hover:text-amber-deep'
                }
              >
                {t('capabilities.explore')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
