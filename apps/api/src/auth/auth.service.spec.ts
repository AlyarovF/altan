import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '@altan/shared';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

type AnyFn = jest.Mock;

interface MockPrisma {
  user: { findUnique: AnyFn; update: AnyFn };
  refreshToken: { findMany: AnyFn; create: AnyFn; update: AnyFn; updateMany: AnyFn };
  $transaction: AnyFn;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: {
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'new-rt' }),
      update: jest.fn().mockResolvedValue({ id: 'old-rt' }),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (cb: (tx: MockPrisma) => unknown) =>
    typeof cb === 'function' ? cb(prisma) : Promise.all(cb as unknown as Promise<unknown>[]),
  );
  return prisma;
}

const ACTIVE_USER = {
  id: 'u1',
  email: 'admin@altan.test',
  name: 'ALTAN Admin',
  role: Role.ADMIN,
  isActive: true,
  passwordHash: 'x',
};

function makeService(prisma: MockPrisma, tokens: Record<string, AnyFn>): AuthService {
  const passwords = new PasswordService();
  const audit = { log: jest.fn() };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  // reason: inject lightweight mocks in place of concrete Nest providers for unit isolation.
  return new AuthService(
    prisma as never,
    passwords as never,
    tokens as never,
    audit as never,
    logger as never,
  );
}

describe('AuthService refresh rotation', () => {
  it('rotates: verifies token against stored hash, revokes old row, issues a new pair', async () => {
    const presented = 'refresh-token-string';
    const storedHash = await argon2.hash(presented, { type: argon2.argon2id });
    const prisma = makePrisma();
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt-1', tokenHash: storedHash, userId: 'u1' },
    ]);
    prisma.user.findUnique.mockResolvedValue(ACTIVE_USER);

    const tokens = {
      verifyRefreshToken: jest.fn().mockResolvedValue({ sub: 'u1', jti: 'j1' }),
      signAccessToken: jest.fn().mockResolvedValue('new-access'),
      signRefreshToken: jest.fn().mockResolvedValue({ token: 'new-refresh', jti: 'j2' }),
      refreshExpiresAt: jest.fn().mockReturnValue(new Date(Date.now() + 1000)),
    };
    const service = makeService(prisma, tokens);

    const res = await service.refresh(presented);

    expect(res.accessToken).toBe('new-access');
    expect(res.refreshToken).toBe('new-refresh');
    expect(res.user.id).toBe('u1');
    // Old row revoked.
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt-1' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
    // New row stored.
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('401 when no stored hash matches the presented token', async () => {
    const otherHash = await argon2.hash('a-different-token', { type: argon2.argon2id });
    const prisma = makePrisma();
    prisma.refreshToken.findMany.mockResolvedValue([
      { id: 'rt-1', tokenHash: otherHash, userId: 'u1' },
    ]);

    const tokens = {
      verifyRefreshToken: jest.fn().mockResolvedValue({ sub: 'u1', jti: 'j1' }),
    };
    const service = makeService(prisma, tokens);

    await expect(service.refresh('presented-but-unmatched')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('401 when the refresh JWT itself fails verification', async () => {
    const prisma = makePrisma();
    const tokens = { verifyRefreshToken: jest.fn().mockRejectedValue(new Error('bad sig')) };
    const service = makeService(prisma, tokens);

    await expect(service.refresh('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.findMany).not.toHaveBeenCalled();
  });
});
