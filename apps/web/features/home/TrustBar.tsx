import { ShieldCheck } from 'lucide-react';

/**
 * Credibility strip — certifications, incoterms and SLA promises from `/content`.
 * A quiet, dense band that hands the eye off from the dark hero to the page.
 */
export function TrustBar({ badges, label }: { badges: string[]; label: string }) {
  if (!badges?.length) return null;
  return (
    <div className="border-b border-steel-200 bg-white">
      <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:gap-8">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-ticker text-steel-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber" aria-hidden />
          {label}
        </span>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 md:gap-x-8">
          {badges.map((badge) => (
            <li key={badge} className="flex items-center gap-2 text-sm font-medium text-steel-700">
              <span className="h-1.5 w-1.5 rotate-45 bg-amber" aria-hidden />
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
