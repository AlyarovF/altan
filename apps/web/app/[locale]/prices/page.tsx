import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ProductCard } from '@altan/shared';
import { Link } from '@/i18n/routing';
import { fetchProducts } from '@/lib/api/catalog';
import { SITE_URL } from '@/lib/env';
import { formatPrice } from '@/lib/format';
import { PageHero } from '@/components/PageHero';
import { QuoteButton } from '@/components/QuoteButton';

export const revalidate = 300;

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'prices' });
  return {
    title: t('hero.title'),
    description: t('hero.lede'),
    alternates: { canonical: `${SITE_URL}/${locale}/prices` },
    openGraph: {
      type: 'website',
      title: t('hero.title'),
      description: t('hero.lede'),
      url: `${SITE_URL}/${locale}/prices`,
    },
  };
}

/** Group priced cards by category name, preserving the API's sortOrder within groups. */
function groupByCategory(products: ProductCard[]): Array<[string, ProductCard[]]> {
  const groups = new Map<string, ProductCard[]>();
  for (const p of products) {
    const list = groups.get(p.category.name);
    if (list) list.push(p);
    else groups.set(p.category.name, [p]);
  }
  return [...groups.entries()];
}

export default async function PricesPage({ params: { locale } }: PageProps) {
  setRequestLocale(locale);
  const t = await getTranslations('prices');
  const tc = await getTranslations('common');

  const result = await fetchProducts({ priced: true, limit: 100, sort: 'sortOrder', locale });
  const products = result?.data ?? [];
  const groups = groupByCategory(products);

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const formatUpdated = (iso: string | null | undefined) =>
    iso ? dateFmt.format(new Date(iso)) : '—';

  return (
    <div className="bg-steel-50">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      <div className="shell py-16 lg:py-20">
        {products.length === 0 ? (
          <div className="rounded-xl border border-steel-200 bg-white p-10 text-center shadow-card">
            <p className="mx-auto max-w-md text-base text-steel-600">{t('empty')}</p>
            <div className="mt-6">
              <QuoteButton type="primary" size="large" label={t('cta')} />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop board — one dense ledger table, grouped by category via
                section header rows (multiple <tbody> keeps groups semantic). */}
            <div className="hidden overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-card sm:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-steel-200 text-left">
                    <th className="px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-500">
                      {t('material')}
                    </th>
                    <th className="px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-500">
                      {t('price')}
                    </th>
                    <th className="px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-500">
                      {t('basis')}
                    </th>
                    <th className="px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-500">
                      {t('updated')}
                    </th>
                  </tr>
                </thead>
                {groups.map(([category, items]) => (
                  <tbody key={category}>
                    <tr className="border-b border-steel-200 bg-steel-50">
                      <th
                        scope="colgroup"
                        colSpan={4}
                        className="px-5 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-600"
                      >
                        {category}
                      </th>
                    </tr>
                    {items.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-steel-100 transition-colors last:border-b-0 hover:bg-amber/5"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/catalog/${p.slug}`}
                            className="font-medium text-ink transition-colors hover:text-amber-deep"
                          >
                            {p.name}
                          </Link>
                          {p.grade && (
                            <span className="mt-0.5 block font-mono text-xs text-steel-500">
                              {p.grade}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-base font-semibold text-ink">
                          {formatPrice(p.priceAmount, p.priceCurrency, p.priceUnit, locale)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-steel-600">
                          {p.priceBasis ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-steel-600">
                          {formatUpdated(p.priceUpdatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>

            {/* Mobile — stacked card rows so the board never scrolls sideways. */}
            <div className="space-y-6 sm:hidden">
              {groups.map(([category, items]) => (
                <section key={category}>
                  <h2 className="font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-600">
                    {category}
                  </h2>
                  <ul className="mt-2 space-y-2.5">
                    {items.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-xl border border-steel-200 bg-white p-4 shadow-card"
                      >
                        <Link
                          href={`/catalog/${p.slug}`}
                          className="font-medium text-ink transition-colors hover:text-amber-deep"
                        >
                          {p.name}
                        </Link>
                        {p.grade && (
                          <p className="mt-0.5 font-mono text-xs text-steel-500">{p.grade}</p>
                        )}
                        <p className="mt-2 font-mono text-lg font-semibold text-ink">
                          {formatPrice(p.priceAmount, p.priceCurrency, p.priceUnit, locale)}
                        </p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 border-t border-steel-100 pt-2 text-sm">
                          <div>
                            <dt className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                              {t('basis')}
                            </dt>
                            <dd className="mt-0.5 font-mono text-steel-600">
                              {p.priceBasis ?? '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                              {t('updated')}
                            </dt>
                            <dd className="mt-0.5 font-mono text-steel-600">
                              {formatUpdated(p.priceUpdatedAt)}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* Disclaimer strip + firm-quote CTA. */}
            <div className="mt-8 flex flex-col gap-5 rounded-xl border border-steel-200 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-steel-600">{t('disclaimer')}</p>
              <QuoteButton
                type="primary"
                size="large"
                className="!h-auto shrink-0 !whitespace-normal !py-2.5 !leading-snug"
                label={t('cta')}
              />
            </div>
            <p className="mt-4 text-center text-xs text-steel-500">
              {tc('requestQuote')} · 12h SLA
            </p>
          </>
        )}
      </div>
    </div>
  );
}
