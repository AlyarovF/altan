import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { Descriptions, Divider } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { fetchProduct, fetchBadges } from '@/lib/api/catalog';
import { SITE_URL, resolveMediaUrl } from '@/lib/env';
import { formatMinOrder, formatPrice } from '@/lib/format';
import { ProductBadges } from '@/components/ProductBadges';
import { QuoteButton } from '@/components/QuoteButton';

export const revalidate = 300;

interface PageProps {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params: { locale, slug } }: PageProps): Promise<Metadata> {
  const product = await fetchProduct(slug, locale);
  if (!product) return { title: 'Not found' };
  const description =
    product.shortDescription ??
    product.description ??
    `${product.name} — ${product.grade ?? ''} from ${product.origin ?? product.region.name}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/catalog/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `${SITE_URL}/${locale}/catalog/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params: { locale, slug } }: PageProps) {
  setRequestLocale(locale);
  const [product, badges] = await Promise.all([fetchProduct(slug, locale), fetchBadges()]);
  if (!product) notFound();

  const t = await getTranslations('product');
  const tc = await getTranslations('common');
  const minOrder = formatMinOrder(product.minOrderQty, product.minOrderUnit, locale);
  const imageUrl = resolveMediaUrl(product.imageUrl);

  // Indicative price — formatPrice returns null unless amount + currency are set.
  const price = formatPrice(product.priceAmount, product.priceCurrency, product.priceUnit, locale);
  const priceBasis = [product.priceBasis, product.priceNote].filter(Boolean).join(' · ');
  const priceUpdated = product.priceUpdatedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
        new Date(product.priceUpdatedAt),
      )
    : null;

  // JSON-LD Product for rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    category: product.category.name,
    sku: product.hsCode ?? product.slug,
    brand: { '@type': 'Brand', name: 'ALTAN Trading House' },
    ...(product.origin ? { countryOfOrigin: product.origin } : {}),
    url: `${SITE_URL}/${locale}/catalog/${product.slug}`,
    // Offer emitted only when the product carries an indicative price. `unitText`
    // (not `unitCode`) — there is no clean UN/CEFACT mapping for "mtu".
    ...(price && product.priceAmount && product.priceCurrency
      ? {
          offers: {
            '@type': 'Offer',
            price: product.priceAmount,
            priceCurrency: product.priceCurrency,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: product.priceAmount,
              priceCurrency: product.priceCurrency,
              ...(product.priceUnit ? { unitText: product.priceUnit } : {}),
            },
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  const facts: Array<{ label: string; value: string }> = [];
  if (product.grade) facts.push({ label: tc('grade'), value: product.grade });
  if (product.standard) facts.push({ label: t('standard'), value: product.standard });
  if (product.hsCode) facts.push({ label: tc('hsCode'), value: product.hsCode });
  if (product.origin) facts.push({ label: t('origin'), value: product.origin });
  facts.push({ label: tc('region'), value: product.region.name });
  facts.push({ label: tc('category'), value: product.category.name });
  if (minOrder) facts.push({ label: tc('minOrder'), value: minOrder });

  return (
    <div className="bg-steel-50">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="surface-dark">
        <div className="shell py-12">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-sm text-steel-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToCatalog')}
          </Link>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2.5">
                <span className="h-px w-6 bg-amber" aria-hidden />
                <span className="eyebrow-light">{product.category.name}</span>
              </p>
              <h1 className="mt-4 font-display text-display-md font-medium text-white">
                {product.name}
              </h1>
              {product.grade && (
                <p className="mt-3 font-mono text-lg text-steel-300">{product.grade}</p>
              )}
              <div className="mt-4">
                <ProductBadges codes={product.badges} badgeMeta={badges ?? undefined} size="md" />
              </div>
            </div>
            <QuoteButton
              type="primary"
              size="large"
              // Allow the long localized CTA label to wrap instead of forcing
              // horizontal overflow on narrow screens.
              className="!h-auto max-w-full !whitespace-normal !py-2.5 !leading-snug"
              label={t('requestForProduct')}
              prefill={{
                productId: product.id,
                productName: product.name,
                unit: product.minOrderUnit ?? undefined,
                minOrderQty: product.minOrderQty,
              }}
            />
          </div>
        </div>
      </div>

      <div className="shell grid gap-10 py-16 lg:grid-cols-[1.6fr_1fr]">
        {/* min-w-0 lets the grid tracks shrink below their content's intrinsic
            width so wide spec values never force horizontal page scroll on mobile. */}
        <div className="min-w-0">
          {imageUrl && (
            <div className="relative mb-10 aspect-[16/10] w-full overflow-hidden rounded-xl border border-steel-200 bg-white shadow-card">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {product.description && (
            <section>
              <h2 className="font-display text-2xl text-ink">{t('description')}</h2>
              <p className="mt-4 text-base leading-relaxed text-steel-700">{product.description}</p>
            </section>
          )}

          {product.specs.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl text-ink">{t('specs')}</h2>
              {/* Same antd Descriptions treatment as the facts panel — one table
                  language across the page instead of a raw <table> here. */}
              <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-card">
                <Descriptions
                  bordered
                  column={1}
                  size="middle"
                  items={product.specs.map((spec) => ({
                    key: spec.id,
                    label: spec.label,
                    children: (
                      <span className="font-mono text-steel-700">
                        {spec.value}
                        {spec.unit ? ` ${spec.unit}` : ''}
                      </span>
                    ),
                  }))}
                />
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-steel-200 bg-white p-6 shadow-card">
            {/* Indicative price — the buyer's first question, so it leads the facts
                panel with the heavy mono treatment used across price signals. */}
            <div className="mb-5 border-b border-steel-100 pb-5">
              <p className="font-mono text-[10px] uppercase tracking-ticker text-steel-500">
                {tc('price')}
              </p>
              {price ? (
                <>
                  <p className="mt-1 font-mono text-2xl font-semibold text-ink">{price}</p>
                  {priceBasis && (
                    <p className="mt-1.5 text-sm text-steel-600">
                      {t('priceBasis')}: <span className="font-medium">{priceBasis}</span>
                    </p>
                  )}
                  {priceUpdated && (
                    <p className="mt-0.5 text-sm text-steel-500">
                      {t('priceUpdated')}: {priceUpdated}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-steel-500">{t('priceDisclaimer')}</p>
                </>
              ) : (
                <p className="mt-1 text-base font-medium text-steel-600">{tc('priceOnRequest')}</p>
              )}
            </div>
            <Descriptions
              column={1}
              size="small"
              items={facts.map((f, i) => ({
                key: String(i),
                label: f.label,
                children: <span className="font-medium text-ink">{f.value}</span>,
              }))}
            />
            <Divider className="!my-5" />
            <QuoteButton
              type="primary"
              block
              size="large"
              className="!h-auto !whitespace-normal !py-2.5 !leading-snug"
              label={t('requestForProduct')}
              prefill={{
                productId: product.id,
                productName: product.name,
                unit: product.minOrderUnit ?? undefined,
                minOrderQty: product.minOrderQty,
              }}
            />
            <p className="mt-3 text-center text-xs text-steel-500">
              {tc('requestQuote')} · 12h SLA
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
