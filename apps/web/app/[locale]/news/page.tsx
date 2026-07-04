import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchNews } from '@/lib/api/catalog';
import { NewsCard } from '@/components/NewsCard';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('news') };
}

export default async function NewsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tNews = await getTranslations('news');
  const news = await fetchNews(locale, 24);
  const items = news?.data ?? [];

  return (
    <div className="bg-steel-50">
      <div className="surface-dark">
        <div className="shell py-16">
          <p className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-amber" aria-hidden />
            <span className="eyebrow-light">{tNews('eyebrow')}</span>
          </p>
          <h1 className="mt-5 font-display text-display-md font-medium text-white">
            {t('newsHeading')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-steel-300">{t('newsSubheading')}</p>
        </div>
      </div>
      <div className="shell py-16 lg:py-20">
        {items.length === 0 ? (
          <p className="text-steel-600">{t('newsSubheading')}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
