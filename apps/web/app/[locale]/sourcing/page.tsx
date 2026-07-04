import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Train, Truck, Ship } from 'lucide-react';
import { INCOTERMS } from '@altan/shared';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { InfoCard } from '@/components/InfoCard';
import { Reveal } from '@/components/Reveal';
import { LogisticsCorridors } from '@/components/motifs/LogisticsCorridors';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'sourcing' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

const MODE_ICONS = [Train, Truck, Ship] as const;

export default async function SourcingPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('sourcing');

  const nodes = [1, 2, 3, 4].map((n) => ({
    label: t(`corridor.n${n}.label`),
    sub: t(`corridor.n${n}.sub`),
  }));
  const legs = [1, 2, 3].map((n) => ({
    mode: t(`corridor.l${n}.mode`),
    note: t(`corridor.l${n}.note`),
  }));

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <section className="surface-ink border-b border-white/10">
        <div className="shell py-20 lg:py-24">
          <SectionHeading tone="dark" title={t('corridor.title')} lede={t('corridor.lede')} />
          <Reveal className="tick rounded-card border border-white/10 bg-white/[0.02] p-6 sm:p-10">
            <LogisticsCorridors nodes={nodes} legs={legs} ariaLabel={t('corridor.title')} />
          </Reveal>
        </div>
      </section>

      <section className="shell py-20 lg:py-24">
        <SectionHeading title={t('modes.title')} lede={t('modes.lede')} />
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n, i) => (
            <InfoCard
              key={n}
              icon={MODE_ICONS[i]}
              delay={i * 70}
              title={t(`modes.i${n}.title`)}
              body={t(`modes.i${n}.body`)}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-steel-200 bg-steel-50">
        <div className="shell py-20 lg:py-24">
          <SectionHeading title={t('incoterms.title')} lede={t('incoterms.lede')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCOTERMS.map((code, i) => (
              <Reveal
                key={code}
                delay={(i % 3) * 60}
                className="tick rounded-card border border-steel-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-lg font-semibold text-amber-deep">{code}</span>
                  <span className="font-display text-base font-medium text-ink">
                    {t(`incoterms.${code}.term`)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-steel-600">
                  {t(`incoterms.${code}.desc`)}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
