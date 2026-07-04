import { ApiProperty, ApiPropertyOptional, type ApiPropertyOptions } from '@nestjs/swagger';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { SiteStatGroup } from '@altan/shared';
import { LOCALE_QUERY_VALUES, type LocaleQueryValue } from '../../common/dto/locale-query.dto';

/**
 * Swagger schema for "any JSON value" (object | array | string | number | boolean).
 * Using `oneOf` instead of a strict `type` keeps the generated client typing clean for
 * scalar content values (e.g. `tagline` string, `trustBadges` array) instead of forcing an
 * object shape onto everything.
 */
// `oneOf` isn't part of the typed `ApiPropertyOptions` surface, so we cast the raw OpenAPI
// schema fragment. This produces a clean `unknown`/union client type for scalar+object values.
const ANY_JSON_SCHEMA: ApiPropertyOptions = {
  oneOf: [
    { type: 'object', additionalProperties: true },
    { type: 'array', items: {} },
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
  ],
} as ApiPropertyOptions;

// --- SiteContent ----------------------------------------------------------

export class UpsertContentDto {
  @ApiProperty({
    description:
      'Arbitrary JSON value for this content key (object, array, string, number, or boolean).',
    ...ANY_JSON_SCHEMA,
  })
  // Site content must support scalar/array values (companyName, tagline, trustBadges…),
  // not just objects. Only `undefined` is rejected; any JSON value is accepted.
  @IsDefined()
  valueJson!: unknown;

  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    default: 'en',
    description:
      'Target locale. "en" (default) writes the base value + fallback; "ru"/"uz" write a per-locale override.',
  })
  @IsOptional()
  @IsIn(LOCALE_QUERY_VALUES)
  locale?: LocaleQueryValue;
}

export class ContentItemDto {
  @ApiProperty() key!: string;
  @ApiProperty({
    description: 'Arbitrary JSON value (object, array, string, number, or boolean).',
    ...ANY_JSON_SCHEMA,
  })
  valueJson!: unknown;

  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    description: 'Locale this value belongs to (present on locale-aware upsert responses).',
  })
  locale?: LocaleQueryValue;
}

/** All three locale values for a single content key (admin editor view). Missing RU/UZ are `null`. */
export class ContentLocaleValuesDto {
  @ApiProperty({
    description: 'EN base value (never null once the key exists).',
    ...ANY_JSON_SCHEMA,
  })
  en!: unknown;
  @ApiProperty({
    nullable: true,
    description: 'RU override, or null when it falls back to EN.',
    ...ANY_JSON_SCHEMA,
  })
  ru!: unknown | null;
  @ApiProperty({
    nullable: true,
    description: 'UZ override, or null when it falls back to EN.',
    ...ANY_JSON_SCHEMA,
  })
  uz!: unknown | null;
}

export class ContentKeyLocalesDto {
  @ApiProperty() key!: string;
  @ApiProperty({ type: ContentLocaleValuesDto }) values!: ContentLocaleValuesDto;
}

// --- ProcessStep ----------------------------------------------------------

export class ProcessStepDto {
  @ApiProperty() id!: string;
  @ApiProperty() stepNo!: number;
  @ApiProperty() key!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) subtitle!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) icon!: string | null;
  @ApiProperty() sortOrder!: number;
}

export class UpsertProcessStepDto {
  @ApiProperty() @IsInt() stepNo!: number;
  @ApiProperty() @IsString() @IsNotEmpty() key!: string;
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;
}

/** Localizable fields of a process step (title + subtitle). */
export class ProcessStepLocaleValueDto {
  @ApiProperty() title!: string;
  @ApiProperty({ type: String, nullable: true }) subtitle!: string | null;
}

/** All three locale title/subtitle values for a process step (missing RU/UZ are `null`). */
export class ProcessStepLocaleValuesDto {
  @ApiProperty({ type: ProcessStepLocaleValueDto }) en!: ProcessStepLocaleValueDto;
  @ApiProperty({ type: ProcessStepLocaleValueDto, nullable: true })
  ru!: ProcessStepLocaleValueDto | null;
  @ApiProperty({ type: ProcessStepLocaleValueDto, nullable: true })
  uz!: ProcessStepLocaleValueDto | null;
}

export class ProcessStepLocalesDto {
  @ApiProperty() id!: string;
  @ApiProperty() key!: string;
  @ApiProperty({ type: ProcessStepLocaleValuesDto }) values!: ProcessStepLocaleValuesDto;
}

export class UpsertProcessStepTranslationDto {
  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    default: 'en',
    description:
      'Target locale. "en" (default) writes the base value; "ru"/"uz" write a per-locale override.',
  })
  @IsOptional()
  @IsIn(LOCALE_QUERY_VALUES)
  locale?: LocaleQueryValue;

  @ApiProperty({ description: 'Localized step title.' }) @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional({ description: 'Localized step subtitle.' })
  @IsOptional()
  @IsString()
  subtitle?: string;
}

// --- SiteStat -------------------------------------------------------------

export class SiteStatDto {
  @ApiProperty() id!: string;
  @ApiProperty() key!: string;
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
  @ApiProperty({ enum: SiteStatGroup }) group!: SiteStatGroup;
  @ApiProperty() sortOrder!: number;
}

export class UpsertSiteStatDto {
  @ApiProperty() @IsString() @IsNotEmpty() key!: string;
  @ApiProperty() @IsString() @IsNotEmpty() label!: string;
  @ApiProperty() @IsString() @IsNotEmpty() value!: string;
  @ApiPropertyOptional({ enum: SiteStatGroup, default: SiteStatGroup.HERO })
  @IsOptional()
  @IsIn(Object.values(SiteStatGroup))
  group?: SiteStatGroup;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() sortOrder?: number;
}

/** Localizable fields of a stat (label + display value). */
export class SiteStatLocaleValueDto {
  @ApiProperty() label!: string;
  @ApiProperty({ description: 'Display value ("26+", "12h"); may differ per locale.' })
  value!: string;
}

/** All three locale label/value pairs for a stat (missing RU/UZ are `null`). */
export class SiteStatLocaleValuesDto {
  @ApiProperty({ type: SiteStatLocaleValueDto }) en!: SiteStatLocaleValueDto;
  @ApiProperty({ type: SiteStatLocaleValueDto, nullable: true }) ru!: SiteStatLocaleValueDto | null;
  @ApiProperty({ type: SiteStatLocaleValueDto, nullable: true }) uz!: SiteStatLocaleValueDto | null;
}

export class SiteStatLocalesDto {
  @ApiProperty() id!: string;
  @ApiProperty() key!: string;
  @ApiProperty({ type: SiteStatLocaleValuesDto }) values!: SiteStatLocaleValuesDto;
}

export class UpsertSiteStatTranslationDto {
  @ApiPropertyOptional({
    enum: LOCALE_QUERY_VALUES,
    default: 'en',
    description:
      'Target locale. "en" (default) writes the base value; "ru"/"uz" write a per-locale override.',
  })
  @IsOptional()
  @IsIn(LOCALE_QUERY_VALUES)
  locale?: LocaleQueryValue;

  @ApiProperty({ description: 'Localized stat label.' }) @IsString() @IsNotEmpty() label!: string;
  @ApiProperty({ description: 'Localized display value ("26+", "12h").' })
  @IsString()
  @IsNotEmpty()
  value!: string;
}

// --- Translations ---------------------------------------------------------

export class UpsertTranslationDto {
  @ApiPropertyOptional({ default: 'common' }) @IsOptional() @IsString() namespace?: string;
  @ApiProperty() @IsString() @IsNotEmpty() key!: string;
  @ApiProperty({ enum: ['en', 'ru', 'uz'] }) @IsIn(['en', 'ru', 'uz']) locale!: 'en' | 'ru' | 'uz';
  @ApiProperty() @IsString() value!: string;
}

export class TranslationDto {
  @ApiProperty() id!: string;
  @ApiProperty() namespace!: string;
  @ApiProperty() key!: string;
  @ApiProperty({ enum: ['en', 'ru', 'uz'] }) locale!: 'en' | 'ru' | 'uz';
  @ApiProperty() value!: string;
}

/**
 * Import shape: `{ [locale]: { "namespace.key": value } }`. Keys without a dot default to
 * the `common` namespace. Example: `{ "en": { "common.cta.quote": "Get a quote" } }`.
 */
export class ImportTranslationsDto {
  @ApiProperty({
    description: 'Flat catalog keyed by locale then "namespace.key".',
    example: { en: { 'common.cta.quote': 'Get a quote' }, ru: { 'common.cta.quote': 'Запросить' } },
  })
  @IsObject()
  data!: Record<string, Record<string, string>>;
}

export class ImportTranslationsResultDto {
  @ApiProperty({ description: 'Upserted entries per locale.', example: { en: 12, ru: 12, uz: 8 } })
  imported!: Record<string, number>;
  @ApiProperty() total!: number;
}

export class MissingTranslationsDto {
  @ApiProperty({ description: 'EN keys missing in RU / UZ as "namespace.key".' })
  missing!: { ru: string[]; uz: string[] };
}

export class RevalidateResultDto {
  @ApiProperty({ description: 'New content version counter.' }) version!: number;
}
