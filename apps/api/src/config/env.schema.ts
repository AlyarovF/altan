import { z } from 'zod';

/**
 * Boot-time environment schema. The app refuses to start on invalid/missing config
 * (fail fast). Add new vars here so they are typed and validated everywhere.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // CORS allowlist (public site + admin dashboard origins).
  WEB_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),

  // Auth secrets (consumed in step 04; validated now so the env is complete).
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('900s'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Bootstrap admin (used by the seed/auth steps).
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  // Rate limiting (requests per TTL window, in ms).
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

  // Media uploads: local storage dir for product images, served statically at /media.
  MEDIA_DIR: z.string().default('uploads'),
  // Max upload size in bytes (default 5 MB).
  MEDIA_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),
});

export type Env = z.infer<typeof envSchema>;

/**
 * `@nestjs/config` validate hook. Throws a readable, aggregated error on bad config.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
