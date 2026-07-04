import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Tag } from 'antd';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { fetchNewsArticle } from '@/lib/api/catalog';
import { SITE_URL } from '@/lib/env';
import { changeColor, outlookColor } from '@/lib/format';

export const revalidate = 300;

interface PageProps {
  params: { locale: string; slug: string };
}

const TREND = { UP: TrendingUp, DOWN: TrendingDown, FLAT: Minus } as const;

export async function generateMetadata({ params: { locale, slug } }: PageProps): Promise<Metadata> {
  const article = await fetchNewsArticle(slug, locale);
  if (!article) return { title: 'Not found' };
  return {
    title: article.title,
    description: article.summary ?? undefined,
    alternates: { canonical: `${SITE_URL}/${locale}/news/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary ?? undefined,
      url: `${SITE_URL}/${locale}/news/${article.slug}`,
    },
  };
}

export default async function NewsDetailPage({ params: { locale, slug } }: PageProps) {
  setRequestLocale(locale);
  const article = await fetchNewsArticle(slug, locale);
  if (!article) notFound();

  const t = await getTranslations('news');
  const tc = await getTranslations('common');
  const Trend = TREND[article.changeDirection];
  const published = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(article.publishedAt))
    : null;

  return (
    <div className="bg-steel-50">
      <article className="shell max-w-3xl py-16">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-steel-600 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc('viewAllNews')}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-bright">
            {article.commodity}
          </span>
          <Tag color={outlookColor(article.outlook)}>
            {t('outlookLabel')}: {t(`outlook.${article.outlook}`)}
          </Tag>
          {published && <span className="text-sm text-steel-500">{published}</span>}
        </div>

        <h1 className="mt-5 font-display text-4xl leading-tight text-ink">{article.title}</h1>

        {(article.priceLabel || article.changeLabel) && (
          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-xl border border-steel-200 bg-white px-6 py-4 shadow-card">
            {article.priceLabel && (
              <div>
                <div className="text-xs uppercase tracking-eyebrow text-steel-500">Price</div>
                <div className="font-mono text-xl font-semibold text-ink">{article.priceLabel}</div>
              </div>
            )}
            {article.changeLabel && (
              <div>
                <div className="text-xs uppercase tracking-eyebrow text-steel-500">Change</div>
                <div
                  className={`inline-flex items-center gap-1 font-mono text-xl font-semibold ${changeColor(
                    article.changeDirection,
                  )}`}
                >
                  <Trend className="h-5 w-5" aria-hidden />
                  {article.changeLabel}
                </div>
              </div>
            )}
          </div>
        )}

        {article.summary && (
          <p className="mt-8 font-display text-xl leading-relaxed text-steel-700">
            {article.summary}
          </p>
        )}

        {article.body && (
          <div className="mt-6 space-y-4 text-base leading-relaxed text-steel-700">
            {article.body
              .split('\n')
              .map((para, i) => (para.trim() ? <p key={i}>{para}</p> : null))}
          </div>
        )}
      </article>
    </div>
  );
}
