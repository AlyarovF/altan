import { SetMetadata } from '@nestjs/common';
import { Role } from '@altan/shared';

/** Metadata key carrying the roles required for a route. */
export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. ADMIN is always allowed (handled in RolesGuard).
 * Listing a lower role (e.g. EDITOR) implicitly permits higher privilege roles only via
 * the explicit list — list every role you intend to allow, ADMIN excepted.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
