import type { I18nCatalog, ProcessStep, SiteContent, SiteStats } from '@altan/shared';
import { API_BASE_URL, REVALIDATE_SECONDS } from '../env';

/**
 * Plain fetch (not the `server-only` helper) so it can also run inside the
 * next-intl request config, which executes outside the server-component graph.
 */
async function get<T>(path: string, revalidate = REVALIDATE_SECONDS): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** `GET /i18n/:locale` — flat translation catalog (admin-editable copy overlay). */
export function fetchI18nCatalog(locale: string): Promise<I18nCatalog | null> {
  return get<I18nCatalog>(`/i18n/${locale}`);
}

/**
 * `GET /content?locale=` — site content map (header brand, trust badges, footer…),
 * resolved to the active locale by the backend with EN fallback. Always pass the
 * active locale so RU/UZ get admin-authored localized copy (not the EN base).
 */
export function fetchSiteContent(locale?: string): Promise<SiteContent | null> {
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : '';
  return get<SiteContent>(`/content${query}`);
}

/** Builds a `?locale=` suffix; empty when no locale is supplied. */
function localeQuery(locale?: string): string {
  return locale ? `?locale=${encodeURIComponent(locale)}` : '';
}

/**
 * `GET /stats?locale=` — hero chips + process-bar stats, localized by the backend
 * (EN base + RU/UZ overrides). Always pass the active locale so labels/values
 * (e.g. "12ч"/"12 soat") render in the page language.
 */
export function fetchStats(locale?: string): Promise<SiteStats | null> {
  return get<SiteStats>(`/stats${localeQuery(locale)}`);
}

/**
 * `GET /process-steps?locale=` — the "How ALTAN works" steps, localized by the
 * backend with EN fallback. Always pass the active locale.
 */
export function fetchProcessSteps(locale?: string): Promise<ProcessStep[] | null> {
  return get<ProcessStep[]>(`/process-steps${localeQuery(locale)}`);
}
