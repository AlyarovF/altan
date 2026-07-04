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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@altan/shared';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPaginatedResponse, type Paginated } from '../common/dto/pagination-query.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { AdminProductDetailDto, AdminProductDto } from './dto/product-response.dto';
import { CreateProductDto, ReorderDto, UpdateProductDto } from './dto/product-write.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth('access-token')
@Roles(Role.EDITOR)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products of any status (admin).' })
  @ApiPaginatedResponse(AdminProductDto)
  list(@Query() query: ProductQueryDto): Promise<Paginated<AdminProductDto>> {
    return this.products.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get the full editable product (scalars + categoryId/regionId + specs + badges + translations).',
  })
  @ApiOkResponse({ type: AdminProductDetailDto })
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<AdminProductDetailDto> {
    return this.products.getAdminById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product (with specs, badges, translations).' })
  @ApiOkResponse({ type: AdminProductDto })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser): Promise<AdminProductDto> {
    return this.products.create(dto, user.id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Bulk-update product sortOrder.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser): Promise<void> {
    return this.products.reorder(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (nested arrays replace existing rows).' })
  @ApiOkResponse({ type: AdminProductDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminProductDto> {
    return this.products.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.products.remove(id, user.id);
  }
}
