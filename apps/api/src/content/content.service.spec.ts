import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';
import type { UpsertContentDto } from './dto/content.dto';

type AnyFn = jest.Mock;

/**
 * In-memory SiteContent dataset used to drive the mocked Prisma client.
 * EN lives on `valueJson`; RU/UZ live in `translations`.
 */
const DATA = [
  {
    id: 'c-tagline',
    key: 'tagline',
    valueJson: 'Where Critical Materials Meet Markets.',
    translations: [
      {
        id: 't-tagline-ru',
        locale: 'RU',
        valueJson: 'Где критически важные материалы встречают рынки.',
      },
      {
        id: 't-tagline-uz',
        locale: 'UZ',
        valueJson: 'Muhim materiallar bozor bilan uchrashadigan joy.',
      },
    ],
  },
  {
    id: 'c-company',
    // Brand constant — no RU/UZ override, so every locale must fall back to EN.
    key: 'companyName',
    valueJson: 'ALTAN Trading House',
    translations: [] as { id: string; locale: string; valueJson: unknown }[],
  },
  {
    id: 'c-badges',
    key: 'trustBadges',
    valueJson: ['ISO 9001:2015', '12h quote response'],
    translations: [
      { id: 't-badges-ru', locale: 'RU', valueJson: ['ISO 9001:2015', 'Ответ на запрос за 12 ч'] },
    ],
  },
];

interface Mocks {
  siteContent: { findMany: AnyFn; findUnique: AnyFn; upsert: AnyFn; delete: AnyFn };
  siteContentTranslation: { upsert: AnyFn; delete: AnyFn };
}

function makeDeps() {
  const prisma: Mocks = {
    siteContent: {
      findMany: jest.fn(
        ({ include }: { include?: { translations?: { where?: { locale?: string } } } }) => {
          const locale = include?.translations?.where?.locale;
          return DATA.map((row) => ({
            ...row,
            translations: locale
              ? row.translations.filter((t) => t.locale === locale)
              : row.translations,
          }));
        },
      ),
      findUnique: jest.fn(
        ({
          where,
          include,
        }: {
          where: { key: string };
          include?: { translations?: { where?: { locale?: string } } };
        }) => {
          const row = DATA.find((r) => r.key === where.key);
          if (!row) return null;
          const locale = include?.translations?.where?.locale;
          if (include?.translations) {
            const translations = locale
              ? row.translations.filter((t) => t.locale === locale)
              : row.translations;
            return { ...row, translations };
          }
          return row;
        },
      ),
      upsert: jest.fn(
        ({ where, update }: { where: { key: string }; update: { valueJson: unknown } }) => ({
          id: 'c-' + where.key,
          key: where.key,
          valueJson: update.valueJson,
        }),
      ),
      delete: jest.fn(() => undefined),
    },
    siteContentTranslation: {
      upsert: jest.fn(({ create }: { create: { valueJson: unknown } }) => ({
        id: 't-new',
        valueJson: create.valueJson,
      })),
      delete: jest.fn(() => undefined),
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

describe('ContentService — SiteContent locale resolution', () => {
  describe('getContentMap', () => {
    it('returns EN base values when no locale is given (back-compat)', async () => {
      const { service } = makeDeps();
      const map = await service.getContentMap();
      expect(map.tagline).toBe('Where Critical Materials Meet Markets.');
      expect(map.companyName).toBe('ALTAN Trading House');
      expect(map.trustBadges).toEqual(['ISO 9001:2015', '12h quote response']);
    });

    it('returns EN base values for locale=en', async () => {
      const { service } = makeDeps();
      const map = await service.getContentMap('en');
      expect(map.tagline).toBe('Where Critical Materials Meet Markets.');
    });

    it('returns the RU override when present', async () => {
      const { service } = makeDeps();
      const map = await service.getContentMap('ru');
      expect(map.tagline).toBe('Где критически важные материалы встречают рынки.');
      expect(map.trustBadges).toEqual(['ISO 9001:2015', 'Ответ на запрос за 12 ч']);
    });

    it('falls back to EN when the locale has no override', async () => {
      const { service } = makeDeps();
      const ru = await service.getContentMap('ru');
      // companyName has no RU override → EN fallback
      expect(ru.companyName).toBe('ALTAN Trading House');
      const uz = await service.getContentMap('uz');
      // trustBadges has no UZ override → EN fallback
      expect(uz.trustBadges).toEqual(['ISO 9001:2015', '12h quote response']);
      // tagline has a UZ override
      expect(uz.tagline).toBe('Muhim materiallar bozor bilan uchrashadigan joy.');
    });
  });

  describe('getContentLocales', () => {
    it('returns all three locale values with null for missing overrides', async () => {
      const { service } = makeDeps();
      const res = await service.getContentLocales('tagline');
      expect(res).toEqual({
        key: 'tagline',
        values: {
          en: 'Where Critical Materials Meet Markets.',
          ru: 'Где критически важные материалы встречают рынки.',
          uz: 'Muhim materiallar bozor bilan uchrashadigan joy.',
        },
      });
    });

    it('reports null for locales without an override', async () => {
      const { service } = makeDeps();
      const res = await service.getContentLocales('companyName');
      expect(res.values).toEqual({ en: 'ALTAN Trading House', ru: null, uz: null });
    });

    it('throws NotFound for an unknown key', async () => {
      const { service } = makeDeps();
      await expect(service.getContentLocales('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('upsertContent', () => {
    it('writes the base row for locale=en (default) and audits SiteContent', async () => {
      const { service, prisma, audit } = makeDeps();
      const dto: UpsertContentDto = { valueJson: 'New tagline' };
      const res = await service.upsertContent('tagline', dto, 'actor-1');
      expect(prisma.siteContent.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.siteContentTranslation.upsert).not.toHaveBeenCalled();
      expect(res).toEqual({ key: 'tagline', valueJson: 'New tagline', locale: 'en' });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'SiteContent', entityId: 'tagline', action: 'UPDATE' }),
      );
    });

    it('writes a translation override for locale=ru and audits with a locale-scoped entityId', async () => {
      const { service, prisma, audit } = makeDeps();
      const dto: UpsertContentDto = { valueJson: 'Новый слоган', locale: 'ru' };
      const res = await service.upsertContent('tagline', dto, 'actor-1');
      expect(prisma.siteContentTranslation.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.siteContent.upsert).not.toHaveBeenCalled();
      expect(res).toEqual({ key: 'tagline', valueJson: 'Новый слоган', locale: 'ru' });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'SiteContent', entityId: 'tagline:ru' }),
      );
    });

    it('rejects a non-EN override when the base key does not exist', async () => {
      const { service } = makeDeps();
      const dto: UpsertContentDto = { valueJson: 'x', locale: 'ru' };
      await expect(service.upsertContent('missing', dto, 'actor-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
