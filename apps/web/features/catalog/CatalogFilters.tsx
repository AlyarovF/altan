'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Select, Switch } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Badge, Category, Region } from '@altan/shared';
import { usePathname, useRouter } from '@/i18n/routing';

export interface CatalogFilterValues {
  category?: string;
  region?: string;
  badge?: string;
  featured?: boolean;
  q?: string;
  sort?: string;
}

/** URL-synced filter bar. Pushes changes onto the query string (shareable + SSR). */
export function CatalogFilters({
  categories,
  regions,
  badges,
  value,
}: {
  categories: Category[];
  regions: Region[];
  badges: Badge[];
  value: CatalogFilterValues;
}) {
  const t = useTranslations('catalog');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(value.q ?? '');

  useEffect(() => setSearch(value.q ?? ''), [value.q]);

  const apply = useCallback(
    (next: Partial<CatalogFilterValues>) => {
      const merged = { ...value, ...next };
      const params = new URLSearchParams();
      if (merged.category) params.set('category', merged.category);
      if (merged.region) params.set('region', merged.region);
      if (merged.badge) params.set('badge', merged.badge);
      if (merged.featured) params.set('featured', 'true');
      if (merged.q) params.set('q', merged.q);
      if (merged.sort && merged.sort !== 'sortOrder') params.set('sort', merged.sort);
      // Reset to page 1 on any filter change.
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      });
    },
    [value, router, pathname],
  );

  // Debounce the free-text search.
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((value.q ?? '') !== search) apply({ q: search || undefined });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div
      className="rounded-xl border border-steel-200 bg-white p-4 shadow-card"
      aria-busy={isPending}
    >
      <div className="grid gap-3 lg:grid-cols-[2fr_repeat(3,1fr)_auto]">
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined className="text-steel-400" />}
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search')}
        />
        <Select
          size="large"
          allowClear
          placeholder={t('allCategories')}
          value={value.category}
          onChange={(v) => apply({ category: v })}
          aria-label={t('allCategories')}
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
        />
        <Select
          size="large"
          allowClear
          placeholder={t('allRegions')}
          value={value.region}
          onChange={(v) => apply({ region: v })}
          aria-label={t('allRegions')}
          options={regions.map((r) => ({ value: r.code, label: r.name }))}
        />
        <Select
          size="large"
          allowClear
          placeholder={t('allBadges')}
          value={value.badge}
          onChange={(v) => apply({ badge: v })}
          aria-label={t('allBadges')}
          options={badges.map((b) => ({ value: b.code, label: `${b.emoji} ${b.label}` }))}
        />
        <label className="flex items-center gap-2 whitespace-nowrap px-1 text-sm font-medium text-steel-700">
          <Switch
            checked={!!value.featured}
            onChange={(checked) => apply({ featured: checked || undefined })}
          />
          {t('featuredOnly')}
        </label>
      </div>
    </div>
  );
}
