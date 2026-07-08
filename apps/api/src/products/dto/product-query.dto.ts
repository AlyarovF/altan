import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { BadgeCode } from '@altan/shared';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Whitelisted sort keys (`-` prefix = descending). */
export const PRODUCT_SORTS = [
  'sortOrder',
  '-sortOrder',
  'createdAt',
  '-createdAt',
  'name',
  '-name',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Combined query for public/admin product list (pagination + locale + filters + sort). */
export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category slug.' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by region code.' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Only featured products.', example: 'true' })
  @IsOptional()
  @IsBooleanString()
  featured?: string;

  @ApiPropertyOptional({
    description: 'Only products with an indicative price (priceAmount set).',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  priced?: string;

  @ApiPropertyOptional({ enum: BadgeCode, description: 'Filter by badge.' })
  @IsOptional()
  @IsIn(Object.values(BadgeCode))
  badge?: BadgeCode;

  @ApiPropertyOptional({ description: 'Full-text-ish search over name/grade/description.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS, default: 'sortOrder' })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;

  @ApiPropertyOptional({ enum: ['en', 'ru', 'uz'] })
  @IsOptional()
  @IsIn(['en', 'ru', 'uz'])
  locale?: LocaleQueryDto['locale'];
}
