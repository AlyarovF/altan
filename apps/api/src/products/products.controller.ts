import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheableInterceptor } from '../common/http/cacheable.interceptor';
import { ApiPaginatedResponse, type Paginated } from '../common/dto/pagination-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ProductQueryDto } from './dto/product-query.dto';
import { BadgeDto, CategoryDto, RegionDto } from './dto/taxonomy.dto';
import { ProductCardDto, ProductDetailDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';
import { TaxonomyService } from './taxonomy.service';
import { LocaleQueryDto } from '../common/dto/locale-query.dto';

@ApiTags('products')
@Controller()
@Public()
@UseInterceptors(CacheableInterceptor)
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly taxonomy: TaxonomyService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'List published products (localized cards, filtered, paginated).' })
  @ApiPaginatedResponse(ProductCardDto)
  listProducts(@Query() query: ProductQueryDto): Promise<Paginated<ProductCardDto>> {
    return this.products.listPublic(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get a published product by slug (full localized detail).' })
  @ApiOkResponse({ type: ProductDetailDto })
  getProduct(
    @Param('slug') slug: string,
    @Query() query: LocaleQueryDto,
  ): Promise<ProductDetailDto> {
    return this.products.getPublicBySlug(slug, query.locale);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List product categories.' })
  @ApiOkResponse({ type: [CategoryDto] })
  listCategories(): Promise<CategoryDto[]> {
    return this.taxonomy.listCategories();
  }

  @Get('regions')
  @ApiOperation({
    summary: 'List sourcing regions (localized names, ?locale default en with EN fallback).',
  })
  @ApiOkResponse({ type: [RegionDto] })
  listRegions(@Query() query: LocaleQueryDto): Promise<RegionDto[]> {
    return this.taxonomy.listRegions(query.locale);
  }

  @Get('badges')
  @ApiOperation({ summary: 'List product badges.' })
  @ApiOkResponse({ type: [BadgeDto] })
  listBadges(): Promise<BadgeDto[]> {
    return this.taxonomy.listBadges();
  }
}
