'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { LogisticsCorridors } from '@/components/motifs/LogisticsCorridors';

/**
 * Coverage teaser — Central Asia is landlocked, so the corridor itself is the
 * story. Renders the multimodal schematic and routes on to the sourcing page.
 */
export function Coverage() {
  const t = useTranslations('home');
  const ts = useTranslations('sourcing');

  const nodes = [1, 2, 3, 4].map((n) => ({
    label: ts(`corridor.n${n}.label`),
    sub: ts(`corridor.n${n}.sub`),
  }));
  const legs = [1, 2, 3].map((n) => ({
    mode: ts(`corridor.l${n}.mode`),
    note: ts(`corridor.l${n}.note`),
  }));

  return (
    <section className="surface-ink border-y border-white/10">
      <div className="shell py-20 lg:py-24">
        <SectionHeading
          tone="dark"
          title={t('coverageHeading')}
          lede={t('coverageSubheading')}
          trailing={
            <Link href="/sourcing">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-ticker text-amber-bright transition-colors hover:text-white">
                {t('coverageCta')}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          }
        />
        <Reveal className="tick rounded-card border border-white/10 bg-white/[0.02] p-6 sm:p-10">
          <LogisticsCorridors nodes={nodes} legs={legs} ariaLabel={t('coverageHeading')} />
        </Reveal>
      </div>
    </section>
  );
}
