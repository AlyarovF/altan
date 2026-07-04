import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@altan/shared';
import type { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

function makeContext(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeReflector(meta: { isPublic?: boolean; roles?: Role[] }): Reflector {
  return {
    getAllAndOverride: (key: string) => {
      if (key === IS_PUBLIC_KEY) return meta.isPublic;
      if (key === ROLES_KEY) return meta.roles;
      return undefined;
    },
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('skips check for public routes', () => {
    const guard = new RolesGuard(makeReflector({ isPublic: true }));
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows ADMIN always, regardless of required roles', () => {
    const guard = new RolesGuard(makeReflector({ roles: [Role.SALES] }));
    expect(guard.canActivate(makeContext({ id: '1', email: 'a', role: Role.ADMIN }))).toBe(true);
  });

  it('allows when user role is in the required list', () => {
    const guard = new RolesGuard(makeReflector({ roles: [Role.EDITOR] }));
    expect(guard.canActivate(makeContext({ id: '1', email: 'a', role: Role.EDITOR }))).toBe(true);
  });

  it('allows any authenticated user when no roles are required', () => {
    const guard = new RolesGuard(makeReflector({}));
    expect(guard.canActivate(makeContext({ id: '1', email: 'a', role: Role.VIEWER }))).toBe(true);
  });

  it('denies when user role is insufficient', () => {
    const guard = new RolesGuard(makeReflector({ roles: [Role.SALES] }));
    expect(() =>
      guard.canActivate(makeContext({ id: '1', email: 'a', role: Role.VIEWER })),
    ).toThrow(ForbiddenException);
  });

  it('denies (fail closed) when no user is present', () => {
    const guard = new RolesGuard(makeReflector({ roles: [Role.SALES] }));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
