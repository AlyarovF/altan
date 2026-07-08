import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Incoterm, INCOTERMS, QuoteSource, QuoteStatus, UNITS, type Unit } from '@altan/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QuoteItemInputDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() productId?: string;
  @ApiProperty({ maxLength: 200 }) @IsString() @IsNotEmpty() productName!: string;
  @ApiProperty({ minimum: 0, exclusiveMinimum: true })
  @IsNumber()
  @Min(0.000001)
  quantity!: number;
  @ApiProperty({ enum: UNITS }) @IsIn(UNITS) unit!: Unit;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateQuoteRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() contactName!: string;
  @ApiProperty({ format: 'email' }) @IsEmail() email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() @IsNotEmpty() country!: string;
  @ApiProperty({ enum: INCOTERMS }) @IsIn(INCOTERMS) incoterm!: Incoterm;
  @ApiProperty() @IsString() @IsNotEmpty() destination!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;

  @ApiProperty({ type: [QuoteItemInputDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items!: QuoteItemInputDto[];

  /**
   * Honeypot: must stay empty. Bots that fill hidden fields are silently dropped
   * (we return a fake success without persisting).
   */
  @ApiPropertyOptional({ description: 'Honeypot — leave blank.' })
  @IsOptional()
  @ValidateIf((o: CreateQuoteRequestDto) => o.companyWebsite !== undefined)
  @IsString()
  companyWebsite?: string;
}

export class CreateQuoteResponseDto {
  @ApiProperty({ example: 'ALT-2026-000001' }) ref!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) slaDueAt!: string | null;
  @ApiProperty({ enum: QuoteStatus }) status!: QuoteStatus;
  @ApiProperty() createdAt!: string;
}

// --- Admin ----------------------------------------------------------------

export class AdminQuoteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
  @ApiPropertyOptional({ description: 'Only overdue (past SLA, unanswered).', example: 'true' })
  @IsOptional()
  @IsIn(['true', 'false'])
  overdue?: string;
  @ApiPropertyOptional({ format: 'date-time', description: 'createdAt >= from.' })
  @IsOptional()
  @IsString()
  from?: string;
  @ApiPropertyOptional({ format: 'date-time', description: 'createdAt <= to.' })
  @IsOptional()
  @IsString()
  to?: string;
  @ApiPropertyOptional({ description: 'Search ref / company / email.' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QuoteItemDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) productId!: string | null;
  @ApiProperty() productName!: string;
  @ApiProperty({ description: 'Decimal as string.' }) quantity!: string;
  @ApiProperty() unit!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) notes!: string | null;
}

export class AdminQuoteListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() ref!: string;
  @ApiProperty() companyName!: string;
  @ApiProperty() contactName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() country!: string;
  @ApiProperty({ enum: ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] }) incoterm!: Incoterm;
  @ApiProperty() destination!: string;
  @ApiProperty({ enum: QuoteStatus }) status!: QuoteStatus;
  @ApiProperty({ enum: QuoteSource }) source!: QuoteSource;
  @ApiPropertyOptional({ type: String, nullable: true }) slaDueAt!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) respondedAt!: string | null;
  @ApiProperty() overdue!: boolean;
  @ApiProperty() slaMet!: boolean;
  @ApiProperty() createdAt!: string;
}

export class AdminQuoteDetailDto extends AdminQuoteListItemDto {
  @ApiPropertyOptional({ type: String, nullable: true }) phone!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) message!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) responseMessage!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) internalNotes!: string | null;
  @ApiProperty({ type: [QuoteItemDto] }) items!: QuoteItemDto[];
}

/** One immutable audit-log entry for a quote request (newest first). */
export class QuoteAuditEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  actorId!: string | null;
  @ApiProperty({ description: 'CREATE | UPDATE | STATUS_CHANGE | RESPOND …' }) action!: string;
  @ApiPropertyOptional({ description: 'Prior snapshot (if any).' }) before?: unknown;
  @ApiPropertyOptional({ description: 'Resulting snapshot (if any).' }) after?: unknown;
  @ApiProperty() createdAt!: string;
}

export class UpdateQuoteStatusDto {
  @ApiProperty({ enum: QuoteStatus }) @IsEnum(QuoteStatus) status!: QuoteStatus;
}

export class RespondQuoteDto {
  @ApiProperty() @IsString() @IsNotEmpty() responseMessage!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() internalNotes?: string;
}
