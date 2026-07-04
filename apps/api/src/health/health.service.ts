import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

export type IndicatorStatus = 'up' | 'down';

export interface HealthIndicator {
  status: IndicatorStatus;
  error?: string;
}

export interface HealthResult {
  status: 'ok' | 'error';
  info: Record<string, HealthIndicator>;
  service: string;
  time: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthResult> {
    const [db, cache] = await Promise.all([this.checkPostgres(), this.checkRedis()]);
    const info = { postgres: db, redis: cache };
    const status = db.status === 'up' && cache.status === 'up' ? 'ok' : 'error';
    return {
      status,
      info,
      service: 'altan-api',
      time: new Date().toISOString(),
    };
  }

  private async checkPostgres(): Promise<HealthIndicator> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (err) {
      return { status: 'down', error: err instanceof Error ? err.message : 'unknown' };
    }
  }

  private async checkRedis(): Promise<HealthIndicator> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? { status: 'up' } : { status: 'down', error: `unexpected: ${pong}` };
    } catch (err) {
      return { status: 'down', error: err instanceof Error ? err.message : 'unknown' };
    }
  }
}
