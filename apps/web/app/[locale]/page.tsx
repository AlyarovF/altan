import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from 'antd';
import { Link } from '@/i18n/routing';
import { SITE_URL } from '@/lib/env';
import { fetchSiteContent, fetchStats, fetchProcessSteps } from '@/lib/api/content';
import { fetchProducts, fetchBadges, fetchNews, fetchCategories } from '@/lib/api/catalog';
import { Hero } from '@/features/home/Hero';
import { TrustBar } from '@/features/home/TrustBar';
import { ProcessSteps } from '@/features/home/ProcessSteps';
import { Coverage } from '@/features/home/Coverage';
import { SectionHeading } from '@/components/SectionHeading';
import { CategoryGrid } from '@/components/CategoryGrid';
import { ProductCard } from '@/components/ProductCard';
import { NewsCard } from '@/components/NewsCard';
import { Reveal } from '@/components/Reveal';

export const revalidate = 300;

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');

  const [content, stats, steps, deskFeatured, gridProducts, categories, badges, news] =
    await Promise.all([
      fetchSiteContent(locale),
      fetchStats(locale),
      fetchProcessSteps(locale),
      fetchProducts({ featured: true, limit: 4, locale }),
      fetchProducts({ limit: 8, sort: 'sortOrder', locale }),
      fetchCategories(),
      fetchBadges(),
      fetchNews(locale, 3),
    ]);

  // CMS content (`/content?locale=`) is localized by the backend (EN base + RU/UZ
  // overrides). Prefer the admin-authored CMS value for every locale; fall back to
  // the bundled next-intl message only when the CMS value is missing/empty.
  const tagline = content?.tagline || t('heroTagline');
  const tag = content?.tag || t('heroTag');
  const trustBadges = content?.trustBadges?.length
    ? content.trustBadges
    : (t.raw('trustBadges') as string[]);
  const desk = deskFeatured?.data?.length ? deskFeatured.data : (gridProducts?.data ?? []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: content?.companyName ?? 'ALTAN Trading House',
    url: `${SITE_URL}/${locale}`,
    slogan: tagline,
    description: (content?.tag as string | undefined) ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero
        tagline={tagline}
        tag={tag}
        lede={t('heroLede')}
        heroStats={stats?.HERO ?? []}
        featured={desk}
        locale={locale}
      />

      <TrustBar badges={trustBadges} label={t('trustHeading')} />

      {categories && categories.length > 0 && (
        <section className="shell py-20 lg:py-24">
          <SectionHeading
            title={t('capabilitiesHeading')}
            lede={t('capabilitiesSubheading')}
            trailing={
              <Link href="/capabilities">
                <Button>{tc('learnMore')}</Button>
              </Link>
            }
          />
          <CategoryGrid categories={categories} />
        </section>
      )}

      {gridProducts && gridProducts.data.length > 0 && (
        <section className="border-t border-steel-200 bg-steel-50">
          <div className="shell py-20 lg:py-24">
            <SectionHeading
              title={t('featuredHeading')}
              lede={t('featuredSubheading')}
              trailing={
                <Link href="/catalog">
                  <Button>{tc('viewCatalog')}</Button>
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {gridProducts.data.map((product, i) => (
                <Reveal key={product.id} delay={(i % 4) * 60}>
                  <ProductCard product={product} badgeMeta={badges ?? undefined} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Coverage />

      <ProcessSteps steps={steps ?? []} stats={stats?.PROCESS_BAR ?? []} />

      {news && news.data.length > 0 && (
        <section className="shell py-20 lg:py-24">
          <SectionHeading
            title={t('newsHeading')}
            lede={t('newsSubheading')}
            trailing={
              <Link href="/news">
                <Button>{tc('viewAllNews')}</Button>
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {news.data.map((article, i) => (
              <Reveal key={article.id} delay={i * 70}>
                <NewsCard article={article} locale={locale} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
