/**
 * Material → element glyph.
 *
 * Products rarely ship with photography, and the CSP forbids stock imagery, so
 * the visual identity for a material is its own chemistry: a periodic-style tile
 * (symbol + atomic number). We derive that from the material's name or grade —
 * both of which, in this catalog, lead with the chemical symbol (e.g. grade
 * "W ≥ 96.3%", "Mo 55–75%", "WC-Co"). Everything degrades gracefully to initials.
 */

interface ElementInfo {
  symbol: string;
  number?: number;
  element: string;
}

/** Keyword (substring of a material name) → element. Longest/most specific first. */
const KEYWORDS: Array<[RegExp, ElementInfo]> = [
  [/ferromolyb|molybden/i, { symbol: 'Mo', number: 42, element: 'Molybdenum' }],
  [/tungsten|wolfram/i, { symbol: 'W', number: 74, element: 'Tungsten' }],
  [/rhenium/i, { symbol: 'Re', number: 75, element: 'Rhenium' }],
  [/carbide/i, { symbol: 'WC', element: 'Tungsten carbide' }],
  [/cobalt/i, { symbol: 'Co', number: 27, element: 'Cobalt' }],
  [/tantalum/i, { symbol: 'Ta', number: 73, element: 'Tantalum' }],
  [/niobium|columbium/i, { symbol: 'Nb', number: 41, element: 'Niobium' }],
  [/vanadium/i, { symbol: 'V', number: 23, element: 'Vanadium' }],
  [/titanium/i, { symbol: 'Ti', number: 22, element: 'Titanium' }],
  [/zirconium|zirconia/i, { symbol: 'Zr', number: 40, element: 'Zirconium' }],
  [/chromium|chrome/i, { symbol: 'Cr', number: 24, element: 'Chromium' }],
  [/manganese/i, { symbol: 'Mn', number: 25, element: 'Manganese' }],
  [/nickel/i, { symbol: 'Ni', number: 28, element: 'Nickel' }],
  [/lithium/i, { symbol: 'Li', number: 3, element: 'Lithium' }],
  [/beryllium/i, { symbol: 'Be', number: 4, element: 'Beryllium' }],
  [/gallium/i, { symbol: 'Ga', number: 31, element: 'Gallium' }],
  [/germanium/i, { symbol: 'Ge', number: 32, element: 'Germanium' }],
  [/indium/i, { symbol: 'In', number: 49, element: 'Indium' }],
  [/antimony/i, { symbol: 'Sb', number: 51, element: 'Antimony' }],
  [/bismuth/i, { symbol: 'Bi', number: 83, element: 'Bismuth' }],
  [/tellurium/i, { symbol: 'Te', number: 52, element: 'Tellurium' }],
  [/selenium/i, { symbol: 'Se', number: 34, element: 'Selenium' }],
  [/silicon|silica/i, { symbol: 'Si', number: 14, element: 'Silicon' }],
  [/alumina|aluminium|aluminum/i, { symbol: 'Al', number: 13, element: 'Aluminium' }],
  [/boron|boride/i, { symbol: 'B', number: 5, element: 'Boron' }],
  [/copper/i, { symbol: 'Cu', number: 29, element: 'Copper' }],
  [/neodymium|rare earth|rare-earth/i, { symbol: 'Nd', number: 60, element: 'Neodymium' }],
  [/platinum/i, { symbol: 'Pt', number: 78, element: 'Platinum' }],
  [/palladium/i, { symbol: 'Pd', number: 46, element: 'Palladium' }],
  [/rhodium/i, { symbol: 'Rh', number: 45, element: 'Rhodium' }],
];

/** Atomic numbers for the common leading grade symbols, for the tile caption. */
const SYMBOL_NUMBERS: Record<string, number> = {
  W: 74,
  Mo: 42,
  Re: 75,
  Co: 27,
  Ta: 73,
  Nb: 41,
  V: 23,
  Ti: 22,
  Zr: 40,
  Cr: 24,
  Mn: 25,
  Ni: 28,
  Li: 3,
  Be: 4,
  Ga: 31,
  Ge: 32,
  In: 49,
  Sb: 51,
  Bi: 83,
  Te: 52,
  Se: 34,
  Si: 14,
  Al: 13,
  B: 5,
  Cu: 29,
  Fe: 26,
};

export interface MaterialGlyph {
  /** 1–3 char tile symbol (chemical where known, else initials). */
  symbol: string;
  /** Atomic number caption, when the symbol is a single known element. */
  number?: number;
  /** Human-readable element/compound name, when known. */
  element?: string;
  /** Whether the glyph maps to a real element (vs. derived initials). */
  known: boolean;
}

function initials(name: string): string {
  const words = name
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0]!.slice(0, 2).replace(/^./, (c) => c.toUpperCase());
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/** Derive the element glyph for a material from its name and/or grade. */
export function materialGlyph(name: string, grade?: string | null): MaterialGlyph {
  for (const [re, info] of KEYWORDS) {
    if (re.test(name)) return { ...info, known: true };
  }
  // Grades typically lead with the symbol: "Mo 55–75%", "W ≥ 96.3%", "WC-Co".
  const lead = grade?.trim().match(/^([A-Z][a-zA-Z]?)/);
  if (lead) {
    const symbol = lead[1]!;
    return { symbol, number: SYMBOL_NUMBERS[symbol], known: symbol in SYMBOL_NUMBERS };
  }
  return { symbol: initials(name), known: false };
}

/** Extract a purity/assay percentage from a grade string, if present (e.g. "99.95%"). */
export function purityFromGrade(grade?: string | null): string | null {
  if (!grade) return null;
  const m = grade.match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? `${m[1]}%` : null;
}
