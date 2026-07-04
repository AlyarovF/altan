import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role as PrismaRole } from '@prisma/client';
import { Logger } from 'nestjs-pino';
import type { Role } from '@altan/shared';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './decorators/current-user.decorator';
import type { LoginResponseDto } from './dto/auth.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

/** A user with the password hash stripped out. Safe to attach to a request / return. */
export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly logger: Logger,
  ) {}

  /**
   * Validate email/password. Returns the sanitized user on success, null otherwise.
   * Audits LOGIN_FAILED (actor null) on every failed attempt.
   */
  async validateCredentials(email: string, password: string): Promise<SanitizedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = user && user.isActive && (await this.passwords.verify(user.passwordHash, password));
    if (!ok) {
      await this.audit.log({
        actorId: null,
        action: 'LOGIN_FAILED',
        entity: 'User',
        after: { email },
      });
      return null;
    }
    return this.sanitize(user);
  }

  /** Issue an access+refresh pair, persist the refresh hash, update lastLoginAt, audit LOGIN. */
  async login(user: SanitizedUser): Promise<LoginResponseDto> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user);

    await this.audit.log({
      actorId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      after: { email: user.email },
    });

    return { ...tokens, user };
  }

  /**
   * Refresh-token ROTATION:
   *  1. verify the presented refresh JWT (signature + expiry) → userId,
   *  2. load that user's active (non-revoked, non-expired) refresh rows,
   *  3. argon2-verify the presented token against each row's tokenHash,
   *  4. no match → 401; match → revoke that row and issue a new pair.
   */
  async refresh(presentedToken: string): Promise<LoginResponseDto> {
    let payload: { sub: string };
    try {
      payload = await this.tokens.verifyRefreshToken(presentedToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const now = new Date();
    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: now } },
    });

    let matched: (typeof candidates)[number] | undefined;
    for (const row of candidates) {
      if (await argon2.verify(row.tokenHash, presentedToken).catch(() => false)) {
        matched = row;
        break;
      }
    }
    if (!matched) {
      throw new UnauthorizedException('Refresh token not recognised.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active.');
    }

    const sanitized = this.sanitize(user);
    // Rotate: revoke the consumed row, then issue+store a fresh pair.
    const rotated = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({ where: { id: matched!.id }, data: { revokedAt: now } });
      const access = await this.tokens.signAccessToken(sanitized);
      const refresh = await this.tokens.signRefreshToken(sanitized.id);
      const tokenHash = await this.passwords.hash(refresh.token);
      await tx.refreshToken.create({
        data: {
          userId: sanitized.id,
          tokenHash,
          expiresAt: this.tokens.refreshExpiresAt(),
        },
      });
      return { accessToken: access, refreshToken: refresh.token };
    });

    return { ...rotated, user: sanitized };
  }

  /** Revoke the presented refresh token (or all active sessions if none supplied). */
  async logout(userId: string, presentedToken?: string): Promise<void> {
    const now = new Date();
    if (!presentedToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return;
    }
    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });
    for (const row of candidates) {
      if (await argon2.verify(row.tokenHash, presentedToken).catch(() => false)) {
        await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: now } });
      }
    }
  }

  /** Resolve the current principal into a fresh sanitized user for GET /auth/me. */
  async me(principal: AuthUser): Promise<SanitizedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: principal.id } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active.');
    }
    return this.sanitize(user);
  }

  /** Sign tokens and persist the refresh hash for a sanitized user. */
  private async issueTokens(
    user: SanitizedUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.tokens.signAccessToken(user);
    const refresh = await this.tokens.signRefreshToken(user.id);
    const tokenHash = await this.passwords.hash(refresh.token);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt: this.tokens.refreshExpiresAt() },
    });
    return { accessToken, refreshToken: refresh.token };
  }

  private sanitize(user: {
    id: string;
    email: string;
    name: string;
    role: PrismaRole;
  }): SanitizedUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
  }
}
