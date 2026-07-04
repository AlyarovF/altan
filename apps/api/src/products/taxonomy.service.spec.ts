import { NotFoundException } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import type { UpsertRegionTranslationDto } from './dto/taxonomy.dto';

type AnyFn = jest.Mock;

/**
 * In-memory Region dataset driving a mocked Prisma client. EN lives on `Region.name`; RU/UZ
 * live in `translations`. The findMany mock honours an `include.translations.where.locale`
 * filter so the service's EN-fallback logic is exercised.
 */
const REGIONS = [
  {
    id: 'region-ca',
    code: 'ca',
    name: 'Central Asia',
    sortOrder: 1,
    translations: [
      { id: 'rt-ca-ru', locale: 'RU', name: 'Центральная Азия' },
      { id: 'rt-ca-uz', locale: 'UZ', name: 'Markaziy Osiyo' },
    ],
  },
  {
    id: 'region-eu',
    code: 'eu',
    name: 'Europe',
    sortOrder: 2,
    // Only RU present → UZ must fall back to EN.
    translations: [{ id: 'rt-eu-ru', locale: 'RU', name: 'Европа' }],
  },
];

function filterTranslations(
  row: (typeof REGIONS)[number],
  include?: { translations?: boolean | { where?: { locale?: string } } },
): (typeof REGIONS)[number] {
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

interface Mocks {
  region: { findMany: AnyFn; findUnique: AnyFn; update: AnyFn };
  regionTranslation: { findUnique: AnyFn; upsert: AnyFn };
}

function makeDeps() {
  const prisma: Mocks = {
    region: {
      findMany: jest.fn(({ include }: { include?: never }) =>
        REGIONS.map((r) => filterTranslations(r, include)),
      ),
      findUnique: jest.fn(({ where, include }: { where: { id: string }; include?: never }) => {
        const row = REGIONS.find((r) => r.id === where.id);
        return row ? filterTranslations(row, include) : null;
      }),
      update: jest.fn(({ where, data }: { where: { id: string }; data: { name: string } }) => {
        const row = REGIONS.find((r) => r.id === where.id)!;
        return { ...row, name: data.name };
      }),
    },
    regionTranslation: {
      findUnique: jest.fn(
        ({ where }: { where: { regionId_locale: { regionId: string; locale: string } } }) => {
          const region = REGIONS.find((r) => r.id === where.regionId_locale.regionId);
          return (
            region?.translations.find((t) => t.locale === where.regionId_locale.locale) ?? null
          );
        },
      ),
      upsert: jest.fn(({ create }: { create: { name: string } }) => ({
        id: 'rt-new',
        name: create.name,
      })),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new TaxonomyService(prisma as never, audit as never);
  return { service, prisma, audit };
}

describe('TaxonomyService — Region locale resolution', () => {
  it('returns EN base names when no locale is given (back-compat)', async () => {
    const { service } = makeDeps();
    const rows = await service.listRegions();
    expect(rows.map((r) => r.name)).toEqual(['Central Asia', 'Europe']);
  });

  it('returns RU overrides when present and falls back to EN otherwise', async () => {
    const { service } = makeDeps();
    const ru = await service.listRegions('ru');
    expect(ru.map((r) => r.name)).toEqual(['Центральная Азия', 'Европа']);

    const uz = await service.listRegions('uz');
    // ca has UZ; eu has none → EN fallback
    expect(uz.map((r) => r.name)).toEqual(['Markaziy Osiyo', 'Europe']);
  });

  it('getRegionLocales returns all three locale values with null for missing overrides', async () => {
    const { service } = makeDeps();
    const res = await service.getRegionLocales('region-eu');
    expect(res).toEqual({
      id: 'region-eu',
      code: 'eu',
      values: { en: 'Europe', ru: 'Европа', uz: null },
    });
  });

  it('getRegionLocales throws NotFound for an unknown id', async () => {
    const { service } = makeDeps();
    await expect(service.getRegionLocales('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('upsert EN writes the base name and audits Region', async () => {
    const { service, prisma, audit } = makeDeps();
    const dto: UpsertRegionTranslationDto = { name: 'Central Asia (CIS)' };
    const res = await service.upsertRegionTranslation('region-ca', dto, 'actor-1');
    expect(prisma.region.update).toHaveBeenCalledTimes(1);
    expect(prisma.regionTranslation.upsert).not.toHaveBeenCalled();
    expect(res).toMatchObject({ code: 'ca', name: 'Central Asia (CIS)' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'Region', entityId: 'region-ca', action: 'UPDATE' }),
    );
  });

  it('upsert RU writes an override, audits a locale-scoped entityId, and returns the localized dto', async () => {
    const { service, prisma, audit } = makeDeps();
    const dto: UpsertRegionTranslationDto = { name: 'Средняя Азия', locale: 'ru' };
    const res = await service.upsertRegionTranslation('region-ca', dto, 'actor-1');
    expect(prisma.regionTranslation.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.region.update).not.toHaveBeenCalled();
    expect(res).toMatchObject({ code: 'ca', name: 'Средняя Азия' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'Region', entityId: 'region-ca:ru', action: 'UPDATE' }),
    );
  });

  it('upsert rejects when the region id does not exist', async () => {
    const { service } = makeDeps();
    await expect(
      service.upsertRegionTranslation('missing', { name: 'x', locale: 'ru' }, 'actor-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
