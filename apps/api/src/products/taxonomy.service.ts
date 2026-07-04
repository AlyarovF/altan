import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeCode as PrismaBadgeCode, LocaleCode as PrismaLocaleCode } from '@prisma/client';
import { BadgeCode } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { toLocaleCode } from '../common/dto/locale-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BadgeDto,
  CategoryDto,
  CreateCategoryDto,
  CreateRegionDto,
  RegionDto,
  RegionLocalesDto,
  UpdateCategoryDto,
  UpdateRegionDto,
  UpsertBadgeDto,
  UpsertRegionTranslationDto,
} from './dto/taxonomy.dto';

@Injectable()
export class TaxonomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Categories -----------------------------------------------------------

  async listCategories(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder }));
  }

  async createCategory(dto: CreateCategoryDto, actorId: string): Promise<CategoryDto> {
    const c = await this.prisma.category.create({
      data: { slug: dto.slug, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'Category',
      entityId: c.id,
      after: c,
    });
    return { id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder };
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorId: string): Promise<CategoryDto> {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Category not found.');
    const c = await this.prisma.category.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Category',
      entityId: id,
      before,
      after: c,
    });
    return { id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder };
  }

  async removeCategory(id: string, actorId: string): Promise<void> {
    const before = await this.prisma.category.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Category not found.');
    await this.prisma.category.delete({ where: { id } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'Category', entityId: id, before });
  }

  // --- Regions --------------------------------------------------------------

  /**
   * List sourcing regions, each name resolved to `localeParam` (default EN). A region falls
   * back to its EN base name (`Region.name`) when the locale has no override.
   */
  async listRegions(localeParam?: string): Promise<RegionDto[]> {
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const rows = await this.prisma.region.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { translations: { where: { locale } } },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.translations[0]?.name ?? r.name,
      sortOrder: r.sortOrder,
    }));
  }

  async createRegion(dto: CreateRegionDto, actorId: string): Promise<RegionDto> {
    const r = await this.prisma.region.create({
      data: { code: dto.code, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
    await this.audit.log({ actorId, action: 'CREATE', entity: 'Region', entityId: r.id, after: r });
    return { id: r.id, code: r.code, name: r.name, sortOrder: r.sortOrder };
  }

  async updateRegion(id: string, dto: UpdateRegionDto, actorId: string): Promise<RegionDto> {
    const before = await this.prisma.region.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Region not found.');
    const r = await this.prisma.region.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Region',
      entityId: id,
      before,
      after: r,
    });
    return { id: r.id, code: r.code, name: r.name, sortOrder: r.sortOrder };
  }

  async removeRegion(id: string, actorId: string): Promise<void> {
    const before = await this.prisma.region.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Region not found.');
    await this.prisma.region.delete({ where: { id } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'Region', entityId: id, before });
  }

  // --- Region translations (per-locale name) --------------------------------

  /** All locale values for one region: `{ id, code, values: { en, ru, uz } }` (missing → null). */
  async getRegionLocales(id: string): Promise<RegionLocalesDto> {
    const row = await this.prisma.region.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!row) throw new NotFoundException('Region not found.');
    const values: { en: string; ru: string | null; uz: string | null } = {
      en: row.name,
      ru: null,
      uz: null,
    };
    for (const t of row.translations) {
      if (t.locale === PrismaLocaleCode.RU) values.ru = t.name;
      else if (t.locale === PrismaLocaleCode.UZ) values.uz = t.name;
    }
    return { id: row.id, code: row.code, values };
  }

  /**
   * Upsert a region name for a locale (default EN). EN writes the base `Region.name` (the
   * fallback); RU/UZ write a per-locale override on `RegionTranslation`. The region row is the
   * EN base, so a non-EN override always has a fallback. Audited either way.
   */
  async upsertRegionTranslation(
    id: string,
    dto: UpsertRegionTranslationDto,
    actorId: string,
  ): Promise<RegionDto> {
    const localeParam = dto.locale ?? 'en';
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('Region not found.');

    if (locale === PrismaLocaleCode.EN) {
      const updated = await this.prisma.region.update({ where: { id }, data: { name: dto.name } });
      await this.audit.log({
        actorId,
        action: 'UPDATE',
        entity: 'Region',
        entityId: id,
        before: { name: region.name },
        after: { name: updated.name },
      });
      return {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        sortOrder: updated.sortOrder,
      };
    }

    const before = await this.prisma.regionTranslation.findUnique({
      where: { regionId_locale: { regionId: id, locale } },
    });
    const row = await this.prisma.regionTranslation.upsert({
      where: { regionId_locale: { regionId: id, locale } },
      create: { regionId: id, locale, name: dto.name },
      update: { name: dto.name },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'Region',
      entityId: `${id}:${localeParam}`,
      before: before ? { name: before.name } : undefined,
      after: { name: row.name },
    });
    return { id: region.id, code: region.code, name: row.name, sortOrder: region.sortOrder };
  }

  // --- Badges ---------------------------------------------------------------

  async listBadges(): Promise<BadgeDto[]> {
    const rows = await this.prisma.badge.findMany({ orderBy: { code: 'asc' } });
    return rows.map((b) => ({
      code: b.code as BadgeCode,
      label: b.label,
      emoji: b.emoji,
      color: b.color,
    }));
  }

  async upsertBadge(code: BadgeCode, dto: UpsertBadgeDto, actorId: string): Promise<BadgeDto> {
    const before = await this.prisma.badge.findUnique({ where: { code: code as PrismaBadgeCode } });
    const b = await this.prisma.badge.upsert({
      where: { code: code as PrismaBadgeCode },
      create: {
        code: code as PrismaBadgeCode,
        label: dto.label,
        emoji: dto.emoji,
        color: dto.color,
      },
      update: { label: dto.label, emoji: dto.emoji, color: dto.color },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'Badge',
      entityId: b.code,
      before,
      after: b,
    });
    return { code: b.code as BadgeCode, label: b.label, emoji: b.emoji, color: b.color };
  }

  async removeBadge(code: BadgeCode, actorId: string): Promise<void> {
    const before = await this.prisma.badge.findUnique({ where: { code: code as PrismaBadgeCode } });
    if (!before) throw new NotFoundException('Badge not found.');
    await this.prisma.badge.delete({ where: { code: code as PrismaBadgeCode } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'Badge', entityId: code, before });
  }
}
