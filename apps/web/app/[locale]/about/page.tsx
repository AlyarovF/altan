import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchStats } from '@/lib/api/content';
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
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const stats = await fetchStats(locale);
  const rail = [...(stats?.HERO ?? []), ...(stats?.PROCESS_BAR ?? [])].slice(0, 4);
  const principles = [1, 2, 3, 4] as const;

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <section className="shell py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
          <Reveal>
            <h2 className="font-display text-3xl font-medium text-ink sm:text-[2.25rem]">
              {t('story.title')}
            </h2>
            <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-steel-600">
              <p>{t('story.p1')}</p>
              <p>{t('story.p2')}</p>
              <p>{t('story.p3')}</p>
            </div>
          </Reveal>

          {rail.length > 0 && (
            <Reveal delay={80} className="lg:pt-2">
              <dl className="tick overflow-hidden rounded-card border border-steel-200 bg-steel-50 shadow-card">
                {rail.map((stat, i) => (
                  <div
                    key={stat.id}
                    className={`flex items-baseline justify-between gap-4 px-6 py-5 ${
                      i > 0 ? 'border-t border-steel-200' : ''
                    }`}
                  >
                    <dt className="font-mono text-[11px] uppercase tracking-ticker text-steel-500">
                      {stat.label}
                    </dt>
                    <dd className="font-mono text-2xl font-semibold text-ink">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </section>

      <section className="border-t border-steel-200 bg-steel-50">
        <div className="shell py-20 lg:py-24">
          <SectionHeading title={t('principles.title')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((n, i) => (
              <InfoCard
                key={n}
                index={n}
                delay={i * 60}
                title={t(`principles.i${n}.title`)}
                body={t(`principles.i${n}.body`)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
