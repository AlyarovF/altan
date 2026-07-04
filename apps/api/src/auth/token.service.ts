import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { Role } from '@altan/shared';
import { AppConfigService } from '../config/config.module';

/** Access-token JWT payload. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Refresh-token JWT payload (jti distinguishes rotated tokens). */
export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

/**
 * Signs and verifies the access/refresh JWT pair. Access tokens are short-lived bearers
 * for API calls; refresh tokens are long-lived and rotated on every use (see AuthService).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccessToken(user: { id: string; email: string; role: Role }): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL'),
    });
  }

  /** Returns the signed refresh token plus its jti (so the caller can persist a hash). */
  async signRefreshToken(userId: string): Promise<{ token: string; jti: string }> {
    const jti = randomUUID();
    const payload: RefreshTokenPayload = { sub: userId, jti };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TTL'),
    });
    return { token, jti };
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwt.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  }

  /** Refresh TTL as a Date offset from now, for the RefreshToken.expiresAt column. */
  refreshExpiresAt(from: Date = new Date()): Date {
    return new Date(from.getTime() + this.ttlToMs(this.config.get('JWT_REFRESH_TTL')));
  }

  /** Parse a TTL string like `7d`, `900s`, `15m`, `12h` into milliseconds. */
  private ttlToMs(ttl: string): number {
    const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(ttl.trim());
    if (!match) {
      // Plain number → seconds (jsonwebtoken convention).
      const asNum = Number(ttl);
      return Number.isFinite(asNum) ? asNum * 1000 : 0;
    }
    const value = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (multipliers[unit] ?? 1000);
  }
}
