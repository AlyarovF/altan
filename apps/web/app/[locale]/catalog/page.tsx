import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchProducts, fetchCategories, fetchRegions, fetchBadges } from '@/lib/api/catalog';
import { ProductCard } from '@/components/ProductCard';
import { CatalogFilters, type CatalogFilterValues } from '@/features/catalog/CatalogFilters';
import { CatalogSort, CatalogPagination } from '@/features/catalog/CatalogToolbar';
import { CatalogEmpty } from '@/features/catalog/CatalogEmpty';

export const revalidate = 300;

const PAGE_SIZE = 12;

interface CatalogSearchParams {
  category?: string;
  region?: string;
  badge?: string;
  featured?: string;
  q?: string;
  sort?: string;
  page?: string;
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function CatalogPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: CatalogSearchParams;
}) {
  setRequestLocale(locale);
  const t = await getTranslations('catalog');

  const page = Math.max(1, Number(searchParams.page) || 1);
  const filters: CatalogFilterValues = {
    category: searchParams.category,
    region: searchParams.region,
    badge: searchParams.badge,
    featured: searchParams.featured === 'true',
    q: searchParams.q,
    sort: searchParams.sort,
  };

  const [products, categories, regions, badges] = await Promise.all([
    fetchProducts({
      ...filters,
      page,
      limit: PAGE_SIZE,
      locale,
    }),
    fetchCategories(),
    fetchRegions(locale),
    fetchBadges(),
  ]);

  const items = products?.data ?? [];
  const total = products?.meta.total ?? 0;

  return (
    <div className="bg-steel-50">
      <div className="surface-dark">
        <div className="shell py-16">
          <p className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-amber" aria-hidden />
            <span className="eyebrow-light">{t('eyebrow')}</span>
          </p>
          <h1 className="mt-5 font-display text-display-md font-medium text-white">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-steel-300">{t('subtitle')}</p>
        </div>
      </div>

      <div className="shell -mt-8 pb-20">
        <CatalogFilters
          categories={categories ?? []}
          regions={regions ?? []}
          badges={badges ?? []}
          value={filters}
        />

        <div className="mt-6">
          <CatalogSort total={total} filters={filters} />
        </div>

        {items.length === 0 ? (
          <div className="mt-6">
            <CatalogEmpty />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} badgeMeta={badges ?? undefined} />
              ))}
            </div>
            <CatalogPagination
              current={page}
              total={total}
              pageSize={PAGE_SIZE}
              filters={filters}
            />
          </>
        )}
      </div>
    </div>
  );
}
