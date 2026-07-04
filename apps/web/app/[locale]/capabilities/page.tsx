import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from 'antd';
import { FlaskConical, Ruler, Package, FileCheck2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { fetchCategories, fetchProducts, fetchBadges } from '@/lib/api/catalog';
import { PageHero } from '@/components/PageHero';
import { SectionHeading } from '@/components/SectionHeading';
import { CategoryGrid } from '@/components/CategoryGrid';
import { InfoCard } from '@/components/InfoCard';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';

export const revalidate = 300;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'capabilities' });
  return { title: t('hero.title'), description: t('hero.lede') };
}

const QUALITY_ICONS = [FlaskConical, Ruler, Package, FileCheck2] as const;

export default async function CapabilitiesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('capabilities');
  const tc = await getTranslations('common');

  const [categories, products, badges] = await Promise.all([
    fetchCategories(),
    fetchProducts({ limit: 4, sort: 'sortOrder', locale }),
    fetchBadges(),
  ]);

  return (
    <>
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} lede={t('hero.lede')} />

      {categories && categories.length > 0 && (
        <section className="shell py-20 lg:py-24">
          <SectionHeading title={t('trade.title')} lede={t('trade.lede')} />
          <CategoryGrid categories={categories} />
        </section>
      )}

      <section className="border-t border-steel-200 bg-steel-50">
        <div className="shell py-20 lg:py-24">
          <SectionHeading title={t('quality.title')} lede={t('quality.lede')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n, i) => (
              <InfoCard
                key={n}
                icon={QUALITY_ICONS[i]}
                delay={i * 60}
                title={t(`quality.i${n}.title`)}
                body={t(`quality.i${n}.body`)}
              />
            ))}
          </div>
        </div>
      </section>

      {products && products.data.length > 0 && (
        <section className="shell py-20 lg:py-24">
          <SectionHeading
            title={t('preview.title')}
            lede={t('preview.lede')}
            trailing={
              <Link href="/catalog">
                <Button>{tc('viewCatalog')}</Button>
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.data.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 60}>
                <ProductCard product={product} badgeMeta={badges ?? undefined} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
