import { isAbsolute, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule, AppConfigService } from './config/config.module';
import { MediaModule } from './media/media.module';
import { MEDIA_URL_PREFIX } from './media/media.service';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ProductsModule } from './products/products.module';
import { NewsModule } from './news/news.module';
import { QuotesModule } from './quotes/quotes.module';
import { ContentModule } from './content/content.module';

// Guard order (APP_GUARD runs in registration order):
//   1. ThrottlerGuard — rate limiting (and per-route @Throttle overrides).
//   2. JwtAuthGuard    — authenticate by default; @Public() routes skip.
//   3. RolesGuard      — RBAC; ADMIN always allowed; @Public() routes skip.
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS'),
            limit: config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    // Serve uploaded media files at a stable, prefix-independent path (/media/...).
    ServeStaticModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const dir = config.get('MEDIA_DIR');
        const rootPath = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
        return [{ rootPath, serveRoot: MEDIA_URL_PREFIX, serveStaticOptions: { index: false } }];
      },
    }),
    HealthModule,
    AuditModule,
    AuthModule,
    ProductsModule,
    NewsModule,
    QuotesModule,
    ContentModule,
    MediaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
