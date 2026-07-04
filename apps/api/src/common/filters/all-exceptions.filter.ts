import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';
import type { ErrorResponseDto } from '../dto/error-response.dto';

/**
 * Global exception filter. Normalises every error into the standard shape
 * `{ statusCode, code, message, details?, timestamp, path }` and logs it with the
 * request id supplied by nestjs-pino.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const { statusCode, code, message, details } = this.normalize(exception);

    const body: ErrorResponseDto = {
      statusCode,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request?.url ?? '',
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${code} ${body.path} :: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        AllExceptionsFilter.name,
      );
    } else {
      this.logger.warn(`${code} ${body.path} :: ${message}`, AllExceptionsFilter.name);
    }

    httpAdapter.reply(ctx.getResponse(), body, statusCode);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { statusCode, code: this.codeFromStatus(statusCode), message: res };
      }
      const obj = res as Record<string, unknown>;
      const message = Array.isArray(obj.message)
        ? (obj.message as string[]).join(', ')
        : ((obj.message as string) ?? exception.message);
      return {
        statusCode,
        code: (obj.code as string) ?? this.codeFromStatus(statusCode),
        message,
        // Surface array-form validation messages as structured details.
        details: Array.isArray(obj.message) ? obj.message : undefined,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrisma(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'DB_VALIDATION_ERROR',
        message: 'Invalid database query.',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };
  }

  private normalizePrisma(e: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    switch (e.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with these unique values already exists.',
          details: e.meta?.target,
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found.',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Related record constraint failed.',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: `DB_ERROR_${e.code}`,
          message: 'Database request error.',
        };
    }
  }

  private codeFromStatus(status: number): string {
    return (HttpStatus[status] ?? 'ERROR').toString();
  }
}
