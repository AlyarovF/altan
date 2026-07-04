import type { MetadataRoute } from 'next';
import { LOCALES } from '@altan/shared';
import { SITE_URL } from '@/lib/env';
import { fetchProducts, fetchNews } from '@/lib/api/catalog';

export const revalidate = 3600;

/** Per-locale sitemap covering static pages + all products and news, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const alternatesFor = (path: string) => ({
    languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
  });

  const staticPaths = [
    '',
    '/catalog',
    '/capabilities',
    '/sourcing',
    '/quality',
    '/about',
    '/contact',
    '/news',
  ];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of staticPaths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' ? 'daily' : 'hourly',
        priority: path === '' ? 1 : 0.8,
        alternates: alternatesFor(path),
      });
    }
  }

  // Pull product + news slugs once (locale-agnostic slugs), emit per-locale URLs.
  const [products, news] = await Promise.all([
    fetchProducts({ limit: 100, locale: 'en' }),
    fetchNews('en', 100),
  ]);

  for (const product of products?.data ?? []) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}/catalog/${product.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: alternatesFor(`/catalog/${product.slug}`),
      });
    }
  }

  for (const article of news?.data ?? []) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}/news/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
        alternates: alternatesFor(`/news/${article.slug}`),
      });
    }
  }

  return entries;
}
