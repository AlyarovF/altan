import type { ReactNode } from 'react';
import { useSessionStore } from '@/stores/session';
import { can, type Permission } from '@/lib/rbac';

/** Conditionally render children if the current user holds `permission`. */
export function Can({ permission, children }: { permission: Permission; children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  return can(user, permission) ? <>{children}</> : null;
}

export function usePermission(permission: Permission): boolean {
  const user = useSessionStore((s) => s.user);
  return can(user, permission);
}
