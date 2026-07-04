import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';
import type {
  UpsertProcessStepTranslationDto,
  UpsertSiteStatTranslationDto,
} from './dto/content.dto';

/**
 * In-memory ProcessStep / SiteStat datasets driving a mocked Prisma client. EN lives on the
 * base row; RU/UZ live in `translations`. The mocks honour an `include.translations.where.locale`
 * filter so the service's EN-fallback logic is exercised end-to-end.
 */
const STEPS = [
  {
    id: 'step-source',
    stepNo: 1,
    key: 'source',
    title: 'Mine-Level Procurement',
    subtitle: 'Source',
    icon: 'pickaxe',
    sortOrder: 1,
    translations: [
      { id: 'st-src-ru', locale: 'RU', title: 'Закупки на уровне рудника', subtitle: 'Источник' },
      { id: 'st-src-uz', locale: 'UZ', title: 'Kon darajasida xarid', subtitle: 'Manba' },
    ],
  },
  {
    id: 'step-confirm',
    stepNo: 4,
    key: 'confirm',
    title: 'Post-Delivery Reporting',
    subtitle: 'Confirm',
    icon: 'check',
    sortOrder: 4,
    // Only RU present → UZ must fall back to EN.
    translations: [
      {
        id: 'st-cfm-ru',
        locale: 'RU',
        title: 'Отчётность после поставки',
        subtitle: 'Подтверждение',
      },
    ],
  },
];

const STATS = [
  {
    id: 'stat-reply',
    key: 'hero.quote_reply',
    label: 'quote reply',
    value: '12h',
    group: 'HERO',
    sortOrder: 3,
    translations: [
      { id: 'ss-reply-ru', locale: 'RU', label: 'ответ на запрос', value: '12ч' },
      { id: 'ss-reply-uz', locale: 'UZ', label: "so'rovga javob", value: '12 soat' },
    ],
  },
  {
    id: 'stat-iso',
    key: 'process.iso',
    label: 'Certified',
    value: 'ISO 9001',
    group: 'PROCESS_BAR',
    sortOrder: 4,
    // No overrides → all locales fall back to EN.
    translations: [] as { id: string; locale: string; label: string; value: string }[],
  },
];

function filterTranslations<T extends { translations: { locale: string }[] }>(
  row: T,
  include?: { translations?: boolean | { where?: { locale?: string } } },
): T {
  const inc = include?.translations;
  if (inc === true) return row;
  if (inc && typeof inc === 'object') {
    const locale = inc.where?.locale;
    return {
      ...row,
      translations: locale ? row.translations.filter((t) => t.locale === locale) : row.translations,
    };
  }
  return { ...row, translations: [] };
}

function makeDeps() {
  const prisma = {
    processStep: {
      findMany: jest.fn(({ include }: { include?: never }) =>
        STEPS.map((s) => filterTranslations(s, include)),
      ),
      findUnique: jest.fn(({ where, include }: { where: { id: string }; include?: never }) => {
        const row = STEPS.find((s) => s.id === where.id);
        return row ? filterTranslations(row, include) : null;
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: { title: string; subtitle: string | null };
        }) => {
          const row = STEPS.find((s) => s.id === where.id)!;
          return { ...row, title: data.title, subtitle: data.subtitle };
        },
      ),
    },
    processStepTranslation: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { processStepId_locale: { processStepId: string; locale: string } };
        }) => {
          const step = STEPS.find((s) => s.id === where.processStepId_locale.processStepId);
          return (
            step?.translations.find((t) => t.locale === where.processStepId_locale.locale) ?? null
          );
        },
      ),
      upsert: jest.fn(({ create }: { create: { title: string; subtitle: string | null } }) => ({
        id: 'st-new',
        title: create.title,
        subtitle: create.subtitle,
      })),
    },
    siteStat: {
      findMany: jest.fn(({ include }: { include?: never }) =>
        STATS.map((s) => filterTranslations(s, include)),
      ),
      findUnique: jest.fn(({ where, include }: { where: { id: string }; include?: never }) => {
        const row = STATS.find((s) => s.id === where.id);
        return row ? filterTranslations(row, include) : null;
      }),
      update: jest.fn(
        ({ where, data }: { where: { id: string }; data: { label: string; value: string } }) => {
          const row = STATS.find((s) => s.id === where.id)!;
          return { ...row, label: data.label, value: data.value };
        },
      ),
    },
    siteStatTranslation: {
      findUnique: jest.fn(
        ({ where }: { where: { siteStatId_locale: { siteStatId: string; locale: string } } }) => {
          const stat = STATS.find((s) => s.id === where.siteStatId_locale.siteStatId);
          return (
            stat?.translations.find((t) => t.locale === where.siteStatId_locale.locale) ?? null
          );
        },
      ),
      upsert: jest.fn(({ create }: { create: { label: string; value: string } }) => ({
        id: 'ss-new',
        label: create.label,
        value: create.value,
      })),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const logger = { log: jest.fn() };
  const redis = { incr: jest.fn() };
  const service = new ContentService(
    prisma as never,
    audit as never,
    logger as never,
    redis as never,
  );
  return { service, prisma, audit };
}

describe('ContentService — ProcessStep locale resolution', () => {
  it('returns EN base title/subtitle when no locale is given (back-compat)', async () => {
    const { service } = makeDeps();
    const steps = await service.listProcessSteps();
    expect(steps[0]).toMatchObject({
      key: 'source',
      title: 'Mine-Level Procurement',
      subtitle: 'Source',
    });
  });

  it('returns the RU override when present and falls back to EN otherwise', async () => {
    const { service } = makeDeps();
    const ru = await service.listProcessSteps('ru');
    expect(ru[0]).toMatchObject({ title: 'Закупки на уровне рудника', subtitle: 'Источник' });
    // confirm has RU
    expect(ru[1]).toMatchObject({ title: 'Отчётность после поставки', subtitle: 'Подтверждение' });

    const uz = await service.listProcessSteps('uz');
    expect(uz[0]).toMatchObject({ title: 'Kon darajasida xarid', subtitle: 'Manba' });
    // confirm has NO uz → EN fallback
    expect(uz[1]).toMatchObject({ title: 'Post-Delivery Reporting', subtitle: 'Confirm' });
  });

  it('getProcessStepLocales returns all three locale values with null for missing overrides', async () => {
    const { service } = makeDeps();
    const res = await service.getProcessStepLocales('step-confirm');
    expect(res).toEqual({
      id: 'step-confirm',
      key: 'confirm',
      values: {
        en: { title: 'Post-Delivery Reporting', subtitle: 'Confirm' },
        ru: { title: 'Отчётность после поставки', subtitle: 'Подтверждение' },
        uz: null,
      },
    });
  });

  it('getProcessStepLocales throws NotFound for an unknown id', async () => {
    const { service } = makeDeps();
    await expect(service.getProcessStepLocales('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('upsert EN writes the base row and audits ProcessStep', async () => {
    const { service, prisma, audit } = makeDeps();
    const dto: UpsertProcessStepTranslationDto = { title: 'New Title', subtitle: 'New' };
    const res = await service.upsertProcessStepTranslation('step-source', dto, 'actor-1');
    expect(prisma.processStep.update).toHaveBeenCalledTimes(1);
    expect(prisma.processStepTranslation.upsert).not.toHaveBeenCalled();
    expect(res).toMatchObject({ key: 'source', title: 'New Title', subtitle: 'New' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'ProcessStep', entityId: 'step-source', action: 'UPDATE' }),
    );
  });

  it('upsert RU writes an override, audits a locale-scoped entityId, and returns the localized dto', async () => {
    const { service, prisma, audit } = makeDeps();
    const dto: UpsertProcessStepTranslationDto = { title: 'Новый', subtitle: 'Шаг', locale: 'ru' };
    const res = await service.upsertProcessStepTranslation('step-source', dto, 'actor-1');
    expect(prisma.processStepTranslation.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.processStep.update).not.toHaveBeenCalled();
    expect(res).toMatchObject({ key: 'source', title: 'Новый', subtitle: 'Шаг' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'ProcessStep',
        entityId: 'step-source:ru',
        action: 'UPDATE',
      }),
    );
  });

  it('upsert rejects a non-EN override when the step id does not exist', async () => {
    const { service } = makeDeps();
    const dto: UpsertProcessStepTranslationDto = { title: 'x', locale: 'ru' };
    await expect(
      service.upsertProcessStepTranslation('missing', dto, 'actor-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ContentService — SiteStat locale resolution', () => {
  it('returns EN base label/value grouped by group when no locale is given', async () => {
    const { service } = makeDeps();
    const grouped = await service.getStats();
    expect(grouped.HERO[0]).toMatchObject({
      key: 'hero.quote_reply',
      label: 'quote reply',
      value: '12h',
    });
    expect(grouped.PROCESS_BAR[0]).toMatchObject({
      key: 'process.iso',
      label: 'Certified',
      value: 'ISO 9001',
    });
  });

  it('localizes label + display value for RU and falls back to EN where missing', async () => {
    const { service } = makeDeps();
    const ru = await service.getStats('ru');
    expect(ru.HERO[0]).toMatchObject({ label: 'ответ на запрос', value: '12ч' });
    // iso has no RU override → EN fallback for both label and value
    expect(ru.PROCESS_BAR[0]).toMatchObject({ label: 'Certified', value: 'ISO 9001' });

    const uz = await service.getStats('uz');
    expect(uz.HERO[0]).toMatchObject({ label: "so'rovga javob", value: '12 soat' });
  });

  it('getStatLocales returns all three locale values with null for missing overrides', async () => {
    const { service } = makeDeps();
    const res = await service.getStatLocales('stat-iso');
    expect(res).toEqual({
      id: 'stat-iso',
      key: 'process.iso',
      values: { en: { label: 'Certified', value: 'ISO 9001' }, ru: null, uz: null },
    });
  });

  it('upsert EN writes the base row; RU writes an override with a locale-scoped audit entityId', async () => {
    const { service, prisma, audit } = makeDeps();
    const en: UpsertSiteStatTranslationDto = { label: 'quote reply', value: '10h' };
    await service.upsertStatTranslation('stat-reply', en, 'actor-1');
    expect(prisma.siteStat.update).toHaveBeenCalledTimes(1);

    const ru: UpsertSiteStatTranslationDto = { label: 'ответ', value: '10ч', locale: 'ru' };
    const res = await service.upsertStatTranslation('stat-reply', ru, 'actor-1');
    expect(prisma.siteStatTranslation.upsert).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ key: 'hero.quote_reply', label: 'ответ', value: '10ч' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'SiteStat', entityId: 'stat-reply:ru' }),
    );
  });

  it('upsert rejects a non-EN override when the stat id does not exist', async () => {
    const { service } = makeDeps();
    await expect(
      service.upsertStatTranslation('missing', { label: 'x', value: 'y', locale: 'ru' }, 'actor-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
