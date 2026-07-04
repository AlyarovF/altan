import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '@altan/shared';
import { AppConfigService } from '../../config/config.module';
import type { AuthUser } from '../decorators/current-user.decorator';
import type { AccessTokenPayload } from '../token.service';

/**
 * Validates the Bearer access token. On success Passport attaches the returned `AuthUser`
 * to `request.user` — never the password hash or anything sensitive.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: AccessTokenPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid access token.');
    }
    return { id: payload.sub, email: payload.email, role: payload.role as Role };
  }
}
