import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, Phone, MapPin, Clock, Check, Globe } from 'lucide-react';
import { fetchSiteContent } from '@/lib/api/content';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { QuoteButton } from '@/components/QuoteButton';
import { Reveal } from '@/components/Reveal';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const tc = await getTranslations('common');
  const content = await fetchSiteContent(locale);
  const footer = content?.footer;

  const checklist = [1, 2, 3, 4].map((n) => t(`rfq.c${n}`));
  const desks = [1, 2, 3].map((n) => ({
    region: t(`coverage.d${n}.region`),
    note: t(`coverage.d${n}.note`),
  }));
  const details = [
    footer?.email && {
      icon: Mail,
      label: t('details.emailLabel'),
      value: footer.email,
      href: `mailto:${footer.email}`,
    },
    footer?.phone && {
      icon: Phone,
      label: t('details.phoneLabel'),
      value: footer.phone,
      href: `tel:${footer.phone.replace(/\s/g, '')}`,
    },
    footer?.address && { icon: MapPin, label: t('details.addressLabel'), value: footer.address },
    { icon: Clock, label: t('details.slaLabel'), value: t('details.sla') },
  ].filter(Boolean) as Array<{ icon: typeof Mail; label: string; value: string; href?: string }>;

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <section className="shell py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* RFQ card */}
          <Reveal className="tick flex flex-col rounded-card border border-steel-200 bg-white p-8 shadow-card">
            <h2 className="font-display text-2xl font-medium text-ink">{t('rfq.title')}</h2>
            <p className="mt-3 text-[17px] leading-relaxed text-steel-600">{t('rfq.body')}</p>
            <div className="mt-6">
              <QuoteButton type="primary" size="large" label={tc('requestQuote')} />
            </div>
            <p className="mt-3 text-sm text-steel-500">{t('rfq.note')}</p>

            <div className="mt-8 border-t border-steel-100 pt-6">
              <p className="font-mono text-[11px] uppercase tracking-ticker text-steel-500">
                {t('rfq.checklistTitle')}
              </p>
              <ul className="mt-4 space-y-2.5">
                {checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-steel-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-up" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Contact details */}
          <Reveal delay={80} className="rounded-card border border-steel-200 bg-steel-50 p-8">
            <h2 className="font-display text-2xl font-medium text-ink">{t('details.title')}</h2>

            <ul className="mt-8 space-y-6">
              {details.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-amber-bright">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-ticker text-steel-500">
                      {label}
                    </div>
                    {href ? (
                      <a
                        href={href}
                        className="mt-0.5 block text-lg font-medium text-ink link-underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <div className="mt-0.5 text-lg font-medium text-ink">{value}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-steel-200 bg-steel-50">
        <div className="shell py-20 lg:py-24">
          <SectionHeading title={t('coverage.title')} lede={t('coverage.lede')} />
          <div className="grid gap-5 md:grid-cols-3">
            {desks.map((desk, i) => (
              <Reveal key={desk.region} delay={i * 70}>
                <div className="tick flex h-full flex-col rounded-card border border-steel-200 bg-white p-6 shadow-card">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-amber-bright">
                    <Globe className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-medium text-ink">{desk.region}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-600">{desk.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
