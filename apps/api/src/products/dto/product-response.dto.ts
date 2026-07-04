import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadgeCode, ProductStatus } from '@altan/shared';

export class RegionRefDto {
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class CategoryRefDto {
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
}

export class ProductSpecDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) unit!: string | null;
  @ApiProperty() sortOrder!: number;
}

/** Localized product card for list views. */
export class ProductCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) shortDescription!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) grade!: string | null;
  @ApiProperty({ enum: BadgeCode, isArray: true }) badges!: BadgeCode[];
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Decimal as string.' })
  minOrderQty!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) minOrderUnit!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) hsCode!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Primary image URL.' })
  imageUrl!: string | null;
  @ApiProperty({ type: RegionRefDto }) region!: RegionRefDto;
  @ApiProperty({ type: CategoryRefDto }) category!: CategoryRefDto;
  @ApiProperty() featured!: boolean;
}

/** Full localized product detail. */
export class ProductDetailDto extends ProductCardDto {
  @ApiPropertyOptional({ type: String, nullable: true }) description!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) standard!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) origin!: string | null;
  @ApiProperty({ type: [ProductSpecDto] }) specs!: ProductSpecDto[];
}

/** One product translation row for the admin edit form (per locale). */
export class ProductTranslationDto {
  @ApiProperty({ enum: ['en', 'ru', 'uz'] }) locale!: 'en' | 'ru' | 'uz';
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) shortDescription!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) description!: string | null;
}

/** Admin product row (all statuses, no locale overlay — base fields). */
export class AdminProductDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ProductStatus }) status!: ProductStatus;
  @ApiProperty() featured!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: CategoryRefDto }) category!: CategoryRefDto;
  @ApiProperty({ type: RegionRefDto }) region!: RegionRefDto;
  @ApiProperty({ enum: BadgeCode, isArray: true }) badges!: BadgeCode[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

/**
 * Full editable product for the admin edit form: every scalar field, the raw
 * `categoryId`/`regionId`, specs, assigned badge codes, and all per-locale translations.
 * Unlike the public detail DTO this is NOT locale-overlaid — it returns base values plus the
 * translation rows so the form can prefill each locale tab.
 */
export class AdminProductDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty({ format: 'uuid' }) regionId!: string;
  @ApiProperty({ enum: ProductStatus }) status!: ProductStatus;
  @ApiProperty() featured!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional({ type: String, nullable: true }) grade!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) hsCode!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) standard!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) origin!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Decimal as string.' })
  minOrderQty!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) minOrderUnit!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) shortDescription!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) description!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Primary image URL.' })
  imageUrl!: string | null;
  @ApiProperty({ type: CategoryRefDto }) category!: CategoryRefDto;
  @ApiProperty({ type: RegionRefDto }) region!: RegionRefDto;
  @ApiProperty({ enum: BadgeCode, isArray: true }) badges!: BadgeCode[];
  @ApiProperty({ type: [ProductSpecDto] }) specs!: ProductSpecDto[];
  @ApiProperty({ type: [ProductTranslationDto] }) translations!: ProductTranslationDto[];
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
