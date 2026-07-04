import { materialGlyph } from '@/lib/materials';

type Tone = 'ink' | 'brass' | 'plate';
type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: string; sym: string; num: string; pad: string }> = {
  sm: { box: 'h-12 w-12', sym: 'text-lg', num: 'text-[9px]', pad: 'p-1.5' },
  md: { box: 'h-16 w-16', sym: 'text-2xl', num: 'text-[10px]', pad: 'p-2' },
  lg: { box: 'h-24 w-24', sym: 'text-4xl', num: 'text-xs', pad: 'p-2.5' },
};

/**
 * The element tile — a periodic-table cell rendered from a material's chemistry.
 * This is the brand's answer to "no product photography": every material is
 * shown as its own element (symbol + atomic number), in the monospaced ledger
 * voice. Purely decorative, so it is hidden from assistive tech.
 */
export function ElementTile({
  name,
  grade,
  tone = 'ink',
  size = 'md',
}: {
  name: string;
  grade?: string | null;
  tone?: Tone;
  size?: Size;
}) {
  const glyph = materialGlyph(name, grade);
  const s = SIZES[size];

  const tones: Record<Tone, string> = {
    ink: 'bg-ink-800 text-amber-bright ring-1 ring-inset ring-white/10',
    brass: 'bg-amber/10 text-amber-deep ring-1 ring-inset ring-amber/30',
    plate: 'bg-steel-900 text-amber-bright ring-1 ring-inset ring-white/10',
  };

  return (
    <span
      aria-hidden
      className={`relative grid ${s.box} shrink-0 place-items-center overflow-hidden rounded-lg ${s.pad} ${tones[tone]}`}
    >
      {/* Atomic number, top-left, like a periodic cell. */}
      <span className={`absolute left-1.5 top-1 font-mono ${s.num} font-medium opacity-70`}>
        {glyph.number ?? ''}
      </span>
      <span className={`font-mono font-semibold leading-none ${s.sym}`}>{glyph.symbol}</span>
    </span>
  );
}
