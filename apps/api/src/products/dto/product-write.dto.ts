import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BadgeCode,
  Currency,
  INCOTERMS,
  ProductStatus,
  UNITS,
  type Incoterm,
  type Unit,
} from '@altan/shared';

export class ProductSpecInputDto {
  @ApiProperty() @IsString() @IsNotEmpty() label!: string;
  @ApiProperty() @IsString() @IsNotEmpty() value!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;
}

export class ProductTranslationInputDto {
  @ApiProperty({ enum: ['en', 'ru', 'uz'] })
  @IsIn(['en', 'ru', 'uz'])
  locale!: 'en' | 'ru' | 'uz';

  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() slug!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() categoryId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() regionId!: string;

  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() grade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hsCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() standard?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() origin?: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity (decimal).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderQty?: number;

  @ApiPropertyOptional({ enum: UNITS }) @IsOptional() @IsIn(UNITS) minOrderUnit?: Unit;

  @ApiPropertyOptional({ description: 'Indicative per-unit price (decimal).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  priceCurrency?: Currency;

  @ApiPropertyOptional({ enum: UNITS, description: 'Price unit, e.g. MT, kg, mtu.' })
  @IsOptional()
  @IsIn(UNITS)
  priceUnit?: Unit;

  @ApiPropertyOptional({ enum: INCOTERMS, description: 'Price basis (Incoterm), e.g. FCA.' })
  @IsOptional()
  @IsIn(INCOTERMS)
  priceBasis?: Incoterm;

  @ApiPropertyOptional({ description: 'Free-text price note, e.g. "FCA Tashkent, min 5 MT".' })
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ description: 'Primary image URL (from POST /admin/media or external).' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;

  @ApiPropertyOptional({ enum: BadgeCode, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BadgeCode, { each: true })
  badges?: BadgeCode[];

  @ApiPropertyOptional({ type: [ProductSpecInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecInputDto)
  specs?: ProductSpecInputDto[];

  @ApiPropertyOptional({ type: [ProductTranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationInputDto)
  translations?: ProductTranslationInputDto[];
}

/** Partial update — every field optional; provided nested arrays REPLACE existing rows. */
export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() regionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() grade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hsCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() standard?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() origin?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minOrderQty?: number;
  @ApiPropertyOptional({ enum: UNITS }) @IsOptional() @IsIn(UNITS) minOrderUnit?: Unit;

  @ApiPropertyOptional({ description: 'Indicative per-unit price (decimal).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  priceCurrency?: Currency;

  @ApiPropertyOptional({ enum: UNITS, description: 'Price unit, e.g. MT, kg, mtu.' })
  @IsOptional()
  @IsIn(UNITS)
  priceUnit?: Unit;

  @ApiPropertyOptional({ enum: INCOTERMS, description: 'Price basis (Incoterm), e.g. FCA.' })
  @IsOptional()
  @IsIn(INCOTERMS)
  priceBasis?: Incoterm;

  @ApiPropertyOptional({ description: 'Free-text price note, e.g. "FCA Tashkent, min 5 MT".' })
  @IsOptional()
  @IsString()
  priceNote?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ description: 'Primary image URL (from POST /admin/media or external).' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;

  @ApiPropertyOptional({ enum: BadgeCode, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BadgeCode, { each: true })
  badges?: BadgeCode[];

  @ApiPropertyOptional({ type: [ProductSpecInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecInputDto)
  specs?: ProductSpecInputDto[];

  @ApiPropertyOptional({ type: [ProductTranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationInputDto)
  translations?: ProductTranslationInputDto[];
}

export class ReorderItemDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() id!: string;
  @ApiProperty() @IsInt() sortOrder!: number;
}

export class ReorderDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
