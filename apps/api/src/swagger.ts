import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

/**
 * Builds the OpenAPI document. Shared by the live `/docs` UI (main.ts) and the
 * standalone export script (openapi-export.ts) so the published contract and the
 * running server never drift. Tags are pre-declared per future domain module.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('ALTAN API')
    .setDescription(
      'ALTAN — B2B critical raw materials trading platform. Source of truth for the ' +
        'typed client consumed by apps/web and apps/admin.',
    )
    .setVersion('1.0')
    // Served behind the global prefix + URI version; clients target /api/v1/*.
    .addServer('/api/v1')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('health', 'Liveness/readiness probes (Postgres + Redis).')
    .addTag('auth', 'Authentication & RBAC (step 04).')
    .addTag('products', 'Catalog: products, specs, badges, taxonomy (step 05).')
    .addTag('news', 'Market intelligence / news (step 06).')
    .addTag('quotes', 'RFQ / quote requests (step 07).')
    .addTag('content', 'Site content & i18n translations (step 08).')
    .addTag('media', 'Media uploads (product images, served at /media).')
    .build();

  return SwaggerModule.createDocument(app, config);
}

/** Mounts the Swagger UI at the given path (default `/docs`). */
export function setupSwagger(app: INestApplication, path = 'docs'): OpenAPIObject {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  return document;
}
