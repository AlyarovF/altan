# Step 03 — Backend core scaffolding

|                |                  |
| -------------- | ---------------- |
| **Phase**      | Foundations      |
| **Owner**      | backend-engineer |
| **Depends on** | 01, 02           |
| **Status**     | ✅ Done          |

## Objective

Turn the NestJS placeholder into a production-shaped API skeleton: config, data access,
logging, errors, docs, security, and health — the foundation every domain module plugs into.

## Scope & deliverables

- `ConfigModule` with **schema-validated env** at boot (fail fast on bad/missing config).
- `PrismaModule` (injectable client, graceful shutdown).
- **nestjs-pino** structured logging with request IDs; redact secrets/PII.
- Global `ValidationPipe` (whitelist + transform) and a **global exception filter** returning
  a consistent shape `{ statusCode, code, message, details? }`.
- **Swagger/OpenAPI** at `/docs` + a script to export the spec JSON for client generation.
- Health check (`/health`) covering DB + Redis.
- Security: **helmet**, CORS allowlist (web + admin origins), **@nestjs/throttler**.
- API prefix + versioning (`/api/v1`), response serialization interceptor.
- BullMQ/Redis module wired (used later by quotes/email).

## Tasks

1. Implement config schema + load `.env`; export typed config.
2. Add Prisma, logger, filters, pipes, interceptors as global providers in `AppModule`.
3. Configure Swagger (tags per future module) and the OpenAPI export script.
4. Add health, helmet, CORS, throttler; set global prefix/version.

## Acceptance criteria

- [x] App boots only with valid env; invalid env aborts with a clear message.
- [x] `/health` returns green (db+redis); `/docs` renders.
- [x] Errors everywhere share the standard shape; logs are structured with request IDs.
- [x] OpenAPI JSON exports for `packages/shared` client generation.

## ALTAN-specific notes

- CORS allowlist must include the public site and admin origins (and localhost dev ports).
