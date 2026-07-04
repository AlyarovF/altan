'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Pagination, Select } from 'antd';
import { usePathname, useRouter } from '@/i18n/routing';
import type { CatalogFilterValues } from './CatalogFilters';

function buildQuery(filters: CatalogFilterValues, page: number, sort?: string): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.region) params.set('region', filters.region);
  if (filters.badge) params.set('badge', filters.badge);
  if (filters.featured) params.set('featured', 'true');
  if (filters.q) params.set('q', filters.q);
  const effectiveSort = sort ?? filters.sort;
  if (effectiveSort && effectiveSort !== 'sortOrder') params.set('sort', effectiveSort);
  if (page > 1) params.set('page', String(page));
  return params.toString();
}

/** Result count + sort selector. */
export function CatalogSort({ total, filters }: { total: number; filters: CatalogFilterValues }) {
  const t = useTranslations('catalog');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onChange = (sort: string) => {
    const qs = buildQuery(filters, 1, sort);
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false }));
  };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
      aria-busy={isPending}
    >
      <p className="text-sm text-steel-600">{t('resultsCount', { count: total })}</p>
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-sm text-steel-500">{t('sort')}</span>
        <Select
          value={filters.sort ?? 'sortOrder'}
          onChange={onChange}
          style={{ width: 170 }}
          options={[
            { value: 'sortOrder', label: t('sortDefault') },
            { value: 'name', label: t('sortNameAsc') },
            { value: '-name', label: t('sortNameDesc') },
            { value: '-createdAt', label: t('sortNewest') },
          ]}
        />
      </div>
    </div>
  );
}

/** Server-side pagination synced to the `page` query param. */
export function CatalogPagination({
  current,
  total,
  pageSize,
  filters,
}: {
  current: number;
  total: number;
  pageSize: number;
  filters: CatalogFilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  if (total <= pageSize) return null;

  return (
    <div className="mt-10 flex justify-center">
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        showSizeChanger={false}
        onChange={(page) => {
          const qs = buildQuery(filters, page);
          startTransition(() =>
            router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: true }),
          );
        }}
      />
    </div>
  );
}
