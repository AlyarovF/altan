import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, type SanitizedUser } from './auth.service';
import { CurrentUser, type AuthUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthUserDto, LoginDto, LoginResponseDto, LogoutDto, RefreshDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password; returns access/refresh tokens.' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or inactive user.' })
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request & { user: SanitizedUser },
  ): Promise<LoginResponseDto> {
    // LocalAuthGuard → LocalStrategy.validate already verified creds and set req.user.
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token for a new access/refresh pair.' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid, expired, or revoked.' })
  async refresh(@Body() dto: RefreshDto): Promise<LoginResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the supplied refresh token (or all active sessions).' })
  @ApiNoContentResponse({ description: 'Logged out.' })
  async logout(@CurrentUser() user: AuthUser, @Body() dto: LogoutDto): Promise<void> {
    await this.authService.logout(user.id, dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Return the authenticated user profile (never the password hash).' })
  @ApiOkResponse({ type: AuthUserDto })
  async me(@CurrentUser() user: AuthUser): Promise<AuthUserDto> {
    return this.authService.me(user);
  }
}
