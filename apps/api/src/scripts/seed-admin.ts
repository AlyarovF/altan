import { Role } from '@prisma/client';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AppConfigService } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';

/**
 * Idempotently upsert the bootstrap ADMIN user. Reusable from step 09 seeding.
 * Hashes the password with argon2id and (re)sets role/active/name on every run.
 */
export async function seedAdmin(
  prisma: PrismaService,
  passwords: PasswordService,
  email: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const passwordHash = await passwords.hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, isActive: true, name: 'ALTAN Admin' },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      name: 'ALTAN Admin',
    },
    select: { id: true, email: true },
  });
  return user;
}

/**
 * Standalone entrypoint: boots a Nest application context to get validated env (.env via
 * @nestjs/config) + DI, resolves the services, upserts the admin, then closes.
 * Run: `cd apps/api && pnpm exec ts-node src/scripts/seed-admin.ts`
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const config = app.get(AppConfigService);
    const prisma = app.get(PrismaService);
    const passwords = app.get(PasswordService);

    const email = config.get('ADMIN_EMAIL');
    const password = config.get('ADMIN_PASSWORD');
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in apps/api/.env to seed admin.');
    }

    const user = await seedAdmin(prisma, passwords, email, password);
    console.log(`Seeded ADMIN user: ${user.email} (${user.id})`);
  } finally {
    await app.close();
  }
}

// Only run when invoked directly (not when imported by step 09).
if (require.main === module) {
  main().catch((err) => {
    console.error('seed-admin failed:', err);
    process.exit(1);
  });
}
