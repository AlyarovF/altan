import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { INCOTERMS } from '@altan/shared';
import { PageHero } from '@/components/PageHero';
import { Reveal } from '@/components/Reveal';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'incoterms' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

/** Incoterms reference — how ALTAN quotes and delivers, one card per term. */
export default async function IncotermsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('incoterms');

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <section className="shell py-20 lg:py-24">
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
                  {t(`${code}.term`)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">{t(`${code}.desc`)}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
