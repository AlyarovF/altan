import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Currency } from '@altan/shared';
import { ProductsService } from './products.service';
import type { ProductQueryDto } from './dto/product-query.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product-write.dto';

type AnyFn = jest.Mock;

/** Fully-hydrated product row (all relations included) as the service reads it. */
function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    slug: 'tungsten-metal',
    name: 'Tungsten Metal',
    categoryId: 'cat-1',
    regionId: 'region-ca',
    featured: false,
    grade: null,
    hsCode: null,
    standard: null,
    origin: null,
    minOrderQty: null,
    minOrderUnit: null,
    priceAmount: null,
    priceCurrency: null,
    priceUnit: null,
    priceBasis: null,
    priceNote: null,
    priceUpdatedAt: null,
    shortDescription: null,
    description: null,
    imageUrl: null,
    status: 'PUBLISHED',
    sortOrder: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { slug: 'metals-alloys', name: 'Metals & Alloys' },
    region: { code: 'ca', name: 'Central Asia', translations: [] },
    badges: [],
    specs: [],
    translations: [],
    ...overrides,
  };
}

/** Existing row with a full indicative price, for update-path tests. */
function pricedProduct() {
  return makeProduct({
    priceAmount: new Prisma.Decimal('385.5'),
    priceCurrency: 'USD',
    priceUnit: 'mtu',
    priceBasis: 'FCA',
    priceNote: 'Per mtu WO₃, FCA Tashkent.',
    priceUpdatedAt: new Date('2026-06-01T00:00:00.000Z'),
  });
}

interface Mocks {
  product: {
    create: AnyFn;
    update: AnyFn;
    findUnique: AnyFn;
    findUniqueOrThrow: AnyFn;
    findFirst: AnyFn;
    findMany: AnyFn;
    count: AnyFn;
  };
  $transaction: AnyFn;
}

function makeDeps(existing: ReturnType<typeof makeProduct> | null = null) {
  let updatedRow = existing ?? makeProduct();

  const prisma: Mocks = {
    product: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        makeProduct({
          priceAmount: data.priceAmount,
          priceCurrency: data.priceCurrency,
          priceUnit: data.priceUnit,
          priceBasis: data.priceBasis,
          priceNote: data.priceNote,
          priceUpdatedAt: data.priceUpdatedAt,
        }),
      ),
      update: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        updatedRow = { ...updatedRow, ...defined };
        return updatedRow;
      }),
      findUnique: jest.fn(() => existing),
      findUniqueOrThrow: jest.fn(() => updatedRow),
      findFirst: jest.fn(() => existing),
      findMany: jest.fn(() => (existing ? [existing] : [])),
      count: jest.fn(() => (existing ? 1 : 0)),
    },
    // Callback form (create/update) hands the same client back as `tx`; array form
    // (listPublic/listAdmin) resolves the already-invoked mock results.
    $transaction: jest.fn((arg: unknown[] | ((tx: Mocks) => unknown)) =>
      Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
    ),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new ProductsService(prisma as never, audit as never);
  return { service, prisma, audit };
}

const baseCreate: CreateProductDto = {
  slug: 'tungsten-metal',
  name: 'Tungsten Metal',
  categoryId: 'cat-1',
  regionId: 'region-ca',
};

describe('ProductsService — indicative pricing', () => {
  describe('create', () => {
    it('maps the five price fields (Decimal amount) and stamps priceUpdatedAt', async () => {
      const { service, prisma, audit } = makeDeps();
      await service.create(
        {
          ...baseCreate,
          priceAmount: 385.5,
          priceCurrency: Currency.USD,
          priceUnit: 'mtu',
          priceBasis: 'FCA',
          priceNote: 'Per mtu WO₃.',
        },
        'actor-1',
      );

      const { data } = prisma.product.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data.priceAmount).toBeInstanceOf(Prisma.Decimal);
      expect((data.priceAmount as Prisma.Decimal).toString()).toBe('385.5');
      expect(data.priceCurrency).toBe('USD');
      expect(data.priceUnit).toBe('mtu');
      expect(data.priceBasis).toBe('FCA');
      expect(data.priceNote).toBe('Per mtu WO₃.');
      expect(data.priceUpdatedAt).toBeInstanceOf(Date);

      // Snapshot records the price (Decimal → string) for the audit trail.
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'Product',
          action: 'CREATE',
          after: expect.objectContaining({
            priceAmount: '385.5',
            priceCurrency: 'USD',
            priceUnit: 'mtu',
            priceBasis: 'FCA',
            priceNote: 'Per mtu WO₃.',
          }),
        }),
      );
    });

    it('leaves priceUpdatedAt null when no price field is provided', async () => {
      const { service, prisma } = makeDeps();
      await service.create(baseCreate, 'actor-1');
      const { data } = prisma.product.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data.priceAmount).toBeNull();
      expect(data.priceUpdatedAt).toBeNull();
    });

    it('rejects an amount without currency or unit', async () => {
      const { service } = makeDeps();
      await expect(
        service.create({ ...baseCreate, priceAmount: 100, priceUnit: 'kg' }, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.create({ ...baseCreate, priceAmount: 100, priceCurrency: Currency.USD }, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update — priceUpdatedAt bump semantics', () => {
    it('bumps priceUpdatedAt when the amount actually changes', async () => {
      const { service, prisma, audit } = makeDeps(pricedProduct());
      await service.update('prod-1', { priceAmount: 400 }, 'actor-1');

      const { data } = prisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect((data.priceAmount as Prisma.Decimal).toString()).toBe('400');
      expect(data.priceUpdatedAt).toBeInstanceOf(Date);

      // Audit snapshots record before/after price values.
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          before: expect.objectContaining({ priceAmount: '385.5' }),
          after: expect.objectContaining({ priceAmount: '400' }),
        }),
      );
    });

    it('does NOT bump priceUpdatedAt when the resent values are unchanged', async () => {
      const { service, prisma } = makeDeps(pricedProduct());
      await service.update(
        'prod-1',
        {
          priceAmount: 385.5,
          priceCurrency: Currency.USD,
          priceUnit: 'mtu',
          priceBasis: 'FCA',
          priceNote: 'Per mtu WO₃, FCA Tashkent.',
        },
        'actor-1',
      );
      const { data } = prisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data.priceUpdatedAt).toBeUndefined();
    });

    it('does NOT bump priceUpdatedAt when no price field is present in the DTO', async () => {
      const { service, prisma } = makeDeps(pricedProduct());
      await service.update('prod-1', { name: 'Tungsten Metal (updated)' }, 'actor-1');
      const { data } = prisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data.priceAmount).toBeUndefined();
      expect(data.priceUpdatedAt).toBeUndefined();
    });

    it('clears priceAmount to null and bumps priceUpdatedAt', async () => {
      const { service, prisma } = makeDeps(pricedProduct());
      const dto = { priceAmount: null } as unknown as UpdateProductDto;
      await service.update('prod-1', dto, 'actor-1');
      const { data } = prisma.product.update.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data.priceAmount).toBeNull();
      expect(data.priceUpdatedAt).toBeInstanceOf(Date);
    });

    it('rejects a partial update whose effective result has an amount without currency', async () => {
      const { service } = makeDeps(pricedProduct());
      // Amount stays set (from DB) while the currency would be cleared.
      const dto = { priceCurrency: null } as unknown as UpdateProductDto;
      await expect(service.update('prod-1', dto, 'actor-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects setting an amount on a product that has no currency/unit yet', async () => {
      const { service } = makeDeps(makeProduct());
      await expect(
        service.update('prod-1', { priceAmount: 100 }, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listPublic — prices board', () => {
    const baseQuery = { page: 1, limit: 20 } as ProductQueryDto;

    it('card mapper returns priceBasis and priceUpdatedAt per row', async () => {
      const { service } = makeDeps(pricedProduct());
      const result = await service.listPublic(baseQuery);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].priceAmount).toBe('385.5');
      expect(result.data[0].priceBasis).toBe('FCA');
      expect(result.data[0].priceUpdatedAt).toBe('2026-06-01T00:00:00.000Z');
    });

    it('card mapper returns null priceBasis/priceUpdatedAt for an unpriced product', async () => {
      const { service } = makeDeps(makeProduct());
      const result = await service.listPublic(baseQuery);
      expect(result.data[0].priceBasis).toBeNull();
      expect(result.data[0].priceUpdatedAt).toBeNull();
    });

    it('priced=true filters to rows with a non-null priceAmount', async () => {
      const { service, prisma } = makeDeps(pricedProduct());
      await service.listPublic({ ...baseQuery, priced: 'true' });

      const { where } = prisma.product.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(where.priceAmount).toEqual({ not: null });
      // The count query must use the same filter so pagination meta stays consistent.
      const countArgs = prisma.product.count.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(countArgs.where.priceAmount).toEqual({ not: null });
    });

    it('does NOT filter by price when priced is absent or "false"', async () => {
      const { service, prisma } = makeDeps(pricedProduct());
      await service.listPublic(baseQuery);
      await service.listPublic({ ...baseQuery, priced: 'false' });
      for (const call of prisma.product.findMany.mock.calls) {
        const { where } = call[0] as { where: Record<string, unknown> };
        expect(where.priceAmount).toBeUndefined();
      }
    });
  });

  describe('mappers', () => {
    it('getPublicBySlug returns Decimal-as-string card + detail price fields', async () => {
      const { service } = makeDeps(pricedProduct());
      const detail = await service.getPublicBySlug('tungsten-metal');
      expect(detail.priceAmount).toBe('385.5');
      expect(detail.priceCurrency).toBe('USD');
      expect(detail.priceUnit).toBe('mtu');
      expect(detail.priceBasis).toBe('FCA');
      expect(detail.priceNote).toBe('Per mtu WO₃, FCA Tashkent.');
      expect(detail.priceUpdatedAt).toBe('2026-06-01T00:00:00.000Z');
    });

    it('getPublicBySlug returns nulls for an unpriced product ("Price on request")', async () => {
      const { service } = makeDeps(makeProduct());
      const detail = await service.getPublicBySlug('tungsten-metal');
      expect(detail.priceAmount).toBeNull();
      expect(detail.priceCurrency).toBeNull();
      expect(detail.priceUnit).toBeNull();
      expect(detail.priceBasis).toBeNull();
      expect(detail.priceNote).toBeNull();
      expect(detail.priceUpdatedAt).toBeNull();
    });

    it('getAdminById exposes all six price fields', async () => {
      const { service } = makeDeps(pricedProduct());
      const admin = await service.getAdminById('prod-1');
      expect(admin.priceAmount).toBe('385.5');
      expect(admin.priceCurrency).toBe('USD');
      expect(admin.priceUnit).toBe('mtu');
      expect(admin.priceBasis).toBe('FCA');
      expect(admin.priceNote).toBe('Per mtu WO₃, FCA Tashkent.');
      expect(admin.priceUpdatedAt).toBe('2026-06-01T00:00:00.000Z');
    });
  });
});
