import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { LocaleQueryDto } from '../common/dto/locale-query.dto';
import { CacheableInterceptor } from '../common/http/cacheable.interceptor';
import { ProcessStepDto, SiteStatDto } from './dto/content.dto';
import { ContentService } from './content.service';

@ApiTags('content')
@ApiExtraModels(SiteStatDto)
@Controller()
@Public()
@UseInterceptors(CacheableInterceptor)
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('content')
  @ApiOperation({
    summary: 'All site content as a { [key]: valueJson } map, resolved to ?locale (default en).',
    description:
      'Each key resolves to the requested locale, falling back to the EN base value when that ' +
      'locale has no override. Omitting `locale` returns the EN base (back-compatible).',
  })
  @ApiOkResponse({
    description: 'Map of content key → arbitrary JSON value (localized).',
    schema: { type: 'object', additionalProperties: true },
  })
  getContent(@Query() query: LocaleQueryDto): Promise<Record<string, unknown>> {
    return this.content.getContentMap(query.locale);
  }

  @Get('process-steps')
  @ApiOperation({
    summary: 'Ordered process steps (sortOrder, then stepNo), localized via ?locale (default en).',
    description: 'title/subtitle resolve to the requested locale, falling back to the EN base.',
  })
  @ApiOkResponse({ type: [ProcessStepDto] })
  getProcessSteps(@Query() query: LocaleQueryDto): Promise<ProcessStepDto[]> {
    return this.content.listProcessSteps(query.locale);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Site stats grouped by HERO / PROCESS_BAR, localized via ?locale (default en).',
  })
  @ApiOkResponse({
    description: '{ HERO: SiteStatDto[], PROCESS_BAR: SiteStatDto[] }',
    schema: {
      type: 'object',
      properties: {
        HERO: { type: 'array', items: { $ref: '#/components/schemas/SiteStatDto' } },
        PROCESS_BAR: { type: 'array', items: { $ref: '#/components/schemas/SiteStatDto' } },
      },
    },
  })
  getStats(@Query() query: LocaleQueryDto): Promise<Record<string, SiteStatDto[]>> {
    return this.content.getStats(query.locale);
  }

  @Get('i18n/:locale')
  @ApiOperation({ summary: 'Flattened i18n catalog { "namespace.key": value } for a locale.' })
  @ApiParam({ name: 'locale', enum: ['en', 'ru', 'uz'] })
  @ApiOkResponse({
    description: 'Flat translation catalog.',
    schema: { type: 'object', additionalProperties: { type: 'string' } },
  })
  getI18n(@Param('locale') locale: string): Promise<Record<string, string>> {
    return this.content.getI18nCatalog(locale);
  }
}
