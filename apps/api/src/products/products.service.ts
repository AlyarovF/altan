import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LocaleCode as PrismaLocaleCode,
  Prisma,
  ProductStatus as PrismaProductStatus,
} from '@prisma/client';
import { BadgeCode, LocaleCode, ProductStatus } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { toLocaleCode } from '../common/dto/locale-query.dto';
import { paginate, toSkipTake, type Paginated } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { ProductQueryDto } from './dto/product-query.dto';
import type {
  AdminProductDetailDto,
  AdminProductDto,
  ProductCardDto,
  ProductDetailDto,
} from './dto/product-response.dto';
import type {
  CreateProductDto,
  ProductTranslationInputDto,
  ReorderDto,
  UpdateProductDto,
} from './dto/product-write.dto';

const productInclude = {
  category: true,
  region: { include: { translations: true } },
  badges: true,
  specs: { orderBy: { sortOrder: 'asc' } },
  translations: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Public reads ---------------------------------------------------------

  async listPublic(query: ProductQueryDto): Promise<Paginated<ProductCardDto>> {
    const locale = toLocaleCode(query.locale);
    const where = this.buildWhere(query, PrismaProductStatus.PUBLISHED);
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: this.buildOrderBy(query.sort),
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      rows.map((p) => this.toCard(p, locale)),
      total,
      query.page,
      query.limit,
    );
  }

  async getPublicBySlug(slug: string, localeQuery?: string): Promise<ProductDetailDto> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: PrismaProductStatus.PUBLISHED },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return this.toDetail(product, toLocaleCode(localeQuery));
  }

  // --- Admin reads ----------------------------------------------------------

  async listAdmin(query: ProductQueryDto): Promise<Paginated<AdminProductDto>> {
    const where = this.buildWhere(query, undefined);
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: this.buildOrderBy(query.sort),
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      rows.map((p) => this.toAdmin(p)),
      total,
      query.page,
      query.limit,
    );
  }

  /** Full editable product (all scalars + categoryId/regionId + specs + badges + translations). */
  async getAdminById(id: string): Promise<AdminProductDetailDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return this.toAdminDetail(product);
  }

  // --- Admin writes ---------------------------------------------------------

  async create(dto: CreateProductDto, actorId: string): Promise<AdminProductDto> {
    const created = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          categoryId: dto.categoryId,
          regionId: dto.regionId,
          featured: dto.featured ?? false,
          status: (dto.status ?? ProductStatus.DRAFT) as PrismaProductStatus,
          grade: dto.grade ?? null,
          hsCode: dto.hsCode ?? null,
          standard: dto.standard ?? null,
          origin: dto.origin ?? null,
          minOrderQty: dto.minOrderQty != null ? new Prisma.Decimal(dto.minOrderQty) : null,
          minOrderUnit: dto.minOrderUnit ?? null,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          imageUrl: dto.imageUrl ?? null,
          sortOrder: dto.sortOrder ?? 0,
          specs: dto.specs?.length
            ? { create: dto.specs.map((s, i) => this.specData(s, i)) }
            : undefined,
          badges: dto.badges?.length
            ? { create: dedupe(dto.badges).map((b) => ({ badgeCode: b })) }
            : undefined,
          translations: dto.translations?.length
            ? { create: dto.translations.map((t) => this.translationData(t)) }
            : undefined,
        },
        include: productInclude,
      });
      return product;
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'Product',
      entityId: created.id,
      after: this.snapshot(created),
    });
    return this.toAdmin(created);
  }

  async update(id: string, dto: UpdateProductDto, actorId: string): Promise<AdminProductDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!existing) throw new NotFoundException('Product not found.');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          slug: dto.slug,
          name: dto.name,
          categoryId: dto.categoryId,
          regionId: dto.regionId,
          featured: dto.featured,
          status: dto.status as PrismaProductStatus | undefined,
          grade: dto.grade,
          hsCode: dto.hsCode,
          standard: dto.standard,
          origin: dto.origin,
          minOrderQty:
            dto.minOrderQty !== undefined
              ? dto.minOrderQty != null
                ? new Prisma.Decimal(dto.minOrderQty)
                : null
              : undefined,
          minOrderUnit: dto.minOrderUnit,
          shortDescription: dto.shortDescription,
          description: dto.description,
          imageUrl: dto.imageUrl,
          sortOrder: dto.sortOrder,
        },
      });

      // Provided nested arrays REPLACE the existing rows.
      if (dto.specs) {
        await tx.productSpec.deleteMany({ where: { productId: id } });
        if (dto.specs.length) {
          await tx.productSpec.createMany({
            data: dto.specs.map((s, i) => ({ ...this.specData(s, i), productId: id })),
          });
        }
      }
      if (dto.badges) {
        await tx.productBadge.deleteMany({ where: { productId: id } });
        if (dto.badges.length) {
          await tx.productBadge.createMany({
            data: dedupe(dto.badges).map((b) => ({ productId: id, badgeCode: b })),
          });
        }
      }
      if (dto.translations) {
        for (const t of dto.translations) {
          const loc = toLocaleCode(t.locale);
          await tx.productTranslation.upsert({
            where: { productId_locale: { productId: id, locale: loc } },
            create: { ...this.translationData(t), productId: id },
            update: {
              name: t.name,
              shortDescription: t.shortDescription ?? null,
              description: t.description ?? null,
            },
          });
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      before: this.snapshot(existing),
      after: this.snapshot(updated),
    });
    return this.toAdmin(updated);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!existing) throw new NotFoundException('Product not found.');
    await this.prisma.product.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      before: this.snapshot(existing),
    });
  }

  async reorder(dto: ReorderDto, actorId: string): Promise<void> {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Product',
      after: { reorder: dto.items },
    });
  }

  // --- Query builders -------------------------------------------------------

  private buildWhere(
    query: ProductQueryDto,
    status?: PrismaProductStatus,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (status) where.status = status;
    if (query.category) where.category = { slug: query.category };
    if (query.region) where.region = { code: query.region };
    if (query.featured !== undefined) where.featured = query.featured === 'true';
    if (query.badge) where.badges = { some: { badgeCode: query.badge as BadgeCode } };
    if (query.q) {
      const q = query.q;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { grade: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case '-sortOrder':
        return [{ sortOrder: 'desc' }, { createdAt: 'desc' }];
      case 'createdAt':
        return [{ createdAt: 'asc' }];
      case '-createdAt':
        return [{ createdAt: 'desc' }];
      case 'name':
        return [{ name: 'asc' }];
      case '-name':
        return [{ name: 'desc' }];
      case 'sortOrder':
      default:
        return [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
    }
  }

  // --- Mappers --------------------------------------------------------------

  private localized(
    product: ProductWithRelations,
    locale: LocaleCode,
  ): { name: string; shortDescription: string | null; description: string | null } {
    const t = product.translations.find((tr) => tr.locale === locale);
    return {
      name: t?.name ?? product.name,
      shortDescription: t?.shortDescription ?? product.shortDescription ?? null,
      description: t?.description ?? product.description ?? null,
    };
  }

  private toCard(product: ProductWithRelations, locale: LocaleCode): ProductCardDto {
    const l = this.localized(product, locale);
    return {
      id: product.id,
      slug: product.slug,
      name: l.name,
      shortDescription: l.shortDescription,
      grade: product.grade,
      badges: product.badges.map((b) => b.badgeCode as BadgeCode),
      minOrderQty: product.minOrderQty ? product.minOrderQty.toString() : null,
      minOrderUnit: product.minOrderUnit,
      hsCode: product.hsCode,
      imageUrl: product.imageUrl,
      region: {
        code: product.region.code,
        name:
          product.region.translations.find((t) => t.locale === locale)?.name ?? product.region.name,
      },
      category: { slug: product.category.slug, name: product.category.name },
      featured: product.featured,
    };
  }

  private toDetail(product: ProductWithRelations, locale: LocaleCode): ProductDetailDto {
    const card = this.toCard(product, locale);
    const l = this.localized(product, locale);
    return {
      ...card,
      description: l.description,
      standard: product.standard,
      origin: product.origin,
      specs: product.specs.map((s) => ({
        id: s.id,
        label: s.label,
        value: s.value,
        unit: s.unit,
        sortOrder: s.sortOrder,
      })),
    };
  }

  private toAdmin(product: ProductWithRelations): AdminProductDto {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      status: product.status as ProductStatus,
      featured: product.featured,
      sortOrder: product.sortOrder,
      category: { slug: product.category.slug, name: product.category.name },
      region: { code: product.region.code, name: product.region.name },
      badges: product.badges.map((b) => b.badgeCode as BadgeCode),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private toAdminDetail(product: ProductWithRelations): AdminProductDetailDto {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      regionId: product.regionId,
      status: product.status as ProductStatus,
      featured: product.featured,
      sortOrder: product.sortOrder,
      grade: product.grade,
      hsCode: product.hsCode,
      standard: product.standard,
      origin: product.origin,
      minOrderQty: product.minOrderQty ? product.minOrderQty.toString() : null,
      minOrderUnit: product.minOrderUnit,
      shortDescription: product.shortDescription,
      description: product.description,
      imageUrl: product.imageUrl,
      category: { slug: product.category.slug, name: product.category.name },
      region: { code: product.region.code, name: product.region.name },
      badges: product.badges.map((b) => b.badgeCode as BadgeCode),
      specs: product.specs.map((s) => ({
        id: s.id,
        label: s.label,
        value: s.value,
        unit: s.unit,
        sortOrder: s.sortOrder,
      })),
      translations: product.translations.map((t) => ({
        locale: this.localeKey(t.locale),
        name: t.name,
        shortDescription: t.shortDescription,
        description: t.description,
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private localeKey(locale: PrismaLocaleCode): 'en' | 'ru' | 'uz' {
    switch (locale) {
      case PrismaLocaleCode.RU:
        return 'ru';
      case PrismaLocaleCode.UZ:
        return 'uz';
      default:
        return 'en';
    }
  }

  private specData(
    s: { label: string; value: string; unit?: string; sortOrder?: number },
    i: number,
  ) {
    return { label: s.label, value: s.value, unit: s.unit ?? null, sortOrder: s.sortOrder ?? i };
  }

  private translationData(t: ProductTranslationInputDto) {
    return {
      locale: toLocaleCode(t.locale),
      name: t.name,
      shortDescription: t.shortDescription ?? null,
      description: t.description ?? null,
    };
  }

  /** JSON-safe audit snapshot (Decimal → string). */
  private snapshot(product: ProductWithRelations): Record<string, unknown> {
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      status: product.status,
      featured: product.featured,
      categoryId: product.categoryId,
      regionId: product.regionId,
      grade: product.grade,
      hsCode: product.hsCode,
      imageUrl: product.imageUrl,
      minOrderQty: product.minOrderQty?.toString() ?? null,
      minOrderUnit: product.minOrderUnit,
      sortOrder: product.sortOrder,
      badges: product.badges.map((b) => b.badgeCode),
      specs: product.specs.map((s) => ({ label: s.label, value: s.value, unit: s.unit })),
    };
  }
}

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
