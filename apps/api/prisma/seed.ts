/**
 * ALTAN — Prisma database seed (idempotent).
 *
 * Populates a fresh database with ALTAN's real content (typed fixtures in ./fixtures) so the
 * public APIs return the actual site on first boot. Safe to re-run: every write is an upsert
 * keyed on a stable natural key, so re-running never duplicates rows.
 *
 * Run: `pnpm --filter @altan/api exec prisma db seed`
 *
 * Note: this uses a plain PrismaClient (not the Nest PrismaService) and `new PasswordService()`
 * so it stays a lightweight standalone script — no AppModule / Redis / queue boot. It still
 * reuses the canonical `seedAdmin()` helper for the bootstrap admin (the helper only touches
 * `prisma.user.upsert`, which a plain client satisfies). ADMIN_EMAIL / ADMIN_PASSWORD come from
 * apps/api/.env (Prisma loads it automatically).
 */
import { PrismaClient } from '@prisma/client';
import type {
  BadgeCode as PrismaBadgeCode,
  ChangeDirection as PrismaChangeDirection,
  LocaleCode as PrismaLocaleCode,
  Outlook as PrismaOutlook,
  Prisma,
  ProductStatus as PrismaProductStatus,
  SiteStatGroup as PrismaSiteStatGroup,
} from '@prisma/client';
import { PasswordService } from '../src/auth/password.service';
import { seedAdmin } from '../src/scripts/seed-admin';
import {
  badges,
  categories,
  news,
  processSteps,
  products,
  regions,
  siteContent,
  siteStats,
  translations,
} from './fixtures';

const prisma = new PrismaClient();

async function seedTaxonomy(): Promise<{
  categoryIds: Map<string, string>;
  regionIds: Map<string, string>;
}> {
  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, sortOrder: c.sortOrder },
      update: { name: c.name, sortOrder: c.sortOrder },
    });
    categoryIds.set(c.slug, row.id);
  }

  const regionIds = new Map<string, string>();
  for (const r of regions) {
    const row = await prisma.region.upsert({
      where: { code: r.code },
      create: { code: r.code, name: r.name, sortOrder: r.sortOrder },
      update: { name: r.name, sortOrder: r.sortOrder },
    });
    regionIds.set(r.code, row.id);

    // Per-locale name overrides (RU/UZ). EN lives on the base row above.
    for (const t of r.translations ?? []) {
      await prisma.regionTranslation.upsert({
        where: { regionId_locale: { regionId: row.id, locale: t.locale as PrismaLocaleCode } },
        create: { regionId: row.id, locale: t.locale as PrismaLocaleCode, name: t.name },
        update: { name: t.name },
      });
    }
  }

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code as PrismaBadgeCode },
      create: { code: b.code as PrismaBadgeCode, label: b.label, emoji: b.emoji, color: b.color },
      update: { label: b.label, emoji: b.emoji, color: b.color },
    });
  }

  return { categoryIds, regionIds };
}

async function seedProducts(
  categoryIds: Map<string, string>,
  regionIds: Map<string, string>,
): Promise<void> {
  for (const p of products) {
    const categoryId = categoryIds.get(p.categorySlug);
    const regionId = regionIds.get(p.regionCode);
    if (!categoryId)
      throw new Error(`Unknown category slug for product ${p.slug}: ${p.categorySlug}`);
    if (!regionId) throw new Error(`Unknown region code for product ${p.slug}: ${p.regionCode}`);

    const base = {
      name: p.name,
      categoryId,
      regionId,
      featured: p.featured,
      grade: p.grade ?? null,
      hsCode: p.hsCode ?? null,
      standard: p.standard ?? null,
      origin: p.origin ?? null,
      minOrderQty: p.minOrderQty ?? null,
      minOrderUnit: p.minOrderUnit ?? null,
      shortDescription: p.shortDescription ?? null,
      description: p.description ?? null,
      status: p.status as PrismaProductStatus,
      sortOrder: p.sortOrder,
    } satisfies Omit<Prisma.ProductUncheckedCreateInput, 'slug'>;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...base },
      update: base,
    });

    // Specs: replace deterministically (idempotent — old rows cleared, fixtures re-created).
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    if (p.specs.length) {
      await prisma.productSpec.createMany({
        data: p.specs.map((s, i) => ({
          productId: product.id,
          label: s.label,
          value: s.value,
          unit: s.unit ?? null,
          sortOrder: i,
        })),
      });
    }

    // Badges: replace.
    await prisma.productBadge.deleteMany({ where: { productId: product.id } });
    if (p.badges.length) {
      await prisma.productBadge.createMany({
        data: p.badges.map((b) => ({ productId: product.id, badgeCode: b as PrismaBadgeCode })),
        skipDuplicates: true,
      });
    }

    // Translations: upsert per locale.
    for (const t of p.translations) {
      await prisma.productTranslation.upsert({
        where: {
          productId_locale: { productId: product.id, locale: t.locale as PrismaLocaleCode },
        },
        create: {
          productId: product.id,
          locale: t.locale as PrismaLocaleCode,
          name: t.name,
          shortDescription: t.shortDescription ?? null,
          description: t.description ?? null,
        },
        update: {
          name: t.name,
          shortDescription: t.shortDescription ?? null,
          description: t.description ?? null,
        },
      });
    }
  }
}

async function seedNews(): Promise<void> {
  for (const n of news) {
    const base = {
      title: n.title,
      commodity: n.commodity,
      publishedAt: new Date(n.publishedAt),
      priceLabel: n.priceLabel,
      changeLabel: n.changeLabel,
      changeDirection: n.changeDirection as PrismaChangeDirection,
      outlook: n.outlook as PrismaOutlook,
      summary: n.summary,
      body: n.body,
      status: n.status as PrismaProductStatus,
      sortOrder: n.sortOrder,
    } satisfies Omit<Prisma.NewsArticleUncheckedCreateInput, 'slug'>;

    const article = await prisma.newsArticle.upsert({
      where: { slug: n.slug },
      create: { slug: n.slug, ...base },
      update: base,
    });

    for (const t of n.translations) {
      await prisma.newsTranslation.upsert({
        where: {
          articleId_locale: { articleId: article.id, locale: t.locale as PrismaLocaleCode },
        },
        create: {
          articleId: article.id,
          locale: t.locale as PrismaLocaleCode,
          title: t.title,
          summary: t.summary ?? null,
          body: t.body ?? null,
        },
        update: { title: t.title, summary: t.summary ?? null, body: t.body ?? null },
      });
    }
  }
}

async function seedProcessSteps(): Promise<void> {
  for (const s of processSteps) {
    const row = await prisma.processStep.upsert({
      where: { key: s.key },
      create: {
        stepNo: s.stepNo,
        key: s.key,
        title: s.title,
        subtitle: s.subtitle,
        icon: s.icon,
        sortOrder: s.sortOrder,
      },
      update: {
        stepNo: s.stepNo,
        title: s.title,
        subtitle: s.subtitle,
        icon: s.icon,
        sortOrder: s.sortOrder,
      },
    });

    // Per-locale title/subtitle overrides (RU/UZ). EN lives on the base row above.
    for (const t of s.translations ?? []) {
      await prisma.processStepTranslation.upsert({
        where: {
          processStepId_locale: { processStepId: row.id, locale: t.locale as PrismaLocaleCode },
        },
        create: {
          processStepId: row.id,
          locale: t.locale as PrismaLocaleCode,
          title: t.title,
          subtitle: t.subtitle ?? null,
        },
        update: { title: t.title, subtitle: t.subtitle ?? null },
      });
    }
  }
}

async function seedSiteStats(): Promise<void> {
  for (const s of siteStats) {
    const row = await prisma.siteStat.upsert({
      where: { key: s.key },
      create: {
        key: s.key,
        label: s.label,
        value: s.value,
        group: s.group as PrismaSiteStatGroup,
        sortOrder: s.sortOrder,
      },
      update: {
        label: s.label,
        value: s.value,
        group: s.group as PrismaSiteStatGroup,
        sortOrder: s.sortOrder,
      },
    });

    // Per-locale label/value overrides (RU/UZ). EN lives on the base row above.
    for (const t of s.translations ?? []) {
      await prisma.siteStatTranslation.upsert({
        where: { siteStatId_locale: { siteStatId: row.id, locale: t.locale as PrismaLocaleCode } },
        create: {
          siteStatId: row.id,
          locale: t.locale as PrismaLocaleCode,
          label: t.label,
          value: t.value,
        },
        update: { label: t.label, value: t.value },
      });
    }
  }
}

async function seedSiteContent(): Promise<void> {
  for (const c of siteContent) {
    const valueJson = c.valueJson as Prisma.InputJsonValue;
    const row = await prisma.siteContent.upsert({
      where: { key: c.key },
      create: { key: c.key, valueJson },
      update: { valueJson },
    });

    // Per-locale overrides (RU/UZ). EN lives on the base row above.
    for (const t of c.translations ?? []) {
      const tValueJson = t.valueJson as Prisma.InputJsonValue;
      await prisma.siteContentTranslation.upsert({
        where: {
          siteContentId_locale: { siteContentId: row.id, locale: t.locale as PrismaLocaleCode },
        },
        create: {
          siteContentId: row.id,
          locale: t.locale as PrismaLocaleCode,
          valueJson: tValueJson,
        },
        update: { valueJson: tValueJson },
      });
    }
  }
}

async function seedTranslations(): Promise<void> {
  for (const t of translations) {
    const rows: { locale: PrismaLocaleCode; value: string }[] = [
      { locale: 'EN', value: t.en },
      { locale: 'RU', value: t.ru },
      { locale: 'UZ', value: t.uz },
    ];
    for (const { locale, value } of rows) {
      await prisma.translation.upsert({
        where: { namespace_key_locale: { namespace: t.namespace, key: t.key, locale } },
        create: { namespace: t.namespace, key: t.key, locale, value },
        update: { value },
      });
    }
  }
}

async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      '⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set in apps/api/.env — skipping admin user seed.',
    );
    return;
  }
  // `seedAdmin` only calls prisma.user.upsert and PasswordService.hash (argon2 only),
  // so the plain client + a bare PasswordService satisfy its signature without a Nest context.
  const passwords = new PasswordService();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural reuse of the canonical helper
  const admin = await seedAdmin(prisma as any, passwords, email, password);
  console.log(`  admin user: ${admin.email}`);
}

async function main(): Promise<void> {
  console.log('Seeding ALTAN database…');
  const { categoryIds, regionIds } = await seedTaxonomy();
  console.log(
    `  taxonomy: ${categories.length} categories, ${regions.length} regions, ${badges.length} badges`,
  );

  await seedProducts(categoryIds, regionIds);
  const featuredCount = products.filter((p) => p.featured).length;
  console.log(`  products: ${products.length} (${featuredCount} featured)`);

  await seedNews();
  console.log(`  news: ${news.length} articles`);

  await seedProcessSteps();
  console.log(`  process steps: ${processSteps.length}`);

  await seedSiteStats();
  console.log(`  site stats: ${siteStats.length}`);

  await seedSiteContent();
  const contentTranslations = siteContent.reduce((n, c) => n + (c.translations?.length ?? 0), 0);
  console.log(
    `  site content: ${siteContent.length} keys (+${contentTranslations} locale overrides)`,
  );

  await seedTranslations();
  console.log(`  translations: ${translations.length} keys × 3 locales`);

  await seedAdminUser();

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
