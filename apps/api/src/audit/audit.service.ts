import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';

/** Input for an audit log entry. `before`/`after` are JSON snapshots of the entity. */
export interface AuditLogInput {
  actorId?: string | null;
  action: string; // CREATE | UPDATE | DELETE | STATUS_CHANGE | RESPOND | LOGIN | LOGIN_FAILED …
  entity: string; // "Product", "QuoteRequest", "User"…
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

/**
 * Writes immutable audit entries. NEVER throws to the caller — auditing must not break the
 * business flow. On failure it logs a warning and swallows the error.
 */
@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          before: this.toJson(input.before),
          after: this.toJson(input.after),
        },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log failed for ${input.action} ${input.entity} :: ${(err as Error).message}`,
        AuditService.name,
      );
    }
  }

  /** Normalise an arbitrary value into a Prisma JSON-safe value (or DB NULL). */
  private toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined || value === null) return Prisma.JsonNull;
    // JSON round-trip drops Decimals/Dates into serializable primitives.
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
