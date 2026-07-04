import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/**
 * Section header: a ledger eyebrow (with a brass tick rule), a serif title, an
 * optional lede and trailing action. `tone` flips it for dark surfaces.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  trailing,
  tone = 'light',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  trailing?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  const titleColor = tone === 'dark' ? 'text-white' : 'text-ink';
  const ledeColor = tone === 'dark' ? 'text-steel-300' : 'text-steel-600';

  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <Reveal className="max-w-2xl">
        {eyebrow && (
          <p className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-amber" aria-hidden />
            <span className={tone === 'dark' ? 'eyebrow-light' : 'eyebrow'}>{eyebrow}</span>
          </p>
        )}
        <h2 className={`mt-4 font-display text-3xl font-medium sm:text-[2.5rem] ${titleColor}`}>
          {title}
        </h2>
        {lede && (
          <p className={`mt-4 max-w-prose text-[17px] leading-relaxed ${ledeColor}`}>{lede}</p>
        )}
      </Reveal>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
