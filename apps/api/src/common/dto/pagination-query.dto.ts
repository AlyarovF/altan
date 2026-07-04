import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type as TransformType } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Shared pagination query params for list endpoints. With the global ValidationPipe
 * (`transform: true`), `@Type(() => Number)` coerces the query strings into numbers.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: '1-based page number.' })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page (max 100).',
  })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

/** Standard pagination envelope metadata. */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

/** Standard paginated response envelope. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMetaDto;
}

/**
 * Build a `{ data, meta }` paginated envelope. `total` is the unpaginated row count.
 */
export function paginate<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

/** Compute Prisma `skip`/`take` from page/limit. */
export function toSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

/**
 * Swagger decorator documenting a `{ data: Model[], meta: PaginationMetaDto }` response.
 */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
  description = 'Paginated result.',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
      },
    }),
  );
}
