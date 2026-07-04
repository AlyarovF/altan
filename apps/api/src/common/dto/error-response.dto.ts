import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Consistent error envelope returned by the global exception filter. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: 'BAD_REQUEST',
    description: 'Stable machine-readable error code (screaming snake case).',
  })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Optional structured detail (e.g. per-field validation errors).',
  })
  details?: unknown;

  @ApiProperty({ example: '2026-06-20T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/products' })
  path!: string;
}
