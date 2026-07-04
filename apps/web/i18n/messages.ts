import type { AbstractIntlMessages } from 'next-intl';
import type { I18nCatalog } from '@altan/shared';
import { fetchI18nCatalog } from '@/lib/api/content';
import type { AppLocale } from './routing';

/** Deep-merge plain objects (b wins). Used to overlay backend copy on the static fallback. */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      out[key] = deepMerge(existing as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Expand a flat `"a.b.c": value` catalog into a nested object for next-intl. */
function unflatten(catalog: I18nCatalog): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [flatKey, value] of Object.entries(catalog)) {
    const parts = flatKey.split('.');
    let node = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i]!;
      if (typeof node[part] !== 'object' || node[part] === null) node[part] = {};
      node = node[part] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]!] = value;
  }
  return root;
}

/**
 * Resolve the message catalog for a locale, layering three sources (later wins):
 *
 *   1. English base    — guarantees every key resolves; RU/UZ inherit EN copy
 *                        for any string not yet translated (no key-path leaks).
 *   2. Locale JSON      — the bundled translations for this locale.
 *   3. Backend catalog  — admin-editable copy overlay (`GET /i18n/:locale`), so
 *                        user-facing strings can change without a redeploy.
 *
 * If the API is down we still render from the bundled catalogs — no hard failure.
 */
export async function getMessages(locale: AppLocale): Promise<AbstractIntlMessages> {
  const en = (await import(`../messages/en.json`)).default as Record<string, unknown>;
  const localeMessages =
    locale === 'en'
      ? en
      : deepMerge(
          en,
          (await import(`../messages/${locale}.json`)).default as Record<string, unknown>,
        );

  const remote = await fetchI18nCatalog(locale);
  if (!remote || Object.keys(remote).length === 0) {
    return localeMessages as AbstractIntlMessages;
  }
  return deepMerge(localeMessages, unflatten(remote)) as AbstractIntlMessages;
}
