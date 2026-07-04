import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BadgeCode } from '@altan/shared';
import { LOCALE_QUERY_VALUES, type LocaleQueryValue } from '../../common/dto/locale-query.dto';

export class CategoryDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() sortOrder!: number;
}

export class RegionDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() sortOrder!: number;
}

export class BadgeDto {
  @ApiProperty({ enum: BadgeCode }) code!: BadgeCode;
  @ApiProperty() label!: string;
  @ApiProperty() emoji!: string;
  @ApiProperty() color!: string;
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() @IsNotEmpty() slug!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateRegionDto {
  @ApiProperty() @IsString() @IsNotEmpty() code!: string;
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateRegionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
}

/** All three locale values for a region name (admin editor view). Missing RU/UZ are `null`. */
export class RegionLocaleValuesDto {
  @ApiProperty({ description: 'EN base name (never null once the region exists).' })
  en!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'RU override, or null when it falls back to EN.',
  })
  ru!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'UZ override, or null when it falls back to EN.',
  })
  uz!: string | null;
}

export class RegionLocalesDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: RegionLocaleValuesDto }) values!: RegionLocaleValuesDto;
}

export class UpsertRegionTranslationDto {
  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    default: 'en',
    description:
      'Target locale. "en" (default) writes the base name; "ru"/"uz" write a per-locale override.',
  })
  @IsOptional()
  @IsIn(LOCALE_QUERY_VALUES)
  locale?: LocaleQueryValue;

  @ApiProperty({ description: 'Localized region name for the target locale.' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

/** Badge is keyed by its enum code, so create == upsert by code. */
export class UpsertBadgeDto {
  @ApiProperty() @IsString() @IsNotEmpty() label!: string;
  @ApiProperty() @IsString() @IsNotEmpty() emoji!: string;
  @ApiProperty({ example: '#FF6B00' }) @IsHexColor() color!: string;
}
