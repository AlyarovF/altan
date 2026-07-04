import type { LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

/**
 * Presentational feature card used across the marketing pages. Optionally leads
 * with an icon tile or a monospaced index; wrapped in a scroll reveal so grids
 * animate in with a stagger.
 */
export function InfoCard({
  title,
  body,
  icon: Icon,
  index,
  delay = 0,
}: {
  title: string;
  body?: string;
  icon?: LucideIcon;
  index?: number;
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      className="tick flex h-full flex-col rounded-card border border-steel-200 bg-white p-6 shadow-card"
    >
      {Icon && (
        <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-ink text-amber-bright">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      {index != null && (
        <span className="mb-3 font-mono text-sm font-medium text-amber-deep">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      {body && <p className="mt-2 flex-1 text-sm leading-relaxed text-steel-600">{body}</p>}
    </Reveal>
  );
}
