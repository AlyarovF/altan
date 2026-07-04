/** Validated runtime env for the admin SPA. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

if (!API_BASE_URL) {
  // Fail loud at boot rather than producing confusing 404s against a relative URL.
  throw new Error('VITE_API_BASE_URL is not set. Create apps/admin/.env from .env.example.');
}

/**
 * Origin of the API server (without the `/api/v1` prefix). Static media uploaded
 * via `POST /admin/media` is served from here at `/media/...`.
 */
export const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  }
})();

/**
 * Resolve a stored `imageUrl` to a loadable URL. Absolute URLs (external images)
 * pass through; relative `/media/...` paths are joined onto the API origin.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export { API_BASE_URL };
