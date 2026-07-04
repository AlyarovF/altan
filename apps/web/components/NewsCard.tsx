import { useTranslations } from 'next-intl';
import { Tag } from 'antd';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NewsCard as NewsCardType } from '@altan/shared';
import { Link } from '@/i18n/routing';
import { changeColor, outlookColor } from '@/lib/format';

const TREND = {
  UP: TrendingUp,
  DOWN: TrendingDown,
  FLAT: Minus,
} as const;

export function NewsCard({ article, locale }: { article: NewsCardType; locale: string }) {
  const t = useTranslations('news');
  const tc = useTranslations('common');
  const Trend = TREND[article.changeDirection];
  const published = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(article.publishedAt))
    : null;

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex h-full flex-col rounded-card border border-steel-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-md border border-steel-200 bg-steel-50 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-ticker text-steel-700">
          {article.commodity}
        </span>
        <Tag color={outlookColor(article.outlook)} className="!m-0">
          {t(`outlook.${article.outlook}`)}
        </Tag>
      </div>

      <h3 className="mt-4 font-display text-lg leading-snug text-ink transition-colors group-hover:text-amber-deep">
        {article.title}
      </h3>

      {article.summary && (
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-steel-600">
          {article.summary}
        </p>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-steel-100 pt-4">
        <div>
          {article.priceLabel && (
            <div className="font-mono text-base font-semibold text-ink">{article.priceLabel}</div>
          )}
          {article.changeLabel && (
            <div
              className={`mt-0.5 inline-flex items-center gap-1 font-mono text-sm font-medium ${changeColor(
                article.changeDirection,
              )}`}
            >
              <Trend className="h-3.5 w-3.5" aria-hidden />
              {article.changeLabel}
            </div>
          )}
        </div>
        <div className="text-right">
          {published && <div className="text-xs text-steel-500">{published}</div>}
          <span className="mt-1 inline-block text-sm font-medium text-steel-600 group-hover:text-ink">
            {tc('readMore')}
          </span>
        </div>
      </div>
    </Link>
  );
}
