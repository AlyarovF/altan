import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@altan/shared';

/** A stored media asset (uploaded file) row. */
export class MediaAssetDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Public URL where the file is served (e.g. /media/<file>).' })
  url!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) alt!: string | null;
  @ApiProperty({ enum: MediaType }) type!: MediaType;
  @ApiPropertyOptional({ type: Number, nullable: true }) width!: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) height!: number | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  productId!: string | null;
  @ApiProperty() createdAt!: string;
}
