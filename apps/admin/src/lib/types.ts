/**
 * Admin-facing type aliases over the generated OpenAPI contract in `@altan/shared`.
 * Reach for these instead of `components['schemas'][...]`. Re-exports the shared
 * enums/aliases too so features import from a single place.
 */
import type { components } from '@altan/shared';

type S = components['schemas'];

export type AuthUser = S['AuthUserDto'];
export type LoginResponse = S['LoginResponseDto'];

export type AdminProduct = S['AdminProductDto'];
/** Full editable product from `GET /admin/products/:id` (specs + per-locale translations). */
export type AdminProductDetail = S['AdminProductDetailDto'];
export type CreateProductInput = S['CreateProductDto'];
export type UpdateProductInput = S['UpdateProductDto'];
export type ProductSpecInput = S['ProductSpecInputDto'];
export type ProductTranslationInput = S['ProductTranslationInputDto'];
export type ProductDetail = S['ProductDetailDto'];
export type MediaAsset = S['MediaAssetDto'];

export type Category = S['CategoryDto'];
export type CreateCategoryInput = S['CreateCategoryDto'];
export type UpdateCategoryInput = S['UpdateCategoryDto'];
export type Region = S['RegionDto'];
export type CreateRegionInput = S['CreateRegionDto'];
export type UpdateRegionInput = S['UpdateRegionDto'];
export type Badge = S['BadgeDto'];
export type UpsertBadgeInput = S['UpsertBadgeDto'];
export type ReorderItem = S['ReorderItemDto'];

export type AdminNews = S['AdminNewsDto'];
export type CreateNewsInput = S['CreateNewsDto'];
export type UpdateNewsInput = S['UpdateNewsDto'];
export type NewsTranslationInput = S['NewsTranslationInputDto'];

export type AdminQuoteListItem = S['AdminQuoteListItemDto'];
export type AdminQuoteDetail = S['AdminQuoteDetailDto'];
export type QuoteItem = S['QuoteItemDto'];
export type UpdateQuoteStatusInput = S['UpdateQuoteStatusDto'];
export type RespondQuoteInput = S['RespondQuoteDto'];

export type ContentItem = S['ContentItemDto'];
export type UpsertContentInput = S['UpsertContentDto'];
/** All three locale values for a content key (RU/UZ are `null` when they fall back to EN). */
export type ContentKeyLocales = S['ContentKeyLocalesDto'];
/** Supported content/UI locales. */
export type Locale = NonNullable<ContentItem['locale']>;
export type ProcessStep = S['ProcessStepDto'];
export type UpsertProcessStepInput = S['UpsertProcessStepDto'];
export type SiteStat = S['SiteStatDto'];
export type UpsertSiteStatInput = S['UpsertSiteStatDto'];

export type Translation = S['TranslationDto'];
export type UpsertTranslationInput = S['UpsertTranslationDto'];
/** `missing` is typed as `object` in the contract; refine to per-locale key arrays. */
export interface MissingTranslations {
  missing: { en?: string[]; ru?: string[]; uz?: string[] };
}
export type ImportTranslationsResult = S['ImportTranslationsResultDto'];
export type PaginationMeta = S['PaginationMetaDto'];

/** Standard `{ data, meta }` envelope returned by paginated list endpoints. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
