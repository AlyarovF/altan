import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';

/**
 * Adds HTTP caching to public GET reads:
 *  - computes a weak ETag (`W/"<sha1 of JSON payload>"`),
 *  - sets `Cache-Control: public, max-age=60, stale-while-revalidate=300`,
 *  - returns 304 (empty body) when the client's `If-None-Match` matches.
 *
 * Only acts on GET requests that resolve to 200. Apply via `@UseInterceptors(CacheableInterceptor)`.
 */
@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  private static readonly CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (req.method !== 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload: unknown) => {
        // Only cache successful responses (handlers may have set a non-200 status).
        if (res.statusCode !== HttpStatus.OK) {
          return payload;
        }

        const etag = this.weakEtag(payload);
        res.setHeader('Cache-Control', CacheableInterceptor.CACHE_CONTROL);
        res.setHeader('ETag', etag);

        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && this.matches(ifNoneMatch, etag)) {
          res.status(HttpStatus.NOT_MODIFIED);
          // 304 must carry no body.
          return undefined;
        }

        return payload;
      }),
    );
  }

  private weakEtag(payload: unknown): string {
    const json = JSON.stringify(payload ?? null);
    const hash = createHash('sha1').update(json).digest('hex');
    return `W/"${hash}"`;
  }

  private matches(ifNoneMatch: string | string[], etag: string): boolean {
    const values = Array.isArray(ifNoneMatch) ? ifNoneMatch : ifNoneMatch.split(',');
    return values.map((v) => v.trim()).some((v) => v === etag || v === '*');
  }
}
