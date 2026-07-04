import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuoteStatus } from '@altan/shared';
import { QuotesService } from './quotes.service';
import { quoteRefPrefix } from './quote-sla.util';

type AnyFn = jest.Mock;

interface MockPrisma {
  quoteRequest: {
    count: AnyFn;
    create: AnyFn;
    findMany: AnyFn;
    findUnique: AnyFn;
    update: AnyFn;
  };
  $transaction: AnyFn;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    quoteRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    // Default: run callback transactions against the same mock; array form returns as-is.
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: MockPrisma) => unknown)(prisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });
  return prisma;
}

function makeService(prisma: MockPrisma): {
  service: QuotesService;
  audit: { log: AnyFn };
  queue: { add: AnyFn };
} {
  const audit = { log: jest.fn() };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const queue = { add: jest.fn() };
  // reason: constructor params are concrete Nest classes; cast lightweight mocks for unit isolation.
  const service = new QuotesService(
    prisma as never,
    audit as never,
    logger as never,
    queue as never,
  );
  return { service, audit, queue };
}

const baseItems = [
  {
    id: 'i1',
    productId: null,
    productNameSnapshot: 'X',
    quantity: { toString: () => '5' },
    unit: 'MTU',
    notes: null,
  },
];

describe('QuotesService', () => {
  describe('create + ref generation', () => {
    it('generates ALT-<year>-000001 for the first quote and enqueues a job', async () => {
      const prisma = makePrisma();
      prisma.quoteRequest.count.mockResolvedValue(0);
      const now = new Date();
      prisma.quoteRequest.create.mockResolvedValue({
        id: 'q1',
        ref: `${quoteRefPrefix(now.getFullYear())}000001`,
        companyName: 'Acme',
        email: 'a@b.com',
        status: 'NEW',
        slaDueAt: now,
        createdAt: now,
        items: baseItems,
      });
      const { service, queue } = makeService(prisma);

      const res = await service.create({
        companyName: 'Acme',
        contactName: 'Jane',
        email: 'a@b.com',
        country: 'DE',
        incoterm: 'CIF',
        destination: 'Hamburg',
        items: [{ productName: 'X', quantity: 5, unit: 'MTU' }],
      });

      expect(res.ref).toMatch(/^ALT-\d{4}-000001$/);
      expect(res.status).toBe(QuoteStatus.NEW);
      expect(queue.add).toHaveBeenCalledWith('quote-created', { quoteId: 'q1', ref: res.ref });
    });

    it('honeypot: returns fake success WITHOUT persisting', async () => {
      const prisma = makePrisma();
      const { service, queue } = makeService(prisma);

      const res = await service.create({
        companyName: 'Bot',
        contactName: 'Bot',
        email: 'bot@spam.com',
        country: 'XX',
        incoterm: 'CIF',
        destination: 'Nowhere',
        items: [{ productName: 'X', quantity: 1, unit: 'kg' }],
        companyWebsite: 'http://spam.example',
      });

      expect(res.status).toBe(QuoteStatus.NEW);
      expect(prisma.quoteRequest.create).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus — QUOTE_STATUS_TRANSITIONS enforcement', () => {
    function quote(status: QuoteStatus) {
      return {
        id: 'q1',
        ref: 'ALT-2026-000001',
        status,
        slaDueAt: new Date(),
        respondedAt: null,
        createdAt: new Date(),
        incoterm: 'CIF',
        source: 'WEB',
        companyName: 'A',
        contactName: 'B',
        email: 'e',
        country: 'DE',
        destination: 'H',
        phone: null,
        message: null,
        responseMessage: null,
        internalNotes: null,
        items: baseItems,
      };
    }

    it('allows a legal transition NEW → IN_REVIEW', async () => {
      const prisma = makePrisma();
      prisma.quoteRequest.findUnique.mockResolvedValue(quote(QuoteStatus.NEW));
      prisma.quoteRequest.update.mockResolvedValue(quote(QuoteStatus.IN_REVIEW));
      const { service } = makeService(prisma);

      const res = await service.changeStatus('q1', QuoteStatus.IN_REVIEW, 'admin');
      expect(res.status).toBe(QuoteStatus.IN_REVIEW);
      expect(prisma.quoteRequest.update).toHaveBeenCalled();
    });

    it('rejects an illegal transition NEW → WON', async () => {
      const prisma = makePrisma();
      prisma.quoteRequest.findUnique.mockResolvedValue(quote(QuoteStatus.NEW));
      const { service } = makeService(prisma);

      await expect(service.changeStatus('q1', QuoteStatus.WON, 'admin')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.quoteRequest.update).not.toHaveBeenCalled();
    });

    it('rejects any transition out of terminal CLOSED', async () => {
      const prisma = makePrisma();
      prisma.quoteRequest.findUnique.mockResolvedValue(quote(QuoteStatus.CLOSED));
      const { service } = makeService(prisma);

      await expect(service.changeStatus('q1', QuoteStatus.WON, 'admin')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('404 when quote missing', async () => {
      const prisma = makePrisma();
      prisma.quoteRequest.findUnique.mockResolvedValue(null);
      const { service } = makeService(prisma);
      await expect(
        service.changeStatus('q1', QuoteStatus.IN_REVIEW, 'admin'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('respond', () => {
    it('advances NEW → QUOTED and records respondedAt', async () => {
      const prisma = makePrisma();
      const q = {
        id: 'q1',
        ref: 'ALT-2026-000001',
        status: 'NEW',
        slaDueAt: new Date(Date.now() + 3_600_000),
        respondedAt: null,
        createdAt: new Date(),
        incoterm: 'CIF',
        source: 'WEB',
        companyName: 'A',
        contactName: 'B',
        email: 'e',
        country: 'DE',
        destination: 'H',
        phone: null,
        message: null,
        responseMessage: null,
        internalNotes: null,
        items: baseItems,
      };
      prisma.quoteRequest.findUnique.mockResolvedValue(q);
      prisma.quoteRequest.update.mockResolvedValue({
        ...q,
        status: 'QUOTED',
        respondedAt: new Date(),
      });
      const { service } = makeService(prisma);

      const res = await service.respond('q1', { responseMessage: 'Here is your price' }, 'admin');
      expect(res.status).toBe(QuoteStatus.QUOTED);
      expect(prisma.quoteRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'QUOTED' }) }),
      );
    });
  });
});
