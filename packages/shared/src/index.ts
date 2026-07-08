/**
 * @altan/shared — single source of truth for cross-app domain types, enums and
 * validation schemas. Imported by the API, the public site and the admin dashboard.
 * Extended in plan steps 02 / 07 (full schema + DTO schemas).
 */
import { z } from 'zod';

// Re-export the generated OpenAPI types + convenience aliases.
export type * from './api-types.js';
export * from './api.js';

/** Supported locales (EN / RU / UZ). */
export const LOCALES = ['en', 'ru', 'uz'] as const;
export type Locale = (typeof LOCALES)[number];

/** Incoterms offered by ALTAN. */
export const INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

/**
 * Canonical units of measure for quantities and indicative prices.
 * MT = metric tonne, mtu = metric tonne unit (10 kg of contained WO3, APT convention),
 * pcs = pieces (tooling/instruments).
 */
export const UNITS = ['MT', 'kg', 'g', 'lb', 'mtu', 'pcs'] as const;
export type Unit = (typeof UNITS)[number];

/** Currencies supported for indicative product pricing (USD primary). Mirrors Prisma `Currency`. */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  CNY = 'CNY',
  RUB = 'RUB',
  UZS = 'UZS',
}

/** Currency list convention (mirrors INCOTERMS) for selects / zod enums. */
export const CURRENCIES = [
  Currency.USD,
  Currency.EUR,
  Currency.CNY,
  Currency.RUB,
  Currency.UZS,
] as const;

/** Product categories shown in the catalog. */
export const PRODUCT_CATEGORIES = [
  'Metals & Alloys',
  'Carbide Tooling',
  'Technical Ceramics',
  'Instruments & Equipment',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export enum Role {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

/** Product badges: 🔥 Hot / ✨ NEW. */
export enum BadgeCode {
  HOT = 'HOT',
  NEW = 'NEW',
}

/** Market-intelligence outlook tag. */
export enum Outlook {
  FIRM = 'FIRM',
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  MIXED = 'MIXED',
}

/** Direction of a news price change (drives the up/down/flat colour). */
export enum ChangeDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT',
}

/** Quote request lifecycle. */
export enum QuoteStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  QUOTED = 'QUOTED',
  WON = 'WON',
  LOST = 'LOST',
  CLOSED = 'CLOSED',
}

/** Where a quote request originated (used for attribution/analytics). */
export enum QuoteSource {
  WEB = 'WEB',
  ADMIN = 'ADMIN',
  API = 'API',
}

/** Grouping for SiteStat rows (hero counters vs. process bar trust items). */
export enum SiteStatGroup {
  HERO = 'HERO',
  PROCESS_BAR = 'PROCESS_BAR',
}

/** Media asset kind. */
export enum MediaType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
}

/** Uppercase locale codes as persisted in the DB Translation table (EN/RU/UZ). */
export enum LocaleCode {
  EN = 'EN',
  RU = 'RU',
  UZ = 'UZ',
}

/** ALTAN's marketed quote-response SLA (hours). */
export const SLA_QUOTE_RESPONSE_HOURS = 12;

// --- State machines (documented; enforced in services in later steps) ---

/**
 * QuoteRequest lifecycle transitions.
 * NEW → IN_REVIEW → QUOTED → (WON | LOST) → CLOSED.
 * Any non-terminal state may go straight to CLOSED (e.g. spam/withdrawn).
 * WON/LOST are terminal-but-reportable; CLOSED is fully terminal.
 */
export const QUOTE_STATUS_TRANSITIONS: Readonly<Record<QuoteStatus, readonly QuoteStatus[]>> = {
  [QuoteStatus.NEW]: [QuoteStatus.IN_REVIEW, QuoteStatus.CLOSED],
  [QuoteStatus.IN_REVIEW]: [QuoteStatus.QUOTED, QuoteStatus.LOST, QuoteStatus.CLOSED],
  [QuoteStatus.QUOTED]: [QuoteStatus.WON, QuoteStatus.LOST, QuoteStatus.CLOSED],
  [QuoteStatus.WON]: [QuoteStatus.CLOSED],
  [QuoteStatus.LOST]: [QuoteStatus.CLOSED],
  [QuoteStatus.CLOSED]: [],
} as const;

/**
 * ProductStatus lifecycle. DRAFT ⇄ PUBLISHED (an editor can publish a draft or
 * unpublish back to draft; there is no hard-delete state — removal is a separate concern).
 */
export const PRODUCT_STATUS_TRANSITIONS: Readonly<Record<ProductStatus, readonly ProductStatus[]>> =
  {
    [ProductStatus.DRAFT]: [ProductStatus.PUBLISHED],
    [ProductStatus.PUBLISHED]: [ProductStatus.DRAFT],
  } as const;

// --- Validation schemas (boundary DTOs reused by API + frontend forms) ---

export const quoteItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.enum(UNITS),
  notes: z.string().max(2000).optional(),
});
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

export const quoteRequestSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  country: z.string().min(1).max(100),
  incoterm: z.enum(INCOTERMS),
  destination: z.string().min(1).max(200),
  message: z.string().max(4000).optional(),
  items: z.array(quoteItemSchema).min(1),
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
