import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BadgeCheck,
  FlaskConical,
  FileText,
  Globe2,
  ShieldCheck,
  Scale,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { InfoCard } from '@/components/InfoCard';
import { Reveal } from '@/components/Reveal';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'quality' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

const ASSURANCE_ICONS = [BadgeCheck, FlaskConical, FileText, Globe2] as const;
const COMPLIANCE_ICONS: LucideIcon[] = [ShieldCheck, Scale, History];

export default async function QualityPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('quality');

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <section className="shell py-20 lg:py-24">
        <SectionHeading title={t('assurance.title')} lede={t('assurance.lede')} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n, i) => (
            <InfoCard
              key={n}
              icon={ASSURANCE_ICONS[i]}
              delay={i * 60}
              title={t(`assurance.i${n}.title`)}
              body={t(`assurance.i${n}.body`)}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-steel-200 bg-steel-50">
        <div className="shell py-20 lg:py-24">
          <SectionHeading title={t('docs.title')} lede={t('docs.lede')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <InfoCard
                key={n}
                index={n}
                delay={(i % 3) * 60}
                title={t(`docs.i${n}.title`)}
                body={t(`docs.i${n}.body`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="surface-dark border-t border-white/10">
        <div className="shell py-20 lg:py-24">
          <SectionHeading tone="dark" title={t('compliance.title')} lede={t('compliance.lede')} />
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n, i) => {
              const Icon = COMPLIANCE_ICONS[i]!;
              return (
                <Reveal
                  key={n}
                  delay={i * 70}
                  className="tick rounded-card border border-white/10 bg-white/[0.03] p-6"
                >
                  <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-white/5 text-amber-bright ring-1 ring-inset ring-white/10">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-display text-lg font-medium text-white">
                    {t(`compliance.i${n}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-300">
                    {t(`compliance.i${n}.body`)}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
