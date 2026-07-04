import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  LocaleCode as PrismaLocaleCode,
  Prisma,
  SiteStatGroup as PrismaStatGroup,
} from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { LocaleCode, SiteStatGroup } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { toLocaleCode } from '../common/dto/locale-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import type {
  ContentItemDto,
  ContentKeyLocalesDto,
  ImportTranslationsResultDto,
  MissingTranslationsDto,
  ProcessStepDto,
  ProcessStepLocalesDto,
  SiteStatDto,
  SiteStatLocalesDto,
  TranslationDto,
  UpsertContentDto,
  UpsertProcessStepDto,
  UpsertProcessStepTranslationDto,
  UpsertSiteStatDto,
  UpsertSiteStatTranslationDto,
  UpsertTranslationDto,
} from './dto/content.dto';

const CONTENT_VERSION_KEY = 'content:version';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly logger: Logger,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // --- Public reads ---------------------------------------------------------

  /**
   * All SiteContent rows as a `{ [key]: valueJson }` map, resolved to `localeParam`
   * (default EN). Each key falls back to the EN base value when the locale has no override.
   */
  async getContentMap(localeParam?: string): Promise<Record<string, unknown>> {
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const rows = await this.prisma.siteContent.findMany({
      include: { translations: { where: { locale } } },
    });
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      // EN is stored on the base row; RU/UZ overrides win when present, else EN base fallback.
      const override = locale !== ('EN' as PrismaLocaleCode) ? row.translations[0] : undefined;
      map[row.key] = override ? override.valueJson : row.valueJson;
    }
    return map;
  }

  /**
   * Ordered process steps, each title/subtitle resolved to `localeParam` (default EN). A step
   * falls back to its EN base (`title`/`subtitle`) when the locale has no override.
   */
  async listProcessSteps(localeParam?: string): Promise<ProcessStepDto[]> {
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const rows = await this.prisma.processStep.findMany({
      orderBy: [{ sortOrder: 'asc' }, { stepNo: 'asc' }],
      include: { translations: { where: { locale } } },
    });
    return rows.map((s) => {
      const t = s.translations[0];
      return {
        id: s.id,
        stepNo: s.stepNo,
        key: s.key,
        title: t?.title ?? s.title,
        subtitle: t?.subtitle ?? s.subtitle,
        icon: s.icon,
        sortOrder: s.sortOrder,
      };
    });
  }

  /**
   * SiteStat grouped by `group`, each ordered by sortOrder, with label/value resolved to
   * `localeParam` (default EN). Falls back to the EN base (`label`/`value`) when there is no
   * override. `value` is a display string ("26+", "12h") that may localize per locale.
   */
  async getStats(localeParam?: string): Promise<Record<string, SiteStatDto[]>> {
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const rows = await this.prisma.siteStat.findMany({
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
      include: { translations: { where: { locale } } },
    });
    const grouped: Record<string, SiteStatDto[]> = { HERO: [], PROCESS_BAR: [] };
    for (const s of rows) {
      const t = s.translations[0];
      const dto: SiteStatDto = {
        id: s.id,
        key: s.key,
        label: t?.label ?? s.label,
        value: t?.value ?? s.value,
        group: s.group as SiteStatGroup,
        sortOrder: s.sortOrder,
      };
      (grouped[s.group] ??= []).push(dto);
    }
    return grouped;
  }

  /** Flattened i18n catalog for a locale: `{ "namespace.key": value }`. */
  async getI18nCatalog(localeParam: string): Promise<Record<string, string>> {
    const locale = toLocaleCode(localeParam);
    const rows = await this.prisma.translation.findMany({
      where: { locale: locale as PrismaLocaleCode },
    });
    const catalog: Record<string, string> = {};
    for (const row of rows) catalog[`${row.namespace}.${row.key}`] = row.value;
    return catalog;
  }

  // --- Admin: SiteContent ---------------------------------------------------

  /** List all content rows (EN base values). Back-compat shape: `{ key, valueJson }[]`. */
  async listContent(): Promise<ContentItemDto[]> {
    const rows = await this.prisma.siteContent.findMany({ orderBy: { key: 'asc' } });
    return rows.map((r) => ({ key: r.key, valueJson: r.valueJson }));
  }

  /** All locale values for one key: `{ key, values: { en, ru, uz } }` (missing RU/UZ → null). */
  async getContentLocales(key: string): Promise<ContentKeyLocalesDto> {
    const row = await this.prisma.siteContent.findUnique({
      where: { key },
      include: { translations: true },
    });
    if (!row) throw new NotFoundException('Content key not found.');
    const values: { en: unknown; ru: unknown | null; uz: unknown | null } = {
      en: row.valueJson,
      ru: null,
      uz: null,
    };
    for (const t of row.translations) {
      if (t.locale === ('RU' as PrismaLocaleCode)) values.ru = t.valueJson;
      else if (t.locale === ('UZ' as PrismaLocaleCode)) values.uz = t.valueJson;
    }
    return { key, values };
  }

  /**
   * Upsert a content value for a locale (default EN). EN writes the base row + fallback;
   * RU/UZ write a per-locale override on `SiteContentTranslation` (the EN base must already
   * exist so there is always a fallback). Audited either way.
   */
  async upsertContent(
    key: string,
    dto: UpsertContentDto,
    actorId: string,
  ): Promise<ContentItemDto> {
    const localeParam = dto.locale ?? 'en';
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const valueJson = dto.valueJson as Prisma.InputJsonValue;

    if (locale === ('EN' as PrismaLocaleCode)) {
      const before = await this.prisma.siteContent.findUnique({ where: { key } });
      const row = await this.prisma.siteContent.upsert({
        where: { key },
        create: { key, valueJson },
        update: { valueJson },
      });
      await this.audit.log({
        actorId,
        action: before ? 'UPDATE' : 'CREATE',
        entity: 'SiteContent',
        entityId: key,
        before: before?.valueJson,
        after: row.valueJson,
      });
      return { key: row.key, valueJson: row.valueJson, locale: 'en' };
    }

    // Non-EN override: requires an existing base row so EN fallback is always defined.
    const base = await this.prisma.siteContent.findUnique({
      where: { key },
      include: { translations: { where: { locale } } },
    });
    if (!base) {
      throw new NotFoundException('Content key not found. Create the default (en) value first.');
    }
    const before = base.translations[0];
    const row = await this.prisma.siteContentTranslation.upsert({
      where: { siteContentId_locale: { siteContentId: base.id, locale } },
      create: { siteContentId: base.id, locale, valueJson },
      update: { valueJson },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'SiteContent',
      entityId: `${key}:${localeParam}`,
      before: before?.valueJson,
      after: row.valueJson,
    });
    return { key, valueJson: row.valueJson, locale: localeParam };
  }

  /**
   * Delete a content key and all its locale overrides (translations cascade), or a single
   * locale override when `localeParam` is a non-EN locale.
   */
  async removeContent(key: string, actorId: string, localeParam?: string): Promise<void> {
    const locale = localeParam ? (toLocaleCode(localeParam) as PrismaLocaleCode) : undefined;

    if (locale && locale !== ('EN' as PrismaLocaleCode)) {
      const base = await this.prisma.siteContent.findUnique({
        where: { key },
        include: { translations: { where: { locale } } },
      });
      const before = base?.translations[0];
      if (!before) throw new NotFoundException('Content translation not found.');
      await this.prisma.siteContentTranslation.delete({ where: { id: before.id } });
      await this.audit.log({
        actorId,
        action: 'DELETE',
        entity: 'SiteContent',
        entityId: `${key}:${localeParam}`,
        before: before.valueJson,
      });
      return;
    }

    const before = await this.prisma.siteContent.findUnique({ where: { key } });
    if (!before) throw new NotFoundException('Content key not found.');
    await this.prisma.siteContent.delete({ where: { key } });
    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'SiteContent',
      entityId: key,
      before: before.valueJson,
    });
  }

  // --- Admin: ProcessStep ---------------------------------------------------

  async upsertProcessStep(dto: UpsertProcessStepDto, actorId: string): Promise<ProcessStepDto> {
    const before = await this.prisma.processStep.findUnique({ where: { key: dto.key } });
    const row = await this.prisma.processStep.upsert({
      where: { key: dto.key },
      create: {
        stepNo: dto.stepNo,
        key: dto.key,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        icon: dto.icon ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
      update: {
        stepNo: dto.stepNo,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        icon: dto.icon ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'ProcessStep',
      entityId: row.id,
      before,
      after: row,
    });
    return {
      id: row.id,
      stepNo: row.stepNo,
      key: row.key,
      title: row.title,
      subtitle: row.subtitle,
      icon: row.icon,
      sortOrder: row.sortOrder,
    };
  }

  async removeProcessStep(id: string, actorId: string): Promise<void> {
    const before = await this.prisma.processStep.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Process step not found.');
    await this.prisma.processStep.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'ProcessStep',
      entityId: id,
      before,
    });
  }

  /** All locale title/subtitle values for one process step (missing RU/UZ → null). */
  async getProcessStepLocales(id: string): Promise<ProcessStepLocalesDto> {
    const row = await this.prisma.processStep.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!row) throw new NotFoundException('Process step not found.');
    const values: ProcessStepLocalesDto['values'] = {
      en: { title: row.title, subtitle: row.subtitle },
      ru: null,
      uz: null,
    };
    for (const t of row.translations) {
      if (t.locale === PrismaLocaleCode.RU) values.ru = { title: t.title, subtitle: t.subtitle };
      else if (t.locale === PrismaLocaleCode.UZ)
        values.uz = { title: t.title, subtitle: t.subtitle };
    }
    return { id: row.id, key: row.key, values };
  }

  /**
   * Upsert a process step's title/subtitle for a locale (default EN). EN writes the base row
   * (the fallback); RU/UZ write a per-locale override. The step row is the EN base, so a
   * non-EN override always has a fallback. Audited either way.
   */
  async upsertProcessStepTranslation(
    id: string,
    dto: UpsertProcessStepTranslationDto,
    actorId: string,
  ): Promise<ProcessStepDto> {
    const localeParam = dto.locale ?? 'en';
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const step = await this.prisma.processStep.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Process step not found.');

    if (locale === PrismaLocaleCode.EN) {
      const updated = await this.prisma.processStep.update({
        where: { id },
        data: { title: dto.title, subtitle: dto.subtitle ?? null },
      });
      await this.audit.log({
        actorId,
        action: 'UPDATE',
        entity: 'ProcessStep',
        entityId: id,
        before: { title: step.title, subtitle: step.subtitle },
        after: { title: updated.title, subtitle: updated.subtitle },
      });
      return this.toProcessStepDto(updated);
    }

    const before = await this.prisma.processStepTranslation.findUnique({
      where: { processStepId_locale: { processStepId: id, locale } },
    });
    const row = await this.prisma.processStepTranslation.upsert({
      where: { processStepId_locale: { processStepId: id, locale } },
      create: { processStepId: id, locale, title: dto.title, subtitle: dto.subtitle ?? null },
      update: { title: dto.title, subtitle: dto.subtitle ?? null },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'ProcessStep',
      entityId: `${id}:${localeParam}`,
      before: before ? { title: before.title, subtitle: before.subtitle } : undefined,
      after: { title: row.title, subtitle: row.subtitle },
    });
    return { ...this.toProcessStepDto(step), title: row.title, subtitle: row.subtitle };
  }

  // --- Admin: SiteStat ------------------------------------------------------

  async upsertStat(dto: UpsertSiteStatDto, actorId: string): Promise<SiteStatDto> {
    const before = await this.prisma.siteStat.findUnique({ where: { key: dto.key } });
    const row = await this.prisma.siteStat.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        label: dto.label,
        value: dto.value,
        group: (dto.group ?? SiteStatGroup.HERO) as PrismaStatGroup,
        sortOrder: dto.sortOrder ?? 0,
      },
      update: {
        label: dto.label,
        value: dto.value,
        group: (dto.group ?? SiteStatGroup.HERO) as PrismaStatGroup,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'SiteStat',
      entityId: row.id,
      before,
      after: row,
    });
    return {
      id: row.id,
      key: row.key,
      label: row.label,
      value: row.value,
      group: row.group as SiteStatGroup,
      sortOrder: row.sortOrder,
    };
  }

  async removeStat(id: string, actorId: string): Promise<void> {
    const before = await this.prisma.siteStat.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Stat not found.');
    await this.prisma.siteStat.delete({ where: { id } });
    await this.audit.log({ actorId, action: 'DELETE', entity: 'SiteStat', entityId: id, before });
  }

  /** All locale label/value values for one stat (missing RU/UZ → null). */
  async getStatLocales(id: string): Promise<SiteStatLocalesDto> {
    const row = await this.prisma.siteStat.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!row) throw new NotFoundException('Stat not found.');
    const values: SiteStatLocalesDto['values'] = {
      en: { label: row.label, value: row.value },
      ru: null,
      uz: null,
    };
    for (const t of row.translations) {
      if (t.locale === PrismaLocaleCode.RU) values.ru = { label: t.label, value: t.value };
      else if (t.locale === PrismaLocaleCode.UZ) values.uz = { label: t.label, value: t.value };
    }
    return { id: row.id, key: row.key, values };
  }

  /**
   * Upsert a stat's label/value for a locale (default EN). EN writes the base row (the
   * fallback); RU/UZ write a per-locale override. `value` is a display string that may localize
   * ("26+", "12h"). The stat row is the EN base, so a non-EN override always has a fallback.
   */
  async upsertStatTranslation(
    id: string,
    dto: UpsertSiteStatTranslationDto,
    actorId: string,
  ): Promise<SiteStatDto> {
    const localeParam = dto.locale ?? 'en';
    const locale = toLocaleCode(localeParam) as PrismaLocaleCode;
    const stat = await this.prisma.siteStat.findUnique({ where: { id } });
    if (!stat) throw new NotFoundException('Stat not found.');

    if (locale === PrismaLocaleCode.EN) {
      const updated = await this.prisma.siteStat.update({
        where: { id },
        data: { label: dto.label, value: dto.value },
      });
      await this.audit.log({
        actorId,
        action: 'UPDATE',
        entity: 'SiteStat',
        entityId: id,
        before: { label: stat.label, value: stat.value },
        after: { label: updated.label, value: updated.value },
      });
      return this.toStatDto(updated);
    }

    const before = await this.prisma.siteStatTranslation.findUnique({
      where: { siteStatId_locale: { siteStatId: id, locale } },
    });
    const row = await this.prisma.siteStatTranslation.upsert({
      where: { siteStatId_locale: { siteStatId: id, locale } },
      create: { siteStatId: id, locale, label: dto.label, value: dto.value },
      update: { label: dto.label, value: dto.value },
    });
    await this.audit.log({
      actorId,
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'SiteStat',
      entityId: `${id}:${localeParam}`,
      before: before ? { label: before.label, value: before.value } : undefined,
      after: { label: row.label, value: row.value },
    });
    return { ...this.toStatDto(stat), label: row.label, value: row.value };
  }

  // --- Admin: Translations --------------------------------------------------

  async listTranslations(namespace?: string): Promise<TranslationDto[]> {
    const rows = await this.prisma.translation.findMany({
      where: namespace ? { namespace } : undefined,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
    });
    return rows.map((r) => this.toTranslationDto(r));
  }

  async upsertTranslation(dto: UpsertTranslationDto, actorId: string): Promise<TranslationDto> {
    const namespace = dto.namespace ?? 'common';
    const locale = toLocaleCode(dto.locale);
    const row = await this.prisma.translation.upsert({
      where: {
        namespace_key_locale: { namespace, key: dto.key, locale: locale as PrismaLocaleCode },
      },
      create: { namespace, key: dto.key, locale: locale as PrismaLocaleCode, value: dto.value },
      update: { value: dto.value },
    });
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Translation',
      entityId: row.id,
      after: { namespace, key: dto.key, locale: dto.locale, value: dto.value },
    });
    return this.toTranslationDto(row);
  }

  async removeTranslation(id: string, actorId: string): Promise<void> {
    const before = await this.prisma.translation.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Translation not found.');
    await this.prisma.translation.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'Translation',
      entityId: id,
      before,
    });
  }

  /** Import a flat `{ [locale]: { "namespace.key": value } }` catalog. */
  async importTranslations(
    data: Record<string, Record<string, string>>,
    actorId: string,
  ): Promise<ImportTranslationsResultDto> {
    const imported: Record<string, number> = {};
    let total = 0;

    for (const [localeKey, entries] of Object.entries(data)) {
      if (!['en', 'ru', 'uz'].includes(localeKey)) continue; // ignore unknown locales
      const locale = toLocaleCode(localeKey) as PrismaLocaleCode;
      let count = 0;
      for (const [flatKey, value] of Object.entries(entries)) {
        const { namespace, key } = this.splitFlatKey(flatKey);
        await this.prisma.translation.upsert({
          where: { namespace_key_locale: { namespace, key, locale } },
          create: { namespace, key, locale, value },
          update: { value },
        });
        count++;
        total++;
      }
      imported[localeKey] = count;
    }

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Translation',
      after: { import: imported, total },
    });
    return { imported, total };
  }

  /** Export translations in the same flat `{ [locale]: { "namespace.key": value } }` shape. */
  async exportTranslations(): Promise<Record<string, Record<string, string>>> {
    const rows = await this.prisma.translation.findMany();
    const out: Record<string, Record<string, string>> = { en: {}, ru: {}, uz: {} };
    for (const row of rows) {
      const localeKey = this.localeKey(row.locale as LocaleCode);
      (out[localeKey] ??= {})[`${row.namespace}.${row.key}`] = row.value;
    }
    return out;
  }

  /** Keys present in EN but missing in RU and/or UZ, as `namespace.key`. */
  async missingTranslations(): Promise<MissingTranslationsDto> {
    const rows = await this.prisma.translation.findMany({
      select: { namespace: true, key: true, locale: true },
    });
    const byLocale: Record<string, Set<string>> = { EN: new Set(), RU: new Set(), UZ: new Set() };
    for (const r of rows) byLocale[r.locale]?.add(`${r.namespace}.${r.key}`);

    const en = byLocale.EN;
    const ru = [...en].filter((k) => !byLocale.RU.has(k)).sort();
    const uz = [...en].filter((k) => !byLocale.UZ.has(k)).sort();
    return { missing: { ru, uz } };
  }

  // --- Revalidation ---------------------------------------------------------

  /**
   * Bump the Redis `content:version` counter. The public site polls/subscribes to this
   * version to trigger ISR revalidation when content changes.
   */
  async revalidate(actorId: string): Promise<{ version: number }> {
    const version = await this.redis.incr(CONTENT_VERSION_KEY);
    this.logger.log(`Content revalidation bumped to v${version}`, ContentService.name);
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'SiteContent',
      entityId: CONTENT_VERSION_KEY,
      after: { version },
    });
    return { version };
  }

  // --- Helpers --------------------------------------------------------------

  private toProcessStepDto(s: {
    id: string;
    stepNo: number;
    key: string;
    title: string;
    subtitle: string | null;
    icon: string | null;
    sortOrder: number;
  }): ProcessStepDto {
    return {
      id: s.id,
      stepNo: s.stepNo,
      key: s.key,
      title: s.title,
      subtitle: s.subtitle,
      icon: s.icon,
      sortOrder: s.sortOrder,
    };
  }

  private toStatDto(s: {
    id: string;
    key: string;
    label: string;
    value: string;
    group: PrismaStatGroup;
    sortOrder: number;
  }): SiteStatDto {
    return {
      id: s.id,
      key: s.key,
      label: s.label,
      value: s.value,
      group: s.group as SiteStatGroup,
      sortOrder: s.sortOrder,
    };
  }

  private splitFlatKey(flatKey: string): { namespace: string; key: string } {
    const dot = flatKey.indexOf('.');
    if (dot === -1) return { namespace: 'common', key: flatKey };
    return { namespace: flatKey.slice(0, dot), key: flatKey.slice(dot + 1) };
  }

  private localeKey(locale: LocaleCode): 'en' | 'ru' | 'uz' {
    switch (locale) {
      case LocaleCode.RU:
        return 'ru';
      case LocaleCode.UZ:
        return 'uz';
      default:
        return 'en';
    }
  }

  private toTranslationDto(row: {
    id: string;
    namespace: string;
    key: string;
    locale: PrismaLocaleCode;
    value: string;
  }): TranslationDto {
    return {
      id: row.id,
      namespace: row.namespace,
      key: row.key,
      locale: this.localeKey(row.locale as LocaleCode),
      value: row.value,
    };
  }
}
