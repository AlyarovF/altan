'use client';

import { useTranslations } from 'next-intl';
import { Button, Empty } from 'antd';
import { Link } from '@/i18n/routing';

/** Empty state for the catalog with a clear-filters action. */
export function CatalogEmpty() {
  const t = useTranslations('catalog');
  return (
    <div className="rounded-xl border border-dashed border-steel-300 bg-white py-20">
      <Empty description={<span className="text-steel-600">{t('empty')}</span>}>
        <Link href="/catalog">
          <Button type="primary">{t('clearFilters')}</Button>
        </Link>
      </Empty>
    </div>
  );
}
