import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Role } from '@altan/shared';

/** The authenticated principal attached to the request by JwtStrategy. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Injects the authenticated `AuthUser` (set by JwtStrategy.validate) into a handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return req.user;
  },
);
