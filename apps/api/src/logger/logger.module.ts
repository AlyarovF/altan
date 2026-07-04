import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppConfigModule, AppConfigService } from '../config/config.module';

/**
 * Structured JSON logging via nestjs-pino.
 * - Adds/propagates an `x-request-id` per request (correlation id).
 * - Redacts secrets & PII from logged headers/bodies.
 * - Pretty-prints in dev; raw JSON in production.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.isProduction ? 'info' : 'debug',
          genReqId: (req: IncomingMessage, res: ServerResponse): string => {
            const existing = req.headers['x-request-id'];
            const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'req.body.password',
              'req.body.passwordHash',
              'req.body.currentPassword',
              'req.body.newPassword',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:standard' },
              },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
