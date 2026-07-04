import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { LocaleCode } from '@altan/shared';

/** Lowercase locale values accepted on public query params. */
export const LOCALE_QUERY_VALUES = ['en', 'ru', 'uz'] as const;
export type LocaleQueryValue = (typeof LOCALE_QUERY_VALUES)[number];

/** Optional `?locale=en|ru|uz` query param for public localized reads. */
export class LocaleQueryDto {
  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    description: 'Response locale; defaults to en.',
  })
  @IsOptional()
  @IsIn(LOCALE_QUERY_VALUES)
  locale?: LocaleQueryValue;
}

/** Map a lowercase query locale (or undefined) to the DB `LocaleCode` (default EN). */
export function toLocaleCode(locale?: string): LocaleCode {
  switch (locale) {
    case 'ru':
      return LocaleCode.RU;
    case 'uz':
      return LocaleCode.UZ;
    case 'en':
    default:
      return LocaleCode.EN;
  }
}

/**
 * Overlay a translation row's non-null fields onto the base record. Any field present
 * (non-null/undefined) on `translation` wins; otherwise the base value is kept. Only keys
 * already present on `base` are considered, so this never leaks translation-only columns.
 */
export function pickLocalized<TBase extends Record<string, unknown>>(
  base: TBase,
  translation: Partial<TBase> | null | undefined,
  _locale?: LocaleCode,
): TBase {
  if (!translation) return base;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    const value = translation[key as keyof TBase];
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as TBase;
}
