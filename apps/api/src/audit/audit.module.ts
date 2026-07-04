import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Global audit module — `AuditService` is injectable everywhere for sensitive writes
 * (auth, product/news/quote/content create/update/delete/status-change/respond).
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
