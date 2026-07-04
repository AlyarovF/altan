import { apiClient } from '@/lib/api/client';
import type { AuthUser, LoginResponse } from '@/lib/types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

export async function logout(refreshToken: string | null): Promise<void> {
  // Best-effort server-side revocation; ignore failures (token may already be invalid).
  try {
    await apiClient.post('/auth/logout', { refreshToken });
  } catch {
    /* noop */
  }
}
