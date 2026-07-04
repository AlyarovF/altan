import { Role } from '@altan/shared';
import type { AuthUser } from '@/lib/types';

/**
 * RBAC matrix for the admin UI. The UI gate is UX-only — the API is the real
 * authority — but matching the server's rules avoids dead-end actions.
 *
 * - ADMIN  : everything.
 * - EDITOR : catalog + news + site content/translations (no quote workflow).
 * - SALES  : quote workspace + read-only catalog/news.
 * - VIEWER : read-only across the board.
 */
export type Permission =
  | 'product.read'
  | 'product.write'
  | 'news.read'
  | 'news.write'
  | 'quote.read'
  | 'quote.write'
  | 'content.read'
  | 'content.write'
  | 'taxonomy.write';

const MATRIX: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    'product.read',
    'product.write',
    'news.read',
    'news.write',
    'quote.read',
    'quote.write',
    'content.read',
    'content.write',
    'taxonomy.write',
  ],
  [Role.EDITOR]: [
    'product.read',
    'product.write',
    'news.read',
    'news.write',
    'content.read',
    'content.write',
    'taxonomy.write',
    'quote.read',
  ],
  [Role.SALES]: ['product.read', 'news.read', 'quote.read', 'quote.write', 'content.read'],
  [Role.VIEWER]: ['product.read', 'news.read', 'quote.read', 'content.read'],
};

export function roleOf(user: AuthUser | null): Role | null {
  return (user?.role as Role) ?? null;
}

export function can(user: AuthUser | null, permission: Permission): boolean {
  const role = roleOf(user);
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}
