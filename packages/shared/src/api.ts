/**
 * Convenience type aliases over the auto-generated OpenAPI types (`api-types.ts`).
 * Import these in the apps instead of reaching into `components['schemas'][...]`.
 *
 * The backend now annotates its nullable string fields with an explicit
 * `type: String`, so openapi-typescript renders them as `string | null` directly
 * and no local override is needed.
 */
import type { components } from './api-types.js';

type Schemas = components['schemas'];

export type ProductCard = Schemas['ProductCardDto'];

export type ProductSpec = Schemas['ProductSpecDto'];

export type ProductDetail = Schemas['ProductDetailDto'];

export type Category = Schemas['CategoryDto'];
export type Region = Schemas['RegionDto'];
export type Badge = Schemas['BadgeDto'];

export type NewsCard = Schemas['NewsCardDto'];

export type NewsDetail = Schemas['NewsDetailDto'];

export type ProcessStep = Schemas['ProcessStepDto'];
export type SiteStat = Schemas['SiteStatDto'];
export type PaginationMeta = Schemas['PaginationMetaDto'];

export type CreateQuoteRequest = Schemas['CreateQuoteRequestDto'];
export type CreateQuoteResponse = Schemas['CreateQuoteResponseDto'];

/** Standard `{ data, meta }` envelope returned by list endpoints. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Site stats grouped by where they render (hero chips vs. process bar). */
export interface SiteStats {
  HERO: SiteStat[];
  PROCESS_BAR: SiteStat[];
}

/**
 * Footer content shape (a `/content` key). The content API returns arbitrary
 * JSON per key; this is the subset the footer component reads.
 */
export interface FooterContent {
  email?: string;
  phone?: string;
  address?: string;
  tagline?: string;
  copyright?: string;
  companyName?: string;
  columns?: Array<{
    heading: string;
    links: Array<{ href: string; label: string }>;
  }>;
}

/** The `/content` response: a map of content key → arbitrary JSON value. */
export interface SiteContent {
  companyName?: string;
  tagline?: string;
  tag?: string;
  trustBadges?: string[];
  footer?: FooterContent;
  [key: string]: unknown;
}

/** Flat i18n catalog as returned by `GET /i18n/:locale`. */
export type I18nCatalog = Record<string, string>;
