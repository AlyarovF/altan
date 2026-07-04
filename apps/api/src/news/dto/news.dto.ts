import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChangeDirection, Outlook, ProductStatus } from '@altan/shared';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class NewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by commodity label.' })
  @IsOptional()
  @IsString()
  commodity?: string;

  @ApiPropertyOptional({ enum: ['en', 'ru', 'uz'] })
  @IsOptional()
  @IsIn(['en', 'ru', 'uz'])
  locale?: LocaleQueryDto['locale'];
}

export class NewsCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() commodity!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) publishedAt!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) priceLabel!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) changeLabel!: string | null;
  @ApiProperty({ enum: ChangeDirection }) changeDirection!: ChangeDirection;
  @ApiProperty({ enum: Outlook }) outlook!: Outlook;
  @ApiPropertyOptional({ type: String, nullable: true }) summary!: string | null;
}

export class NewsDetailDto extends NewsCardDto {
  @ApiPropertyOptional({ type: String, nullable: true }) body!: string | null;
}

export class AdminNewsDto extends NewsDetailDto {
  @ApiProperty({ enum: ProductStatus }) status!: ProductStatus;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class NewsTranslationInputDto {
  @ApiProperty({ enum: ['en', 'ru', 'uz'] })
  @IsIn(['en', 'ru', 'uz'])
  locale!: 'en' | 'ru' | 'uz';

  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
}

export class CreateNewsDto {
  @ApiProperty() @IsString() @IsNotEmpty() slug!: string;
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() commodity!: string;
  @ApiPropertyOptional({ format: 'date-time' }) @IsOptional() @IsDateString() publishedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priceLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeLabel?: string;
  @ApiPropertyOptional({ enum: ChangeDirection })
  @IsOptional()
  @IsEnum(ChangeDirection)
  changeDirection?: ChangeDirection;
  @ApiPropertyOptional({ enum: Outlook }) @IsOptional() @IsEnum(Outlook) outlook?: Outlook;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;

  @ApiPropertyOptional({ type: [NewsTranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsTranslationInputDto)
  translations?: NewsTranslationInputDto[];
}

export class UpdateNewsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() commodity?: string;
  @ApiPropertyOptional({ format: 'date-time' }) @IsOptional() @IsDateString() publishedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priceLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeLabel?: string;
  @ApiPropertyOptional({ enum: ChangeDirection })
  @IsOptional()
  @IsEnum(ChangeDirection)
  changeDirection?: ChangeDirection;
  @ApiPropertyOptional({ enum: Outlook }) @IsOptional() @IsEnum(Outlook) outlook?: Outlook;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;

  @ApiPropertyOptional({ type: [NewsTranslationInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewsTranslationInputDto)
  translations?: NewsTranslationInputDto[];
}
