import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigService } from '../config/config.module';

/** Injection token for the shared ioredis client. */
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: AppConfigService): Redis =>
        new Redis(config.get('REDIS_URL'), {
          // Fail fast instead of buffering commands forever if Redis is down.
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
          lazyConnect: false,
        }),
      inject: [AppConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
