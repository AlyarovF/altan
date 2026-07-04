import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * Auth module: JWT access/refresh issuance + rotation, Passport local/jwt strategies.
 * JwtAuthGuard + RolesGuard are wired GLOBALLY in app.module.ts (APP_GUARD), so every
 * route is protected by default; this module only owns the auth endpoints + services.
 */
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, JwtStrategy, LocalStrategy],
  exports: [AuthService, PasswordService, TokenService],
})
export class AuthModule {}
