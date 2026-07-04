import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContentService } from './content.service';
import {
  ContentItemDto,
  ContentKeyLocalesDto,
  ImportTranslationsDto,
  ImportTranslationsResultDto,
  MissingTranslationsDto,
  ProcessStepDto,
  ProcessStepLocalesDto,
  RevalidateResultDto,
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

@ApiTags('content')
@ApiBearerAuth('access-token')
@Roles(Role.EDITOR)
@Controller('admin')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  // --- SiteContent ----------------------------------------------------------

  @Get('content')
  @ApiOperation({ summary: 'List all site content rows (EN base values).' })
  @ApiOkResponse({ type: [ContentItemDto] })
  listContent(): Promise<ContentItemDto[]> {
    return this.content.listContent();
  }

  @Get('content/:key')
  @ApiOperation({
    summary: 'Get all locale values for a content key: { key, values: { en, ru, uz } }.',
  })
  @ApiOkResponse({ type: ContentKeyLocalesDto })
  getContentLocales(@Param('key') key: string): Promise<ContentKeyLocalesDto> {
    return this.content.getContentLocales(key);
  }

  @Put('content/:key')
  @ApiOperation({
    summary: 'Upsert a content value by key for a locale (body.locale, default en).',
  })
  @ApiOkResponse({ type: ContentItemDto })
  upsertContent(
    @Param('key') key: string,
    @Body() dto: UpsertContentDto,
    @CurrentUser() u: AuthUser,
  ): Promise<ContentItemDto> {
    return this.content.upsertContent(key, dto, u.id);
  }

  @Delete('content/:key')
  @ApiOperation({
    summary: 'Delete a content key (all locales), or a single locale override with ?locale=ru|uz.',
  })
  @ApiQuery({ name: 'locale', enum: ['ru', 'uz'], required: false })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeContent(
    @Param('key') key: string,
    @CurrentUser() u: AuthUser,
    @Query('locale') locale?: string,
  ): Promise<void> {
    return this.content.removeContent(key, u.id, locale);
  }

  @Post('content/revalidate')
  @ApiOperation({ summary: 'Bump content version (triggers public-site ISR revalidation).' })
  @ApiOkResponse({ type: RevalidateResultDto })
  revalidate(@CurrentUser() u: AuthUser): Promise<RevalidateResultDto> {
    return this.content.revalidate(u.id);
  }

  // --- ProcessStep ----------------------------------------------------------

  @Get('process-steps')
  @ApiOperation({ summary: 'List process steps (admin).' })
  @ApiOkResponse({ type: [ProcessStepDto] })
  listProcessSteps(): Promise<ProcessStepDto[]> {
    return this.content.listProcessSteps();
  }

  @Put('process-steps')
  @ApiOperation({ summary: 'Upsert a process step by key.' })
  @ApiOkResponse({ type: ProcessStepDto })
  upsertProcessStep(
    @Body() dto: UpsertProcessStepDto,
    @CurrentUser() u: AuthUser,
  ): Promise<ProcessStepDto> {
    return this.content.upsertProcessStep(dto, u.id);
  }

  @Delete('process-steps/:id')
  @ApiOperation({ summary: 'Delete a process step.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeProcessStep(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() u: AuthUser,
  ): Promise<void> {
    return this.content.removeProcessStep(id, u.id);
  }

  @Get('process-steps/:id/locales')
  @ApiOperation({
    summary: 'Get all locale title/subtitle for a step: { id, key, values: { en, ru, uz } }.',
  })
  @ApiOkResponse({ type: ProcessStepLocalesDto })
  getProcessStepLocales(@Param('id', ParseUUIDPipe) id: string): Promise<ProcessStepLocalesDto> {
    return this.content.getProcessStepLocales(id);
  }

  @Put('process-steps/:id')
  @ApiOperation({
    summary:
      'Upsert a step title/subtitle for a locale (body.locale, default en). Non-EN = override.',
  })
  @ApiOkResponse({ type: ProcessStepDto })
  upsertProcessStepTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertProcessStepTranslationDto,
    @CurrentUser() u: AuthUser,
  ): Promise<ProcessStepDto> {
    return this.content.upsertProcessStepTranslation(id, dto, u.id);
  }

  // --- SiteStat -------------------------------------------------------------

  @Get('stats')
  @ApiOperation({ summary: 'List stats grouped by HERO / PROCESS_BAR (admin).' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'array', items: { $ref: '#/components/schemas/SiteStatDto' } },
    },
  })
  listStats(): Promise<Record<string, SiteStatDto[]>> {
    return this.content.getStats();
  }

  @Put('stats')
  @ApiOperation({ summary: 'Upsert a stat by key.' })
  @ApiOkResponse({ type: SiteStatDto })
  upsertStat(@Body() dto: UpsertSiteStatDto, @CurrentUser() u: AuthUser): Promise<SiteStatDto> {
    return this.content.upsertStat(dto, u.id);
  }

  @Delete('stats/:id')
  @ApiOperation({ summary: 'Delete a stat.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeStat(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser): Promise<void> {
    return this.content.removeStat(id, u.id);
  }

  @Get('stats/:id/locales')
  @ApiOperation({
    summary: 'Get all locale label/value for a stat: { id, key, values: { en, ru, uz } }.',
  })
  @ApiOkResponse({ type: SiteStatLocalesDto })
  getStatLocales(@Param('id', ParseUUIDPipe) id: string): Promise<SiteStatLocalesDto> {
    return this.content.getStatLocales(id);
  }

  @Put('stats/:id')
  @ApiOperation({
    summary: 'Upsert a stat label/value for a locale (body.locale, default en). Non-EN = override.',
  })
  @ApiOkResponse({ type: SiteStatDto })
  upsertStatTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertSiteStatTranslationDto,
    @CurrentUser() u: AuthUser,
  ): Promise<SiteStatDto> {
    return this.content.upsertStatTranslation(id, dto, u.id);
  }

  // --- Translations ---------------------------------------------------------

  @Get('translations')
  @ApiOperation({ summary: 'List translations (optionally filtered by namespace).' })
  @ApiOkResponse({ type: [TranslationDto] })
  listTranslations(@Query('namespace') namespace?: string): Promise<TranslationDto[]> {
    return this.content.listTranslations(namespace);
  }

  @Put('translations')
  @ApiOperation({ summary: 'Upsert a translation by namespace/key/locale.' })
  @ApiOkResponse({ type: TranslationDto })
  upsertTranslation(
    @Body() dto: UpsertTranslationDto,
    @CurrentUser() u: AuthUser,
  ): Promise<TranslationDto> {
    return this.content.upsertTranslation(dto, u.id);
  }

  @Delete('translations/:id')
  @ApiOperation({ summary: 'Delete a translation.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() u: AuthUser,
  ): Promise<void> {
    return this.content.removeTranslation(id, u.id);
  }

  @Post('translations/import')
  @ApiOperation({
    summary: 'Bulk import translations from { [locale]: { "namespace.key": value } }.',
  })
  @ApiOkResponse({ type: ImportTranslationsResultDto })
  importTranslations(
    @Body() dto: ImportTranslationsDto,
    @CurrentUser() u: AuthUser,
  ): Promise<ImportTranslationsResultDto> {
    return this.content.importTranslations(dto.data, u.id);
  }

  @Get('translations/export')
  @ApiOperation({ summary: 'Export translations as { [locale]: { "namespace.key": value } }.' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  exportTranslations(): Promise<Record<string, Record<string, string>>> {
    return this.content.exportTranslations();
  }

  @Get('translations/missing')
  @ApiOperation({ summary: 'EN keys missing in RU / UZ.' })
  @ApiOkResponse({ type: MissingTranslationsDto })
  missingTranslations(): Promise<MissingTranslationsDto> {
    return this.content.missingTranslations();
  }
}
