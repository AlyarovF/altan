import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/env';
import { sessionApi } from '@/stores/session';

/**
 * Authenticated axios instance for the admin SPA. Mirrors the apps/web axios
 * pattern (same baseURL/error normalization) and adds: (1) bearer-token attach
 * from the session store, and (2) transparent refresh-on-401 with a single-flight
 * refresh promise so concurrent 401s don't stampede the refresh endpoint.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

export interface NormalizedError {
  message: string;
  status?: number;
  fields?: Record<string, string>;
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join(' ') : (raw ?? err.message);
    return { message, status };
  }
  return { message: err instanceof Error ? err.message : 'Unexpected error' };
}

// Attach the access token to every request.
apiClient.interceptors.request.use((config) => {
  const token = sessionApi.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string> | null = null;

/** Single-flight refresh: returns the new access token or throws. */
async function runRefresh(): Promise<string> {
  const refreshToken = sessionApi.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  // Bare axios (no interceptors) to avoid recursion.
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  sessionApi.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        refreshPromise ??= runRefresh().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed → hard logout; route guard will redirect to /login.
        sessionApi.clear();
      }
    }
    return Promise.reject(error);
  },
);
