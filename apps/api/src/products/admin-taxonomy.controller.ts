import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BadgeCode, Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  BadgeDto,
  CategoryDto,
  CreateCategoryDto,
  CreateRegionDto,
  RegionDto,
  RegionLocalesDto,
  UpdateCategoryDto,
  UpdateRegionDto,
  UpsertBadgeDto,
  UpsertRegionTranslationDto,
} from './dto/taxonomy.dto';
import { TaxonomyService } from './taxonomy.service';

@ApiTags('products')
@ApiBearerAuth('access-token')
@Roles(Role.EDITOR)
@Controller('admin')
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  // Categories
  @Get('categories')
  @ApiOperation({ summary: 'List categories (admin).' })
  @ApiOkResponse({ type: [CategoryDto] })
  listCategories(): Promise<CategoryDto[]> {
    return this.taxonomy.listCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category.' })
  @ApiOkResponse({ type: CategoryDto })
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() u: AuthUser): Promise<CategoryDto> {
    return this.taxonomy.createCategory(dto, u.id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category.' })
  @ApiOkResponse({ type: CategoryDto })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() u: AuthUser,
  ): Promise<CategoryDto> {
    return this.taxonomy.updateCategory(id, dto, u.id);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() u: AuthUser,
  ): Promise<void> {
    return this.taxonomy.removeCategory(id, u.id);
  }

  // Regions
  @Get('regions')
  @ApiOperation({ summary: 'List regions (admin).' })
  @ApiOkResponse({ type: [RegionDto] })
  listRegions(): Promise<RegionDto[]> {
    return this.taxonomy.listRegions();
  }

  @Post('regions')
  @ApiOperation({ summary: 'Create a region.' })
  @ApiOkResponse({ type: RegionDto })
  createRegion(@Body() dto: CreateRegionDto, @CurrentUser() u: AuthUser): Promise<RegionDto> {
    return this.taxonomy.createRegion(dto, u.id);
  }

  @Patch('regions/:id')
  @ApiOperation({ summary: 'Update a region.' })
  @ApiOkResponse({ type: RegionDto })
  updateRegion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() u: AuthUser,
  ): Promise<RegionDto> {
    return this.taxonomy.updateRegion(id, dto, u.id);
  }

  @Delete('regions/:id')
  @ApiOperation({ summary: 'Delete a region.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeRegion(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser): Promise<void> {
    return this.taxonomy.removeRegion(id, u.id);
  }

  @Get('regions/:id/locales')
  @ApiOperation({
    summary: 'Get all locale names for a region: { id, code, values: { en, ru, uz } }.',
  })
  @ApiOkResponse({ type: RegionLocalesDto })
  getRegionLocales(@Param('id', ParseUUIDPipe) id: string): Promise<RegionLocalesDto> {
    return this.taxonomy.getRegionLocales(id);
  }

  @Put('regions/:id')
  @ApiOperation({
    summary:
      'Upsert a region name for a locale (body.locale, default en). Non-EN writes an override.',
  })
  @ApiOkResponse({ type: RegionDto })
  upsertRegionTranslation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertRegionTranslationDto,
    @CurrentUser() u: AuthUser,
  ): Promise<RegionDto> {
    return this.taxonomy.upsertRegionTranslation(id, dto, u.id);
  }

  // Badges (keyed by enum code)
  @Get('badges')
  @ApiOperation({ summary: 'List badges (admin).' })
  @ApiOkResponse({ type: [BadgeDto] })
  listBadges(): Promise<BadgeDto[]> {
    return this.taxonomy.listBadges();
  }

  @Post('badges/:code')
  @ApiOperation({ summary: 'Upsert a badge by code (HOT|NEW).' })
  @ApiOkResponse({ type: BadgeDto })
  upsertBadge(
    @Param('code') code: BadgeCode,
    @Body() dto: UpsertBadgeDto,
    @CurrentUser() u: AuthUser,
  ): Promise<BadgeDto> {
    return this.taxonomy.upsertBadge(code, dto, u.id);
  }

  @Delete('badges/:code')
  @ApiOperation({ summary: 'Delete a badge by code.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeBadge(@Param('code') code: BadgeCode, @CurrentUser() u: AuthUser): Promise<void> {
    return this.taxonomy.removeBadge(code, u.id);
  }
}
