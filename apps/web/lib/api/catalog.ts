import type {
  Badge,
  Category,
  NewsCard,
  NewsDetail,
  Paginated,
  ProductCard,
  ProductDetail,
  Region,
} from '@altan/shared';
import { apiGet } from './server';

export interface ProductFilters {
  category?: string;
  region?: string;
  featured?: boolean;
  badge?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  locale?: string;
}

/** `GET /products` — paginated, filtered, localized product cards. */
export function fetchProducts(filters: ProductFilters): Promise<Paginated<ProductCard> | null> {
  return apiGet<Paginated<ProductCard>>('/products', {
    params: {
      category: filters.category,
      region: filters.region,
      featured: filters.featured ? 'true' : undefined,
      badge: filters.badge,
      q: filters.q,
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
      locale: filters.locale,
    },
  });
}

/** `GET /products/:slug` — full localized product detail. */
export function fetchProduct(slug: string, locale: string): Promise<ProductDetail | null> {
  return apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`, {
    params: { locale },
  });
}

export function fetchCategories(): Promise<Category[] | null> {
  return apiGet<Category[]>('/categories');
}

/**
 * `GET /regions?locale=` — supply regions, localized by the backend with EN
 * fallback. Pass the active locale so region names (e.g. "Центральная Азия" /
 * "Markaziy Osiyo") render in the page language.
 */
export function fetchRegions(locale?: string): Promise<Region[] | null> {
  return apiGet<Region[]>('/regions', { params: { locale } });
}

export function fetchBadges(): Promise<Badge[] | null> {
  return apiGet<Badge[]>('/badges');
}

/** `GET /news` — paginated localized market-intelligence cards. */
export function fetchNews(locale: string, limit = 3): Promise<Paginated<NewsCard> | null> {
  return apiGet<Paginated<NewsCard>>('/news', { params: { locale, limit } });
}

/** `GET /news/:slug` — localized news article. */
export function fetchNewsArticle(slug: string, locale: string): Promise<NewsDetail | null> {
  return apiGet<NewsDetail>(`/news/${encodeURIComponent(slug)}`, { params: { locale } });
}
