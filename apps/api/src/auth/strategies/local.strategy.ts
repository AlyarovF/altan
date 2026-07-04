import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService, type SanitizedUser } from '../auth.service';

/**
 * Username/password strategy (usernameField = email). Delegates credential checking to
 * AuthService.validateCredentials, which audits failures and returns a sanitized user.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<SanitizedUser> {
    const user = await this.authService.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return user;
  }
}
