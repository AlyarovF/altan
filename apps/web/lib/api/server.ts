import 'server-only';
import { API_BASE_URL, REVALIDATE_SECONDS } from '../env';

export interface ServerFetchOptions {
  /** Query params (undefined/empty values are dropped). */
  params?: Record<string, string | number | boolean | undefined>;
  /** ISR revalidate window in seconds (default 300). Pass 0 to opt out of caching. */
  revalidate?: number;
  /** Cache tags for on-demand revalidation. */
  tags?: string[];
}

function buildUrl(path: string, params?: ServerFetchOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Server-component fetch helper for the public API. Uses Next's fetch cache with
 * ISR `revalidate`. Returns `null` on any failure so callers can render an
 * empty/error state instead of crashing the whole page tree.
 */
export async function apiGet<T>(path: string, options: ServerFetchOptions = {}): Promise<T | null> {
  const { params, revalidate = REVALIDATE_SECONDS, tags } = options;
  try {
    const res = await fetch(buildUrl(path, params), {
      headers: { Accept: 'application/json' },
      next: { revalidate, ...(tags ? { tags } : {}) },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[api] GET ${path} -> ${res.status}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] GET ${path} failed`, err);
    return null;
  }
}
