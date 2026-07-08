/**
 * ALTAN seed fixtures (typed).
 *
 * Single source of truth for the data `prisma/seed.ts` upserts so a fresh DB returns the
 * real ALTAN site on first boot. Display strings (prices, grades) are faithful to the brand
 * brief — money is a DISPLAY STRING in this phase (see schema header), not arithmetic.
 *
 * Re-running the seed must NOT duplicate rows, so every record carries a stable natural key
 * (category.slug, region.code, product.slug, news.slug, processStep.key, stat.key,
 * content.key, translation [namespace,key,locale]).
 */
import {
  BadgeCode,
  ChangeDirection,
  Currency,
  LocaleCode,
  Outlook,
  ProductStatus,
  SiteStatGroup,
  type Incoterm,
  type Unit,
} from '@altan/shared';

// --- Categories -------------------------------------------------------------

export interface CategoryFixture {
  slug: string;
  name: string;
  sortOrder: number;
}

export const categories: CategoryFixture[] = [
  { slug: 'metals-alloys', name: 'Metals & Alloys', sortOrder: 1 },
  { slug: 'carbide-tooling', name: 'Carbide Tooling', sortOrder: 2 },
  { slug: 'technical-ceramics', name: 'Technical Ceramics', sortOrder: 3 },
  { slug: 'instruments-equipment', name: 'Instruments & Equipment', sortOrder: 4 },
];

// --- Regions ----------------------------------------------------------------
// CA + EU now; the Region table is extensible to the advertised "4 supply regions"
// (admins add the rest via the admin taxonomy API).

/** RU/UZ override for a Region name. EN is the base `name`; only non-EN locales here. */
export interface RegionTranslationFixture {
  locale: LocaleCode; // RU | UZ
  name: string;
}

export interface RegionFixture {
  code: string;
  name: string; // EN base + fallback
  sortOrder: number;
  translations?: RegionTranslationFixture[];
}

export const regions: RegionFixture[] = [
  {
    code: 'ca',
    name: 'Central Asia',
    sortOrder: 1,
    translations: [
      { locale: LocaleCode.RU, name: 'Центральная Азия' },
      { locale: LocaleCode.UZ, name: 'Markaziy Osiyo' },
    ],
  },
  {
    code: 'eu',
    name: 'Europe',
    sortOrder: 2,
    translations: [
      { locale: LocaleCode.RU, name: 'Европа' },
      { locale: LocaleCode.UZ, name: 'Yevropa' },
    ],
  },
];

// --- Badges -----------------------------------------------------------------

export interface BadgeFixture {
  code: BadgeCode;
  label: string;
  emoji: string;
  color: string;
}

export const badges: BadgeFixture[] = [
  { code: BadgeCode.HOT, label: 'Hot', emoji: '🔥', color: '#E8543F' },
  { code: BadgeCode.NEW, label: 'NEW', emoji: '✨', color: '#2E7D5B' },
];

// --- Products ---------------------------------------------------------------

export interface SpecFixture {
  label: string;
  value: string;
  unit?: string;
}

export interface ProductTranslationFixture {
  locale: LocaleCode;
  name: string;
  shortDescription?: string;
  description?: string;
}

export interface ProductFixture {
  slug: string;
  name: string;
  categorySlug: string;
  regionCode: string;
  featured: boolean;
  status: ProductStatus;
  grade?: string;
  hsCode?: string;
  standard?: string;
  origin?: string;
  minOrderQty?: string; // Decimal as string
  minOrderUnit?: Unit;
  // Indicative pricing (optional — products without a price render "Price on request").
  priceAmount?: string; // Decimal as string
  priceCurrency?: Currency;
  priceUnit?: Unit; // canonical UNITS only (MT, kg, g, lb, mtu, pcs)
  priceBasis?: Incoterm;
  priceNote?: string;
  shortDescription?: string;
  description?: string;
  sortOrder: number;
  badges: BadgeCode[];
  specs: SpecFixture[];
  translations: ProductTranslationFixture[];
}

export const products: ProductFixture[] = [
  // ---- Featured (4) --------------------------------------------------------
  {
    slug: 'tungsten-metal',
    name: 'Tungsten Metal',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: true,
    status: ProductStatus.PUBLISHED,
    grade: 'W ≥ 96.3%',
    hsCode: '8101 99 9000',
    standard: 'OʻzMSt 227:2024',
    origin: 'Central Asia',
    minOrderQty: '1000',
    minOrderUnit: 'kg',
    priceAmount: '54.00',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'FCA',
    priceNote: 'FCA Tashkent, min 1 MT; indicative — firm offer via RFQ.',
    shortDescription: 'High-purity sintered tungsten briquette for downstream metallurgy.',
    description:
      'Sintered tungsten briquette (W ≥ 96.3%) produced to OʻzMSt 227:2024 and sourced from Central Asian mine-level supply. Supplied with certificate of analysis and certificate of origin; HS code 8101 99 9000 for customs.',
    sortOrder: 1,
    badges: [BadgeCode.HOT],
    specs: [
      { label: 'Grade', value: 'W ≥ 96.3%' },
      { label: 'Form', value: 'sintered briquette' },
      { label: 'Standard', value: 'OʻzMSt 227:2024' },
      { label: 'HS Code', value: '8101 99 9000' },
      { label: 'Origin', value: 'Central Asia' },
      { label: 'Minimum order', value: '1,000', unit: 'kg' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Tungsten Metal',
        shortDescription: 'High-purity sintered tungsten briquette for downstream metallurgy.',
        description:
          'Sintered tungsten briquette (W ≥ 96.3%) produced to OʻzMSt 227:2024 and sourced from Central Asian mine-level supply.',
      },
      {
        locale: LocaleCode.RU,
        name: 'Вольфрам металлический',
        shortDescription: 'Спечённый вольфрамовый брикет высокой чистоты для металлургии.',
        description:
          'Спечённый вольфрамовый брикет (W ≥ 96,3%) по стандарту OʻzMSt 227:2024, поставляемый из Центральной Азии.',
      },
      {
        locale: LocaleCode.UZ,
        name: 'Volfram metali',
        shortDescription: 'Metallurgiya uchun yuqori tozalikdagi presslangan volfram brniketi.',
        description:
          'OʻzMSt 227:2024 boʻyicha ishlab chiqarilgan presslangan volfram brniketi (W ≥ 96,3%), Markaziy Osiyodan yetkazib beriladi.',
      },
    ],
  },
  {
    slug: 'rhenium-metal',
    name: 'Rhenium Metal',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: true,
    status: ProductStatus.PUBLISHED,
    grade: 'Re ≥ 99.54%',
    hsCode: '8186 00 0000',
    origin: 'Central Asia',
    minOrderQty: '1',
    minOrderUnit: 'kg',
    priceAmount: '1850.00',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'FCA',
    priceNote: 'FCA Tashkent; CoA per lot.',
    shortDescription: 'Aerospace-grade rhenium in powder or granular form.',
    description:
      'High-purity rhenium (Re ≥ 99.54%) supplied as powder or granules for superalloy and catalyst applications. HS code 8186 00 0000.',
    sortOrder: 2,
    badges: [BadgeCode.NEW],
    specs: [
      { label: 'Grade', value: 'Re ≥ 99.54%' },
      { label: 'Form', value: 'powder / granules' },
      { label: 'HS Code', value: '8186 00 0000' },
      { label: 'Minimum order', value: '1', unit: 'kg' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Rhenium Metal',
        shortDescription: 'Aerospace-grade rhenium in powder or granular form.',
        description:
          'High-purity rhenium (Re ≥ 99.54%) supplied as powder or granules for superalloy and catalyst applications.',
      },
      {
        locale: LocaleCode.RU,
        name: 'Рений металлический',
        shortDescription: 'Рений авиационного качества в виде порошка или гранул.',
        description:
          'Рений высокой чистоты (Re ≥ 99,54%) в виде порошка или гранул для суперсплавов и катализаторов.',
      },
      {
        locale: LocaleCode.UZ,
        name: 'Reniy metali',
        shortDescription: 'Aviatsiya darajasidagi reniy — kukun yoki granula koʻrinishida.',
        description:
          'Yuqori tozalikdagi reniy (Re ≥ 99,54%) superqotishmalar va katalizatorlar uchun kukun yoki granula shaklida.',
      },
    ],
  },
  {
    slug: 'ferromolybdenum-femo-60-70',
    name: 'Ferromolybdenum FeMo 60/70',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: true,
    status: ProductStatus.PUBLISHED,
    grade: 'Mo 55–75%',
    hsCode: '7202 70 0000',
    origin: 'Central Asia',
    minOrderQty: '500',
    minOrderUnit: 'kg',
    priceAmount: '52.50',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'FCA',
    priceNote: 'Per kg Mo contained, FCA Tashkent.',
    shortDescription: 'Ferromolybdenum alloy for steelmaking, FeMo 60/70 grades.',
    description:
      'Ferromolybdenum (Mo 55–75%) in FeMo 60 and FeMo 70 grades for alloy and stainless steelmaking. HS code 7202 70 0000.',
    sortOrder: 3,
    badges: [],
    specs: [
      { label: 'Grade', value: 'Mo 55–75%' },
      { label: 'Form', value: 'lump' },
      { label: 'HS Code', value: '7202 70 0000' },
      { label: 'Minimum order', value: '500', unit: 'kg' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Ferromolybdenum FeMo 60/70',
        shortDescription: 'Ferromolybdenum alloy for steelmaking, FeMo 60/70 grades.',
        description:
          'Ferromolybdenum (Mo 55–75%) in FeMo 60 and FeMo 70 grades for alloy and stainless steelmaking.',
      },
      {
        locale: LocaleCode.RU,
        name: 'Ферромолибден FeMo 60/70',
        shortDescription: 'Ферромолибден для сталеплавильного производства, марки FeMo 60/70.',
        description:
          'Ферромолибден (Mo 55–75%) марок FeMo 60 и FeMo 70 для легированных и нержавеющих сталей.',
      },
      {
        locale: LocaleCode.UZ,
        name: 'Ferromolibden FeMo 60/70',
        shortDescription: 'Poʻlat ishlab chiqarish uchun ferromolibden, FeMo 60/70 markalari.',
        description:
          'Ferromolibden (Mo 55–75%) FeMo 60 va FeMo 70 markalarida legirlangan va zanglamaydigan poʻlat uchun.',
      },
    ],
  },
  {
    slug: 'brazed-carbide-inserts',
    name: 'Brazed Carbide Inserts',
    categorySlug: 'carbide-tooling',
    regionCode: 'eu',
    featured: true,
    status: ProductStatus.PUBLISHED,
    grade: 'WC-Co',
    hsCode: '8207 19 1000',
    standard: 'ISO P/M/K',
    shortDescription: 'Tungsten-carbide brazed inserts in ISO P/M/K application classes.',
    description:
      'Brazed tungsten-carbide (WC-Co) inserts covering ISO P, M and K machining classes. HS code 8207 19 1000.',
    sortOrder: 4,
    badges: [],
    specs: [
      { label: 'Grade', value: 'WC-Co' },
      { label: 'Standard', value: 'ISO P/M/K' },
      { label: 'HS Code', value: '8207 19 1000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Brazed Carbide Inserts',
        shortDescription: 'Tungsten-carbide brazed inserts in ISO P/M/K application classes.',
        description:
          'Brazed tungsten-carbide (WC-Co) inserts covering ISO P, M and K machining classes.',
      },
      {
        locale: LocaleCode.RU,
        name: 'Напаянные твердосплавные пластины',
        shortDescription: 'Твердосплавные напаянные пластины классов ISO P/M/K.',
        description:
          'Напаянные твердосплавные (WC-Co) пластины для обработки классов ISO P, M и K.',
      },
      {
        locale: LocaleCode.UZ,
        name: 'Kavsharlangan qattiq qotishma plastinalar',
        shortDescription: 'ISO P/M/K sinflaridagi volfram-karbidli kavsharlangan plastinalar.',
        description:
          'ISO P, M va K ishlov berish sinflari uchun kavsharlangan volfram-karbid (WC-Co) plastinalari.',
      },
    ],
  },

  // ---- Reasonable filler (non-featured, PUBLISHED) -------------------------
  // The following rows are plausible, brand-consistent catalog entries added to make the
  // catalog feel real and support the advertised "26+ product lines". They are NOT part of
  // the source brief — treat as reasonable filler an editor can refine/replace in admin.
  {
    slug: 'molybdenum-metal-powder',
    name: 'Molybdenum Metal Powder',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'Mo ≥ 99.95%',
    hsCode: '8102 10 0000',
    origin: 'Central Asia',
    minOrderQty: '25',
    minOrderUnit: 'kg',
    priceAmount: '68.00',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'FCA',
    shortDescription: 'High-purity molybdenum metal powder for sintering and coatings.',
    sortOrder: 5,
    badges: [],
    specs: [
      { label: 'Grade', value: 'Mo ≥ 99.95%' },
      { label: 'Form', value: 'powder' },
      { label: 'HS Code', value: '8102 10 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Molybdenum Metal Powder',
        shortDescription: 'High-purity molybdenum metal powder for sintering and coatings.',
      },
    ],
  },
  {
    slug: 'ammonium-paratungstate-apt',
    name: 'Ammonium Paratungstate (APT)',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'WO₃ ≥ 88.5%',
    hsCode: '2841 80 0000',
    origin: 'Central Asia',
    minOrderQty: '500',
    minOrderUnit: 'kg',
    priceAmount: '385.00',
    priceCurrency: Currency.USD,
    priceUnit: 'mtu',
    priceBasis: 'FCA',
    priceNote: 'Per mtu WO₃, FCA Tashkent.',
    shortDescription: 'APT — primary tungsten chemical intermediate for powder production.',
    sortOrder: 6,
    badges: [],
    specs: [
      { label: 'Grade', value: 'WO₃ ≥ 88.5%' },
      { label: 'Form', value: 'crystalline powder' },
      { label: 'HS Code', value: '2841 80 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Ammonium Paratungstate (APT)',
        shortDescription: 'APT — primary tungsten chemical intermediate for powder production.',
      },
    ],
  },
  {
    slug: 'tungsten-carbide-powder',
    name: 'Tungsten Carbide Powder',
    categorySlug: 'metals-alloys',
    regionCode: 'ca',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'WC, FSSS 0.8–6 µm',
    hsCode: '2849 90 3000',
    origin: 'Central Asia',
    minOrderQty: '50',
    minOrderUnit: 'kg',
    priceAmount: '82.00',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'FCA',
    shortDescription: 'Tungsten carbide powder across fine to coarse FSSS grades.',
    sortOrder: 7,
    badges: [],
    specs: [
      { label: 'Grade', value: 'WC' },
      { label: 'Particle size', value: '0.8–6', unit: 'µm FSSS' },
      { label: 'HS Code', value: '2849 90 3000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Tungsten Carbide Powder',
        shortDescription: 'Tungsten carbide powder across fine to coarse FSSS grades.',
      },
    ],
  },
  {
    slug: 'solid-carbide-end-mills',
    name: 'Solid Carbide End Mills',
    categorySlug: 'carbide-tooling',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'WC-Co, TiAlN coated',
    hsCode: '8207 70 3100',
    shortDescription: 'Coated solid-carbide end mills for general and high-feed machining.',
    sortOrder: 8,
    badges: [],
    specs: [
      { label: 'Grade', value: 'WC-Co' },
      { label: 'Coating', value: 'TiAlN' },
      { label: 'HS Code', value: '8207 70 3100' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Solid Carbide End Mills',
        shortDescription: 'Coated solid-carbide end mills for general and high-feed machining.',
      },
    ],
  },
  {
    slug: 'carbide-drawing-dies',
    name: 'Carbide Wire-Drawing Dies',
    categorySlug: 'carbide-tooling',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'WC-Co nibs',
    hsCode: '8207 20 1000',
    priceAmount: '14.50',
    priceCurrency: Currency.USD,
    priceUnit: 'pcs',
    priceBasis: 'EXW',
    priceNote: 'Standard nib sizes; custom profiles priced via RFQ.',
    shortDescription: 'Tungsten-carbide nib wire-drawing dies for ferrous and non-ferrous wire.',
    sortOrder: 9,
    badges: [],
    specs: [
      { label: 'Grade', value: 'WC-Co' },
      { label: 'HS Code', value: '8207 20 1000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Carbide Wire-Drawing Dies',
        shortDescription:
          'Tungsten-carbide nib wire-drawing dies for ferrous and non-ferrous wire.',
      },
    ],
  },
  {
    slug: 'alumina-ceramic-substrates',
    name: 'Alumina Ceramic Substrates',
    categorySlug: 'technical-ceramics',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'Al₂O₃ 96/99.5%',
    hsCode: '6909 19 0000',
    priceAmount: '19.80',
    priceCurrency: Currency.USD,
    priceUnit: 'kg',
    priceBasis: 'EXW',
    shortDescription: 'High-alumina ceramic substrates for electronics and wear parts.',
    sortOrder: 10,
    badges: [],
    specs: [
      { label: 'Grade', value: 'Al₂O₃ 96/99.5%' },
      { label: 'HS Code', value: '6909 19 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Alumina Ceramic Substrates',
        shortDescription: 'High-alumina ceramic substrates for electronics and wear parts.',
      },
    ],
  },
  {
    slug: 'zirconia-ceramic-components',
    name: 'Zirconia Ceramic Components',
    categorySlug: 'technical-ceramics',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    grade: 'YSZ (3Y / 8Y)',
    hsCode: '6909 19 0000',
    shortDescription: 'Yttria-stabilised zirconia components for high-wear applications.',
    sortOrder: 11,
    badges: [],
    specs: [
      { label: 'Grade', value: 'YSZ (3Y / 8Y)' },
      { label: 'HS Code', value: '6909 19 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Zirconia Ceramic Components',
        shortDescription: 'Yttria-stabilised zirconia components for high-wear applications.',
      },
    ],
  },
  {
    slug: 'xrf-assay-analyzer',
    name: 'Handheld XRF Assay Analyzer',
    categorySlug: 'instruments-equipment',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    hsCode: '9027 30 0000',
    priceAmount: '28500.00',
    priceCurrency: Currency.USD,
    priceUnit: 'pcs',
    priceBasis: 'DAP',
    priceNote: 'DAP major hubs; includes calibration certificate.',
    shortDescription: 'Portable XRF analyzer for on-site alloy and ore assay verification.',
    sortOrder: 12,
    badges: [],
    specs: [
      { label: 'Type', value: 'handheld XRF' },
      { label: 'HS Code', value: '9027 30 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Handheld XRF Assay Analyzer',
        shortDescription: 'Portable XRF analyzer for on-site alloy and ore assay verification.',
      },
    ],
  },
  {
    slug: 'lab-muffle-furnace',
    name: 'Laboratory Muffle Furnace',
    categorySlug: 'instruments-equipment',
    regionCode: 'eu',
    featured: false,
    status: ProductStatus.PUBLISHED,
    hsCode: '8514 30 0000',
    priceAmount: '6400.00',
    priceCurrency: Currency.USD,
    priceUnit: 'pcs',
    priceBasis: 'DAP',
    shortDescription: 'High-temperature muffle furnace for assay, ashing and sintering.',
    sortOrder: 13,
    badges: [],
    specs: [
      { label: 'Max temperature', value: '1600', unit: '°C' },
      { label: 'HS Code', value: '8514 30 0000' },
    ],
    translations: [
      {
        locale: LocaleCode.EN,
        name: 'Laboratory Muffle Furnace',
        shortDescription: 'High-temperature muffle furnace for assay, ashing and sintering.',
      },
    ],
  },
];

// --- News -------------------------------------------------------------------

export interface NewsTranslationFixture {
  locale: LocaleCode;
  title: string;
  summary?: string;
  body?: string;
}

export interface NewsFixture {
  slug: string;
  title: string;
  commodity: string;
  publishedAt: string; // ISO date
  priceLabel: string;
  changeLabel: string;
  changeDirection: ChangeDirection;
  outlook: Outlook;
  summary: string;
  body: string;
  status: ProductStatus;
  sortOrder: number;
  translations: NewsTranslationFixture[];
}

export const news: NewsFixture[] = [
  {
    slug: 'apt-prices-stabilise-china-export-controls',
    title: 'APT prices stabilise as Chinese export controls tighten global supply',
    commodity: 'Tungsten',
    publishedAt: '2025-06-12T08:00:00.000Z',
    priceLabel: '$292 APT/MTU',
    changeLabel: '+8.4% YTD',
    changeDirection: ChangeDirection.UP,
    outlook: Outlook.FIRM,
    summary:
      'Ammonium paratungstate prices have steadied near $292/MTU as tightening Chinese export controls keep global supply firm.',
    body: 'Ammonium paratungstate (APT) prices have stabilised at roughly $292 per metric tonne unit after a +8.4% move year to date, as China — the dominant tungsten producer — tightens export licensing on tungsten products. Buyers outside China are increasingly turning to alternative supply, and ALTAN continues to secure Central Asian feedstock to underpin firm offers into Q3.',
    status: ProductStatus.PUBLISHED,
    sortOrder: 1,
    translations: [
      {
        locale: LocaleCode.EN,
        title: 'APT prices stabilise as Chinese export controls tighten global supply',
        summary:
          'Ammonium paratungstate prices have steadied near $292/MTU as tightening Chinese export controls keep global supply firm.',
        body: 'Ammonium paratungstate (APT) prices have stabilised at roughly $292 per metric tonne unit after a +8.4% move year to date, as China tightens export licensing on tungsten products. ALTAN continues to secure Central Asian feedstock to underpin firm offers into Q3.',
      },
    ],
  },
  {
    slug: 'rhenium-market-tightens-aerospace-demand',
    title: 'Rhenium market tightens on aerospace demand; ALTAN secures Q3 volumes',
    commodity: 'Rhenium',
    publishedAt: '2025-05-20T08:00:00.000Z',
    priceLabel: '$1,340/kg',
    changeLabel: '+12.1% YTD',
    changeDirection: ChangeDirection.UP,
    outlook: Outlook.BULLISH,
    summary:
      'Rhenium has climbed to about $1,340/kg (+12.1% YTD) on strong aerospace superalloy demand; ALTAN has secured Q3 volumes.',
    body: 'Rhenium prices have risen to approximately $1,340 per kilogram, up 12.1% year to date, driven by robust demand from aerospace superalloy producers and constrained primary supply. ALTAN has secured Q3 rhenium volumes from Central Asian sources to support customers through the tightening market.',
    status: ProductStatus.PUBLISHED,
    sortOrder: 2,
    translations: [
      {
        locale: LocaleCode.EN,
        title: 'Rhenium market tightens on aerospace demand; ALTAN secures Q3 volumes',
        summary:
          'Rhenium has climbed to about $1,340/kg (+12.1% YTD) on strong aerospace superalloy demand; ALTAN has secured Q3 volumes.',
        body: 'Rhenium prices have risen to approximately $1,340 per kilogram, up 12.1% year to date, driven by aerospace superalloy demand and constrained supply. ALTAN has secured Q3 rhenium volumes from Central Asian sources.',
      },
    ],
  },
  {
    slug: 'ferromolybdenum-spreads-widen-europe-energy-costs',
    title: 'Ferromolybdenum spreads widen in Europe as energy costs rise',
    commodity: 'Ferromolybdenum',
    publishedAt: '2025-05-06T08:00:00.000Z',
    priceLabel: '$34.80/kg Mo',
    changeLabel: '−3.2% QoQ',
    changeDirection: ChangeDirection.DOWN,
    outlook: Outlook.MIXED,
    summary:
      'European ferromolybdenum spreads have widened as energy costs rise; the contained-Mo price eased to $34.80/kg (−3.2% QoQ).',
    body: 'Ferromolybdenum spreads in Europe have widened as elevated energy costs lift conversion economics, even as the underlying contained-molybdenum price eased to about $34.80 per kilogram, down 3.2% quarter on quarter. The outlook is mixed: soft spot demand offset by cost-push support. ALTAN sources FeMo from Central Asia to offer competitive landed pricing into Europe.',
    status: ProductStatus.PUBLISHED,
    sortOrder: 3,
    translations: [
      {
        locale: LocaleCode.EN,
        title: 'Ferromolybdenum spreads widen in Europe as energy costs rise',
        summary:
          'European ferromolybdenum spreads have widened as energy costs rise; the contained-Mo price eased to $34.80/kg (−3.2% QoQ).',
        body: 'Ferromolybdenum spreads in Europe have widened as elevated energy costs lift conversion economics, even as the contained-molybdenum price eased to about $34.80 per kilogram, down 3.2% quarter on quarter. ALTAN sources FeMo from Central Asia to offer competitive landed pricing.',
      },
    ],
  },
];

// --- Process steps ----------------------------------------------------------

/** RU/UZ override for a ProcessStep. EN is the base title/subtitle; only non-EN locales here. */
export interface ProcessStepTranslationFixture {
  locale: LocaleCode; // RU | UZ
  title: string;
  subtitle?: string;
}

export interface ProcessStepFixture {
  stepNo: number;
  key: string;
  title: string; // EN base + fallback
  subtitle: string; // EN base + fallback
  icon: string;
  sortOrder: number;
  translations?: ProcessStepTranslationFixture[];
}

export const processSteps: ProcessStepFixture[] = [
  {
    stepNo: 1,
    key: 'source',
    title: 'Mine-Level Procurement',
    subtitle: 'Source',
    icon: 'pickaxe',
    sortOrder: 1,
    translations: [
      { locale: LocaleCode.RU, title: 'Закупки на уровне рудника', subtitle: 'Источник' },
      { locale: LocaleCode.UZ, title: 'Kon darajasida xarid', subtitle: 'Manba' },
    ],
  },
  {
    stepNo: 2,
    key: 'qualify',
    title: 'Independent Lab Testing',
    subtitle: 'Qualify',
    icon: 'flask',
    sortOrder: 2,
    translations: [
      {
        locale: LocaleCode.RU,
        title: 'Независимое лабораторное тестирование',
        subtitle: 'Контроль',
      },
      { locale: LocaleCode.UZ, title: 'Mustaqil laboratoriya sinovi', subtitle: 'Nazorat' },
    ],
  },
  {
    stepNo: 3,
    key: 'ship',
    title: 'Multi-Modal Logistics',
    subtitle: 'Ship',
    icon: 'ship',
    sortOrder: 3,
    translations: [
      { locale: LocaleCode.RU, title: 'Мультимодальная логистика', subtitle: 'Доставка' },
      { locale: LocaleCode.UZ, title: 'Multimodal logistika', subtitle: "Jo'natish" },
    ],
  },
  {
    stepNo: 4,
    key: 'confirm',
    title: 'Post-Delivery Reporting',
    subtitle: 'Confirm',
    icon: 'check',
    sortOrder: 4,
    translations: [
      { locale: LocaleCode.RU, title: 'Отчётность после поставки', subtitle: 'Подтверждение' },
      { locale: LocaleCode.UZ, title: 'Yetkazishdan keyingi hisobot', subtitle: 'Tasdiqlash' },
    ],
  },
];

// --- Site stats -------------------------------------------------------------

/**
 * RU/UZ override for a SiteStat. EN is the base label/value; only non-EN locales here.
 * `value` is a display string that may localize ("12h" → "12ч" / "12 soat") or stay ("26+").
 */
export interface SiteStatTranslationFixture {
  locale: LocaleCode; // RU | UZ
  label: string;
  value: string;
}

export interface SiteStatFixture {
  key: string;
  label: string; // EN base + fallback
  value: string; // EN base + fallback
  group: SiteStatGroup;
  sortOrder: number;
  translations?: SiteStatTranslationFixture[];
}

export const siteStats: SiteStatFixture[] = [
  // HERO
  {
    key: 'hero.product_lines',
    label: 'product lines',
    value: '26+',
    group: SiteStatGroup.HERO,
    sortOrder: 1,
    translations: [
      { locale: LocaleCode.RU, label: 'продуктовых линеек', value: '26+' },
      { locale: LocaleCode.UZ, label: 'mahsulot liniyalari', value: '26+' },
    ],
  },
  {
    key: 'hero.supply_regions',
    label: 'supply regions',
    value: '4',
    group: SiteStatGroup.HERO,
    sortOrder: 2,
    translations: [
      { locale: LocaleCode.RU, label: 'регионов поставок', value: '4' },
      { locale: LocaleCode.UZ, label: 'yetkazib berish mintaqalari', value: '4' },
    ],
  },
  {
    key: 'hero.quote_reply',
    label: 'quote reply',
    value: '12h',
    group: SiteStatGroup.HERO,
    sortOrder: 3,
    translations: [
      { locale: LocaleCode.RU, label: 'ответ на запрос', value: '12ч' },
      { locale: LocaleCode.UZ, label: "so'rovga javob", value: '12 soat' },
    ],
  },
  {
    key: 'hero.incoterms',
    label: 'incoterms',
    value: 'all',
    group: SiteStatGroup.HERO,
    sortOrder: 4,
    translations: [
      { locale: LocaleCode.RU, label: 'инкотермс', value: 'все' },
      { locale: LocaleCode.UZ, label: 'inkoterms', value: 'barchasi' },
    ],
  },
  // PROCESS_BAR
  {
    key: 'process.audited_suppliers',
    label: 'Audited Suppliers',
    value: '40+',
    group: SiteStatGroup.PROCESS_BAR,
    sortOrder: 1,
    translations: [
      { locale: LocaleCode.RU, label: 'Проверенные поставщики', value: '40+' },
      { locale: LocaleCode.UZ, label: "Auditdan o'tgan yetkazib beruvchilar", value: '40+' },
    ],
  },
  {
    key: 'process.quote_sla',
    label: 'Quote',
    value: '<12h',
    group: SiteStatGroup.PROCESS_BAR,
    sortOrder: 2,
    translations: [
      { locale: LocaleCode.RU, label: 'Ответ', value: '<12ч' },
      { locale: LocaleCode.UZ, label: 'Kotirovka', value: '<12 soat' },
    ],
  },
  {
    key: 'process.countries',
    label: 'Countries',
    value: '30+',
    group: SiteStatGroup.PROCESS_BAR,
    sortOrder: 3,
    translations: [
      { locale: LocaleCode.RU, label: 'Стран', value: '30+' },
      { locale: LocaleCode.UZ, label: 'Davlatlar', value: '30+' },
    ],
  },
  {
    key: 'process.iso',
    label: 'Certified',
    value: 'ISO 9001',
    group: SiteStatGroup.PROCESS_BAR,
    sortOrder: 4,
    translations: [
      { locale: LocaleCode.RU, label: 'Сертификация', value: 'ISO 9001' },
      { locale: LocaleCode.UZ, label: 'Sertifikatlangan', value: 'ISO 9001' },
    ],
  },
];

// --- Site content (free-form JSON) ------------------------------------------

/** RU/UZ override for a SiteContent key. EN is the base `valueJson`; only non-EN locales here. */
export interface SiteContentTranslationFixture {
  locale: LocaleCode; // RU | UZ
  valueJson: unknown;
}

export interface SiteContentFixture {
  key: string;
  valueJson: unknown; // EN base + fallback
  translations?: SiteContentTranslationFixture[];
}

export const siteContent: SiteContentFixture[] = [
  // Brand constant — no translations; RU/UZ fall back to this EN base.
  // The brand wordmark carries the "Critical Raw Materials" sub-line.
  { key: 'companyName', valueJson: 'ALTAN' },
  {
    key: 'tagline',
    valueJson: 'Where Critical Materials Meet Markets.',
    translations: [
      { locale: LocaleCode.RU, valueJson: 'Где критически важные материалы встречают рынки.' },
      { locale: LocaleCode.UZ, valueJson: 'Muhim materiallar bozor bilan uchrashadigan joy.' },
    ],
  },
  {
    key: 'tag',
    valueJson: 'Global Hub for Critical Raw Materials',
    translations: [
      { locale: LocaleCode.RU, valueJson: 'Глобальный хаб критически важного сырья' },
      { locale: LocaleCode.UZ, valueJson: 'Muhim xom ashyo uchun global markaz' },
    ],
  },
  {
    key: 'trustBadges',
    valueJson: ['ISO 9001:2015', 'Independent assay', '12h quote response', 'Global delivery'],
    translations: [
      {
        locale: LocaleCode.RU,
        valueJson: [
          'ISO 9001:2015',
          'Независимый анализ',
          'Ответ на запрос за 12 ч',
          'Глобальная доставка',
        ],
      },
      {
        locale: LocaleCode.UZ,
        valueJson: [
          'ISO 9001:2015',
          'Mustaqil tahlil',
          '12 soatda javob',
          'Global yetkazib berish',
        ],
      },
    ],
  },
  {
    key: 'footer',
    valueJson: {
      companyName: 'ALTAN',
      tagline: 'Where Critical Materials Meet Markets.',
      email: 'sales@altan.info',
      phone: '+7 776 5300300',
      address: 'Almaty, Kazakhstan',
      copyright: '© 2026 ALTAN. All rights reserved.',
      columns: [
        {
          heading: 'Products',
          links: [
            { label: 'Metals & Alloys', href: '/catalog?category=metals-alloys' },
            { label: 'Carbide Tooling', href: '/catalog?category=carbide-tooling' },
            { label: 'Technical Ceramics', href: '/catalog?category=technical-ceramics' },
            { label: 'Instruments & Equipment', href: '/catalog?category=instruments-equipment' },
          ],
        },
        {
          heading: 'Company',
          links: [
            { label: 'About', href: '/about' },
            { label: 'Market News', href: '/news' },
            { label: 'Request a Quote', href: '/quote' },
            { label: 'Contact', href: '/contact' },
          ],
        },
        {
          heading: 'Compliance',
          links: [
            { label: 'Export Controls', href: '/compliance' },
            { label: 'Quality & Certificates', href: '/quality' },
            { label: 'Incoterms', href: '/incoterms' },
          ],
        },
      ],
    },
    translations: [
      {
        locale: LocaleCode.RU,
        valueJson: {
          companyName: 'ALTAN',
          tagline: 'Где критически важные материалы встречают рынки.',
          email: 'sales@altan.info',
          phone: '+7 776 5300300',
          address: 'Алматы, Казахстан',
          copyright: '© 2026 ALTAN. Все права защищены.',
          columns: [
            {
              heading: 'Продукция',
              links: [
                { label: 'Металлы и сплавы', href: '/catalog?category=metals-alloys' },
                { label: 'Твердосплавный инструмент', href: '/catalog?category=carbide-tooling' },
                { label: 'Техническая керамика', href: '/catalog?category=technical-ceramics' },
                {
                  label: 'Приборы и оборудование',
                  href: '/catalog?category=instruments-equipment',
                },
              ],
            },
            {
              heading: 'Компания',
              links: [
                { label: 'О компании', href: '/about' },
                { label: 'Новости рынка', href: '/news' },
                { label: 'Запросить предложение', href: '/quote' },
                { label: 'Контакты', href: '/contact' },
              ],
            },
            {
              heading: 'Комплаенс',
              links: [
                { label: 'Экспортный контроль', href: '/compliance' },
                { label: 'Качество и сертификаты', href: '/quality' },
                { label: 'Инкотермс', href: '/incoterms' },
              ],
            },
          ],
        },
      },
      {
        locale: LocaleCode.UZ,
        valueJson: {
          companyName: 'ALTAN',
          tagline: 'Muhim materiallar bozor bilan uchrashadigan joy.',
          email: 'sales@altan.info',
          phone: '+7 776 5300300',
          address: 'Almati, Qozogʻiston',
          copyright: '© 2026 ALTAN. Barcha huquqlar himoyalangan.',
          columns: [
            {
              heading: 'Mahsulotlar',
              links: [
                { label: 'Metallar va qotishmalar', href: '/catalog?category=metals-alloys' },
                { label: 'Qattiq qotishma asboblar', href: '/catalog?category=carbide-tooling' },
                { label: 'Texnik keramika', href: '/catalog?category=technical-ceramics' },
                { label: 'Asboblar va jihozlar', href: '/catalog?category=instruments-equipment' },
              ],
            },
            {
              heading: 'Kompaniya',
              links: [
                { label: 'Kompaniya haqida', href: '/about' },
                { label: 'Bozor yangiliklari', href: '/news' },
                { label: 'Taklif soʻrash', href: '/quote' },
                { label: 'Aloqa', href: '/contact' },
              ],
            },
            {
              heading: 'Muvofiqlik',
              links: [
                { label: 'Eksport nazorati', href: '/compliance' },
                { label: 'Sifat va sertifikatlar', href: '/quality' },
                { label: 'Inkoterms', href: '/incoterms' },
              ],
            },
          ],
        },
      },
    ],
  },
];

// --- UI i18n translations (namespace.key per locale) ------------------------

export interface TranslationFixture {
  namespace: string;
  key: string;
  en: string;
  ru: string;
  uz: string;
}

export const translations: TranslationFixture[] = [
  // Nav
  { namespace: 'nav', key: 'home', en: 'Home', ru: 'Главная', uz: 'Bosh sahifa' },
  { namespace: 'nav', key: 'catalog', en: 'Catalog', ru: 'Каталог', uz: 'Katalog' },
  {
    namespace: 'nav',
    key: 'news',
    en: 'Market News',
    ru: 'Новости рынка',
    uz: 'Bozor yangiliklari',
  },
  { namespace: 'nav', key: 'about', en: 'About', ru: 'О компании', uz: 'Kompaniya haqida' },
  { namespace: 'nav', key: 'contact', en: 'Contact', ru: 'Контакты', uz: 'Aloqa' },
  // Common CTAs
  {
    namespace: 'common',
    key: 'requestQuote',
    en: 'Request a quote',
    ru: 'Запросить предложение',
    uz: 'Taklif soʻrash',
  },
  {
    namespace: 'common',
    key: 'heroCta',
    en: 'Get a quote in 12h',
    ru: 'Получите предложение за 12 ч',
    uz: '12 soatda taklif oling',
  },
  {
    namespace: 'common',
    key: 'viewCatalog',
    en: 'View catalog',
    ru: 'Смотреть каталог',
    uz: 'Katalogni koʻrish',
  },
  { namespace: 'common', key: 'learnMore', en: 'Learn more', ru: 'Подробнее', uz: 'Batafsil' },
  {
    namespace: 'common',
    key: 'readMore',
    en: 'Read more',
    ru: 'Читать далее',
    uz: 'Davomini oʻqish',
  },
  // Section headings (homepage)
  {
    namespace: 'home',
    key: 'featuredHeading',
    en: 'Featured materials',
    ru: 'Избранные материалы',
    uz: 'Tanlangan materiallar',
  },
  {
    namespace: 'home',
    key: 'newsHeading',
    en: 'Market intelligence',
    ru: 'Аналитика рынка',
    uz: 'Bozor tahlili',
  },
  {
    namespace: 'home',
    key: 'statsHeading',
    en: 'ALTAN by the numbers',
    ru: 'ALTAN в цифрах',
    uz: 'ALTAN raqamlarda',
  },
  // Footer
  {
    namespace: 'footer',
    key: 'rights',
    en: 'All rights reserved.',
    ru: 'Все права защищены.',
    uz: 'Barcha huquqlar himoyalangan.',
  },
  { namespace: 'footer', key: 'products', en: 'Products', ru: 'Продукция', uz: 'Mahsulotlar' },
  { namespace: 'footer', key: 'company', en: 'Company', ru: 'Компания', uz: 'Kompaniya' },
  { namespace: 'footer', key: 'compliance', en: 'Compliance', ru: 'Комплаенс', uz: 'Muvofiqlik' },
  // Quote modal / form labels
  {
    namespace: 'quote',
    key: 'title',
    en: 'Request a quote',
    ru: 'Запрос предложения',
    uz: 'Taklif soʻrovi',
  },
  {
    namespace: 'quote',
    key: 'companyName',
    en: 'Company name',
    ru: 'Название компании',
    uz: 'Kompaniya nomi',
  },
  {
    namespace: 'quote',
    key: 'contactName',
    en: 'Contact name',
    ru: 'Контактное лицо',
    uz: 'Aloqa shaxsi',
  },
  { namespace: 'quote', key: 'email', en: 'Email', ru: 'Эл. почта', uz: 'Elektron pochta' },
  { namespace: 'quote', key: 'phone', en: 'Phone', ru: 'Телефон', uz: 'Telefon' },
  { namespace: 'quote', key: 'country', en: 'Country', ru: 'Страна', uz: 'Mamlakat' },
  { namespace: 'quote', key: 'incoterm', en: 'Incoterm', ru: 'Инкотермс', uz: 'Inkoterms' },
  {
    namespace: 'quote',
    key: 'destination',
    en: 'Destination',
    ru: 'Пункт назначения',
    uz: 'Yetkazib berish manzili',
  },
  { namespace: 'quote', key: 'material', en: 'Material', ru: 'Материал', uz: 'Material' },
  { namespace: 'quote', key: 'quantity', en: 'Quantity', ru: 'Количество', uz: 'Miqdor' },
  { namespace: 'quote', key: 'unit', en: 'Unit', ru: 'Единица', uz: 'Birlik' },
  { namespace: 'quote', key: 'message', en: 'Message', ru: 'Сообщение', uz: 'Xabar' },
  {
    namespace: 'quote',
    key: 'submit',
    en: 'Submit request',
    ru: 'Отправить запрос',
    uz: 'Soʻrov yuborish',
  },
  {
    namespace: 'quote',
    key: 'success',
    en: 'Thank you — our team will reply within 12 hours.',
    ru: 'Спасибо — мы ответим в течение 12 часов.',
    uz: 'Rahmat — jamoamiz 12 soat ichida javob beradi.',
  },
];
