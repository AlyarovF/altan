/**
 * Runtime config for the public site.
 *
 * `NEXT_PUBLIC_API_BASE_URL` is inlined at build time and used by the **browser**. In a
 * proxied deployment it is a relative path (e.g. `/api/v1`) so calls stay same-origin
 * (Next rewrites forward them to the API) — this keeps the site reachable via any host
 * (public IP or tunnel) with no CORS. On the **server** (SSR/ISR/build) we prefer
 * `API_INTERNAL_BASE_URL` (e.g. http://localhost:3001/api/v1) to talk to the API directly.
 */
const browserBase = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1'
).replace(/\/$/, '');
const serverBase = (
  process.env.API_INTERNAL_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001/api/v1'
).replace(/\/$/, '');

export const API_BASE_URL = typeof window === 'undefined' ? serverBase : browserBase;

/** Public site origin, used for canonical URLs / sitemap / OpenGraph. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** ISR revalidation window (seconds) for content-driven pages. */
export const REVALIDATE_SECONDS = 300;

/**
 * Origin the browser should load uploaded media (`/media/...`) from. Derived from the
 * browser base; empty when that base is relative (media then stays same-origin and is
 * forwarded by the Next rewrite).
 */
export const API_ORIGIN = (() => {
  try {
    return new URL(browserBase).origin;
  } catch {
    return '';
  }
})();

/**
 * Resolve a product's stored `imageUrl` to a loadable URL: absolute URLs pass through;
 * relative `/media/...` paths are joined onto {@link API_ORIGIN} (same-origin when empty).
 * Returns `undefined` when absent so callers can fall back gracefully.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
