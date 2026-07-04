'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from 'antd';
import { ArrowRight } from 'lucide-react';
import type { Badge, ProductCard as ProductCardType } from '@altan/shared';
import { Link } from '@/i18n/routing';
import { ProductBadges } from './ProductBadges';
import { ElementTile } from './ElementTile';
import { useQuoteModal } from '@/features/quote/QuoteModalContext';
import { formatMinOrder } from '@/lib/format';

/**
 * Material card — a compact spec sheet. Identity is the element tile (derived
 * from the material's chemistry) rather than photography, keeping the grid
 * uniform and on-brand whether or not a product ships an image.
 */
export function ProductCard({
  product,
  badgeMeta,
}: {
  product: ProductCardType;
  badgeMeta?: Badge[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { openQuote } = useQuoteModal();

  const minOrder = formatMinOrder(product.minOrderQty, product.minOrderUnit, locale);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-steel-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-lift">
      <Link
        href={`/catalog/${product.slug}`}
        className="flex flex-1 flex-col p-5"
        aria-label={product.name}
      >
        <div className="flex items-start justify-between gap-3">
          <ElementTile name={product.name} grade={product.grade} size="md" />
          <ProductBadges codes={product.badges} badgeMeta={badgeMeta} />
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-ticker text-steel-500">
          {product.category.name}
        </p>
        <h3 className="mt-1 font-display text-xl font-medium text-ink transition-colors group-hover:text-amber-deep">
          {product.name}
        </h3>
        {product.grade && <p className="mt-1 font-mono text-sm text-steel-600">{product.grade}</p>}

        {product.shortDescription && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-steel-600">
            {product.shortDescription}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-steel-100 pt-4 text-sm">
          {minOrder && (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                {t('common.minOrder')}
              </dt>
              <dd className="mt-0.5 font-mono font-medium text-ink">{minOrder}</dd>
            </div>
          )}
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
              {t('common.region')}
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{product.region.name}</dd>
          </div>
          {product.hsCode && (
            <div className="col-span-2">
              <dt className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                {t('common.hsCode')}
              </dt>
              <dd className="mt-0.5 font-mono text-ink">{product.hsCode}</dd>
            </div>
          )}
        </dl>
      </Link>

      {/* flex-wrap + gap-y lets the primary action drop to its own line on narrow
          cards (e.g. long localized labels like RU/UZ) so the footer's intrinsic
          width never forces horizontal overflow at small viewports. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-steel-100 bg-steel-50/60 px-5 py-3">
        <Link
          href={`/catalog/${product.slug}`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-steel-600 transition-colors group-hover:text-ink md:min-h-0"
        >
          {t('catalog.viewProduct')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Button
          type="primary"
          size="small"
          className="!min-h-11 md:!min-h-0"
          onClick={() =>
            openQuote({
              productId: product.id,
              productName: product.name,
              unit: product.minOrderUnit ?? undefined,
              minOrderQty: product.minOrderQty,
            })
          }
        >
          {t('common.requestQuote')}
        </Button>
      </div>
    </article>
  );
}
