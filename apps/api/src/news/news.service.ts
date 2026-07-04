import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { ChangeDirection, LocaleCode, Outlook, ProductStatus } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { toLocaleCode } from '../common/dto/locale-query.dto';
import { paginate, toSkipTake, type Paginated } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminNewsDto,
  CreateNewsDto,
  NewsCardDto,
  NewsDetailDto,
  NewsQueryDto,
  NewsTranslationInputDto,
  UpdateNewsDto,
} from './dto/news.dto';

const newsInclude = { translations: true } satisfies Prisma.NewsArticleInclude;
type NewsWithRelations = Prisma.NewsArticleGetPayload<{ include: typeof newsInclude }>;

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Public ---------------------------------------------------------------

  async listPublic(query: NewsQueryDto): Promise<Paginated<NewsCardDto>> {
    const locale = toLocaleCode(query.locale);
    const where: Prisma.NewsArticleWhereInput = { status: PrismaProductStatus.PUBLISHED };
    if (query.commodity) where.commodity = { contains: query.commodity, mode: 'insensitive' };
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.newsArticle.findMany({
        where,
        include: newsInclude,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }],
        skip,
        take,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return paginate(
      rows.map((n) => this.toCard(n, locale)),
      total,
      query.page,
      query.limit,
    );
  }

  async getPublicBySlug(slug: string, localeQuery?: string): Promise<NewsDetailDto> {
    const article = await this.prisma.newsArticle.findFirst({
      where: { slug, status: PrismaProductStatus.PUBLISHED },
      include: newsInclude,
    });
    if (!article) throw new NotFoundException('News article not found.');
    return this.toDetail(article, toLocaleCode(localeQuery));
  }

  // --- Admin ----------------------------------------------------------------

  async listAdmin(query: NewsQueryDto): Promise<Paginated<AdminNewsDto>> {
    const where: Prisma.NewsArticleWhereInput = {};
    if (query.commodity) where.commodity = { contains: query.commodity, mode: 'insensitive' };
    const { skip, take } = toSkipTake(query.page, query.limit);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.newsArticle.findMany({
        where,
        include: newsInclude,
        orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }],
        skip,
        take,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return paginate(
      rows.map((n) => this.toAdmin(n)),
      total,
      query.page,
      query.limit,
    );
  }

  async create(dto: CreateNewsDto, actorId: string): Promise<AdminNewsDto> {
    const created = await this.prisma.$transaction(async (tx) => {
      return tx.newsArticle.create({
        data: {
          slug: dto.slug,
          title: dto.title,
          commodity: dto.commodity,
          publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
          priceLabel: dto.priceLabel ?? null,
          changeLabel: dto.changeLabel ?? null,
          changeDirection: (dto.changeDirection ?? ChangeDirection.FLAT) as ChangeDirection,
          outlook: (dto.outlook ?? Outlook.FIRM) as Outlook,
          summary: dto.summary ?? null,
          body: dto.body ?? null,
          status: (dto.status ?? ProductStatus.DRAFT) as PrismaProductStatus,
          sortOrder: dto.sortOrder ?? 0,
          translations: dto.translations?.length
            ? { create: dto.translations.map((t) => this.translationData(t)) }
            : undefined,
        },
        include: newsInclude,
      });
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'NewsArticle',
      entityId: created.id,
      after: this.snapshot(created),
    });
    return this.toAdmin(created);
  }

  async update(id: string, dto: UpdateNewsDto, actorId: string): Promise<AdminNewsDto> {
    const existing = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: newsInclude,
    });
    if (!existing) throw new NotFoundException('News article not found.');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.newsArticle.update({
        where: { id },
        data: {
          slug: dto.slug,
          title: dto.title,
          commodity: dto.commodity,
          publishedAt:
            dto.publishedAt !== undefined
              ? dto.publishedAt
                ? new Date(dto.publishedAt)
                : null
              : undefined,
          priceLabel: dto.priceLabel,
          changeLabel: dto.changeLabel,
          changeDirection: dto.changeDirection,
          outlook: dto.outlook,
          summary: dto.summary,
          body: dto.body,
          status: dto.status as PrismaProductStatus | undefined,
          sortOrder: dto.sortOrder,
        },
      });
      if (dto.translations) {
        for (const t of dto.translations) {
          const loc = toLocaleCode(t.locale);
          await tx.newsTranslation.upsert({
            where: { articleId_locale: { articleId: id, locale: loc } },
            create: { ...this.translationData(t), articleId: id },
            update: { title: t.title, summary: t.summary ?? null, body: t.body ?? null },
          });
        }
      }
      return tx.newsArticle.findUniqueOrThrow({ where: { id }, include: newsInclude });
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'NewsArticle',
      entityId: id,
      before: this.snapshot(existing),
      after: this.snapshot(updated),
    });
    return this.toAdmin(updated);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: newsInclude,
    });
    if (!existing) throw new NotFoundException('News article not found.');
    await this.prisma.newsArticle.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE',
      entity: 'NewsArticle',
      entityId: id,
      before: this.snapshot(existing),
    });
  }

  // --- Mappers --------------------------------------------------------------

  private localized(
    article: NewsWithRelations,
    locale: LocaleCode,
  ): { title: string; summary: string | null; body: string | null } {
    const t = article.translations.find((tr) => tr.locale === locale);
    return {
      title: t?.title ?? article.title,
      summary: t?.summary ?? article.summary ?? null,
      body: t?.body ?? article.body ?? null,
    };
  }

  private toCard(article: NewsWithRelations, locale: LocaleCode): NewsCardDto {
    const l = this.localized(article, locale);
    return {
      id: article.id,
      slug: article.slug,
      title: l.title,
      commodity: article.commodity,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      priceLabel: article.priceLabel,
      changeLabel: article.changeLabel,
      changeDirection: article.changeDirection as ChangeDirection,
      outlook: article.outlook as Outlook,
      summary: l.summary,
    };
  }

  private toDetail(article: NewsWithRelations, locale: LocaleCode): NewsDetailDto {
    const card = this.toCard(article, locale);
    return { ...card, body: this.localized(article, locale).body };
  }

  private toAdmin(article: NewsWithRelations): AdminNewsDto {
    const card = this.toCard(article, LocaleCode.EN);
    return {
      ...card,
      body: article.body ?? null,
      status: article.status as ProductStatus,
      sortOrder: article.sortOrder,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }

  private translationData(t: NewsTranslationInputDto) {
    return {
      locale: toLocaleCode(t.locale),
      title: t.title,
      summary: t.summary ?? null,
      body: t.body ?? null,
    };
  }

  private snapshot(article: NewsWithRelations): Record<string, unknown> {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      commodity: article.commodity,
      status: article.status,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      outlook: article.outlook,
      changeDirection: article.changeDirection,
      sortOrder: article.sortOrder,
    };
  }
}
