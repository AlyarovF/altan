import 'reflect-metadata';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.module';
import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use pino as the application logger (structured JSON + request ids).
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfigService);

  app.use(helmet());

  // CORS allowlist: public site + admin dashboard origins (from validated env).
  app.enableCors({
    origin: [config.get('WEB_ORIGIN'), config.get('ADMIN_ORIGIN')],
    credentials: true,
  });

  // Global prefix + URI versioning -> /api/v1/... (prefix supplies `api`, versioning `v1`).
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Graceful shutdown -> Prisma/Redis onModuleDestroy hooks fire.
  app.enableShutdownHooks();

  setupSwagger(app, 'docs');

  const port = config.get('PORT');
  await app.listen(port);

  app.get(Logger).log(`ALTAN API listening on http://localhost:${port}/api/v1 (docs: /docs)`);
}

void bootstrap();
