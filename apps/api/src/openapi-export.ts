import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './swagger';

/**
 * Exports the OpenAPI spec to JSON without binding a port. The published artifact is
 * the contract apps/web and apps/admin generate their typed clients from.
 *
 * Run: `pnpm --filter @altan/api openapi:export`
 * Output: apps/api/openapi.json (override via OPENAPI_OUT).
 */
async function exportSpec(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = buildOpenApiDocument(app);
  await app.close();

  const out = resolve(process.cwd(), process.env.OPENAPI_OUT ?? 'openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));
  console.log(`OpenAPI spec written to ${out}`);
}

void exportSpec().catch((err) => {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
});
