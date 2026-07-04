import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { LocaleQueryDto } from '../common/dto/locale-query.dto';
import { ApiPaginatedResponse, type Paginated } from '../common/dto/pagination-query.dto';
import { CacheableInterceptor } from '../common/http/cacheable.interceptor';
import { NewsCardDto, NewsDetailDto, NewsQueryDto } from './dto/news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller()
@Public()
@UseInterceptors(CacheableInterceptor)
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('news')
  @ApiOperation({ summary: 'List published news (localized, paginated, newest first).' })
  @ApiPaginatedResponse(NewsCardDto)
  list(@Query() query: NewsQueryDto): Promise<Paginated<NewsCardDto>> {
    return this.news.listPublic(query);
  }

  @Get('news/:slug')
  @ApiOperation({ summary: 'Get a published news article by slug (localized).' })
  @ApiOkResponse({ type: NewsDetailDto })
  get(@Param('slug') slug: string, @Query() query: LocaleQueryDto): Promise<NewsDetailDto> {
    return this.news.getPublicBySlug(slug, query.locale);
  }
}
