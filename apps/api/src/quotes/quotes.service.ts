import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Incoterm as PrismaIncoterm,
  Prisma,
  QuoteSource as PrismaQuoteSource,
  QuoteStatus as PrismaQuoteStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import { Incoterm, QuoteSource, QuoteStatus, QUOTE_STATUS_TRANSITIONS } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { paginate, toSkipTake, type Paginated } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QUOTE_NOTIFICATIONS_QUEUE, QUOTE_CREATED_JOB } from './quotes.constants';
import {
  computeSlaDueAt,
  formatQuoteRef,
  isOverdue,
  isSlaMet,
  quoteRefPrefix,
} from './quote-sla.util';
import type {
  AdminQuoteDetailDto,
  AdminQuoteListItemDto,
  AdminQuoteQueryDto,
  CreateQuoteRequestDto,
  CreateQuoteResponseDto,
  QuoteAuditEntryDto,
  QuoteItemDto,
  RespondQuoteDto,
} from './dto/quote.dto';

const quoteInclude = { items: true } satisfies Prisma.QuoteRequestInclude;
type QuoteWithItems = Prisma.QuoteRequestGetPayload<{ include: typeof quoteInclude }>;

const MAX_REF_RETRIES = 5;

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly logger: Logger,
    @InjectQueue(QUOTE_NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  // --- Public create --------------------------------------------------------

  async create(dto: CreateQuoteRequestDto): Promise<CreateQuoteResponseDto> {
    // Honeypot: a filled hidden field means a bot. Return a fake success, persist nothing.
    if (dto.companyWebsite && dto.companyWebsite.trim() !== '') {
      this.logger.warn(
        `Spam quote dropped (honeypot) from ${dto.email} / ${dto.companyName}`,
        QuotesService.name,
      );
      const now = new Date();
      return {
        ref: formatQuoteRef(now.getFullYear(), 0),
        slaDueAt: computeSlaDueAt(now).toISOString(),
        status: QuoteStatus.NEW,
        createdAt: now.toISOString(),
      };
    }

    const created = await this.createWithRefRetry(dto);

    // Enqueue async notification (sales alert + buyer ack); never block the request on email.
    await this.queue.add(QUOTE_CREATED_JOB, { quoteId: created.id, ref: created.ref });

    await this.audit.log({
      action: 'CREATE',
      entity: 'QuoteRequest',
      entityId: created.id,
      after: { ref: created.ref, company: created.companyName, email: created.email },
    });

    return {
      ref: created.ref,
      slaDueAt: created.slaDueAt?.toISOString() ?? null,
      status: created.status as QuoteStatus,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /** Generate ref + persist; retry up to MAX_REF_RETRIES on unique collision. */
  private async createWithRefRetry(dto: CreateQuoteRequestDto): Promise<QuoteWithItems> {
    for (let attempt = 0; attempt < MAX_REF_RETRIES; attempt++) {
      const ref = await this.nextRef();
      try {
        return await this.prisma.$transaction(async (tx) => {
          const now = new Date();
          return tx.quoteRequest.create({
            data: {
              ref,
              companyName: dto.companyName,
              contactName: dto.contactName,
              email: dto.email,
              phone: dto.phone ?? null,
              country: dto.country,
              incoterm: dto.incoterm as PrismaIncoterm,
              destination: dto.destination,
              message: dto.message ?? null,
              status: PrismaQuoteStatus.NEW,
              source: PrismaQuoteSource.WEB,
              slaDueAt: computeSlaDueAt(now),
              items: {
                create: dto.items.map((i) => ({
                  productId: i.productId ?? null,
                  productNameSnapshot: i.productName,
                  quantity: new Prisma.Decimal(i.quantity),
                  unit: i.unit,
                  notes: i.notes ?? null,
                })),
              },
            },
            include: quoteInclude,
          });
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < MAX_REF_RETRIES - 1
        ) {
          // Ref collided with a concurrent insert — recompute and retry.
          continue;
        }
        throw err;
      }
    }
    throw new BadRequestException('Could not allocate a unique quote reference; please retry.');
  }

  /** Year-scoped monotonic counter: count(existing this year) + 1. */
  private async nextRef(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.quoteRequest.count({
      where: { ref: { startsWith: quoteRefPrefix(year) } },
    });
    return formatQuoteRef(year, count + 1);
  }

  // --- Admin reads ----------------------------------------------------------

  async listAdmin(query: AdminQuoteQueryDto): Promise<Paginated<AdminQuoteListItemDto>> {
    const where: Prisma.QuoteRequestWhereInput = {};
    if (query.status) where.status = query.status as PrismaQuoteStatus;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }
    if (query.search) {
      const s = query.search;
      where.OR = [
        { ref: { contains: s, mode: 'insensitive' } },
        { companyName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
      ];
    }
    const now = new Date();
    if (query.overdue === 'true') {
      where.respondedAt = null;
      where.slaDueAt = { lt: now };
    } else if (query.overdue === 'false') {
      where.OR = [{ respondedAt: { not: null } }, { slaDueAt: { gte: now } }, { slaDueAt: null }];
    }

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.quoteRequest.findMany({
        where,
        include: quoteInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return paginate(
      rows.map((q) => this.toListItem(q, now)),
      total,
      query.page,
      query.limit,
    );
  }

  async getAdmin(id: string): Promise<AdminQuoteDetailDto> {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException('Quote request not found.');
    return this.toDetail(quote, new Date());
  }

  /** Real audit trail for a quote request (from the immutable AuditLog), newest first. */
  async listAudit(id: string): Promise<QuoteAuditEntryDto[]> {
    const exists = await this.prisma.quoteRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Quote request not found.');
    const rows = await this.prisma.auditLog.findMany({
      where: { entity: 'QuoteRequest', entityId: id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      action: r.action,
      before: r.before ?? undefined,
      after: r.after ?? undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // --- Admin transitions ----------------------------------------------------

  async changeStatus(id: string, next: QuoteStatus, actorId: string): Promise<AdminQuoteDetailDto> {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException('Quote request not found.');

    const current = quote.status as QuoteStatus;
    this.assertTransition(current, next);

    const updated = await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: next as PrismaQuoteStatus },
      include: quoteInclude,
    });

    await this.audit.log({
      actorId,
      action: 'STATUS_CHANGE',
      entity: 'QuoteRequest',
      entityId: id,
      before: { status: current },
      after: { status: next },
    });

    return this.toDetail(updated, new Date());
  }

  async respond(id: string, dto: RespondQuoteDto, actorId: string): Promise<AdminQuoteDetailDto> {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: quoteInclude,
    });
    if (!quote) throw new NotFoundException('Quote request not found.');

    const current = quote.status as QuoteStatus;
    const now = new Date();
    // Responding from NEW/IN_REVIEW advances to QUOTED.
    const nextStatus =
      current === QuoteStatus.NEW || current === QuoteStatus.IN_REVIEW
        ? QuoteStatus.QUOTED
        : current;

    const updated = await this.prisma.quoteRequest.update({
      where: { id },
      data: {
        respondedAt: now,
        responseMessage: dto.responseMessage,
        internalNotes: dto.internalNotes ?? quote.internalNotes,
        status: nextStatus as PrismaQuoteStatus,
      },
      include: quoteInclude,
    });

    await this.audit.log({
      actorId,
      action: 'RESPOND',
      entity: 'QuoteRequest',
      entityId: id,
      before: { status: current, respondedAt: quote.respondedAt?.toISOString() ?? null },
      after: {
        status: nextStatus,
        respondedAt: now.toISOString(),
        slaMet: isSlaMet(now, quote.slaDueAt),
      },
    });

    return this.toDetail(updated, now);
  }

  private assertTransition(current: QuoteStatus, next: QuoteStatus): void {
    if (current === next) return;
    const allowed = QUOTE_STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Illegal quote status transition: ${current} → ${next}. Allowed: ${allowed.join(', ') || '(none)'}.`,
      );
    }
  }

  // --- Mappers --------------------------------------------------------------

  private toListItem(quote: QuoteWithItems, now: Date): AdminQuoteListItemDto {
    return {
      id: quote.id,
      ref: quote.ref,
      companyName: quote.companyName,
      contactName: quote.contactName,
      email: quote.email,
      country: quote.country,
      incoterm: quote.incoterm as Incoterm,
      destination: quote.destination,
      status: quote.status as QuoteStatus,
      source: quote.source as QuoteSource,
      slaDueAt: quote.slaDueAt?.toISOString() ?? null,
      respondedAt: quote.respondedAt?.toISOString() ?? null,
      overdue: isOverdue(now, quote.slaDueAt, quote.respondedAt),
      slaMet: isSlaMet(quote.respondedAt, quote.slaDueAt),
      createdAt: quote.createdAt.toISOString(),
    };
  }

  private toDetail(quote: QuoteWithItems, now: Date): AdminQuoteDetailDto {
    return {
      ...this.toListItem(quote, now),
      phone: quote.phone,
      message: quote.message,
      responseMessage: quote.responseMessage,
      internalNotes: quote.internalNotes,
      items: quote.items.map(
        (i): QuoteItemDto => ({
          id: i.id,
          productId: i.productId,
          productName: i.productNameSnapshot,
          quantity: i.quantity.toString(),
          unit: i.unit,
          notes: i.notes,
        }),
      ),
    };
  }
}
