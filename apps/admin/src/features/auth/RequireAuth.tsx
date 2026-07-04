import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { useSessionStore } from '@/stores/session';
import { qk } from '@/lib/queryClient';
import { fetchMe } from './api';

/**
 * Route guard. Redirects unauthenticated users to /login (preserving the target
 * path), and revalidates the session against /auth/me on mount so role changes
 * and revoked tokens are caught. A 401 here triggers refresh via the interceptor;
 * if that also fails the session is cleared and we bounce to /login.
 */
export function RequireAuth() {
  const location = useLocation();
  const accessToken = useSessionStore((s) => s.accessToken);
  const setUser = useSessionStore((s) => s.setUser);
  const clear = useSessionStore((s) => s.clear);

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.me,
    queryFn: fetchMe,
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) clear();
  }, [isError, clear]);

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  if (isError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
