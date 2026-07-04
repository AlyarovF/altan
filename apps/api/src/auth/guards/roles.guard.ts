import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@altan/shared';
import type { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-based access control. Runs after JwtAuthGuard (so request.user is populated).
 *  - Public routes are skipped.
 *  - ADMIN is always allowed.
 *  - If no @Roles metadata, any authenticated user passes.
 *  - Otherwise the user's role must be in the allowed list.
 * Registered as an APP_GUARD AFTER JwtAuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    if (!user) {
      // Should have been caught by JwtAuthGuard; fail closed.
      throw new ForbiddenException('Authentication required.');
    }

    // ADMIN bypasses all role checks.
    if (user.role === Role.ADMIN) return true;

    // No explicit roles required → any authenticated user is allowed.
    if (!requiredRoles || requiredRoles.length === 0) return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role for this resource.');
    }
    return true;
  }
}
