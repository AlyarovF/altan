import { useTranslations } from 'next-intl';
import { Pickaxe, FlaskConical, Ship, CheckCircle2, type LucideIcon } from 'lucide-react';
import type { ProcessStep, SiteStat } from '@altan/shared';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';

const ICONS: Record<string, LucideIcon> = {
  pickaxe: Pickaxe,
  flask: FlaskConical,
  ship: Ship,
  check: CheckCircle2,
};

/**
 * "How ALTAN works" — a genuine ordered chain (source → qualify → ship →
 * confirm), so the numbered markers encode real sequence. Steps sit on a shared
 * rail; titles come from the API, the short blurbs are localized copy keyed by
 * the step's stable key (falling back to nothing when unknown).
 */
export function ProcessSteps({ steps, stats }: { steps: ProcessStep[]; stats: SiteStat[] }) {
  const t = useTranslations('home');
  if (!steps.length) return null;

  return (
    <section className="border-y border-steel-200 bg-steel-50">
      <div className="shell py-20 lg:py-24">
        <SectionHeading title={t('processHeading')} lede={t('processSubheading')} />

        <ol className="relative grid list-none gap-x-6 gap-y-10 p-0 md:grid-cols-2 lg:grid-cols-4">
          {/* Shared rail behind the nodes (desktop). */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[15px] hidden h-px bg-steel-200 lg:block"
            aria-hidden
          />
          {steps.map((step) => {
            const Icon = (step.icon && ICONS[step.icon]) || CheckCircle2;
            const descKey = `processStep.${step.key}`;
            const hasDesc = t.has(descKey);
            return (
              <Reveal as="li" key={step.id} className="relative">
                <div className="flex items-center gap-3">
                  <span
                    className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-amber bg-steel-50"
                    aria-hidden
                  />
                  <span className="font-mono text-sm font-medium text-amber-deep">
                    {String(step.stepNo).padStart(2, '0')}
                  </span>
                </div>

                <span className="mt-6 grid h-12 w-12 place-items-center rounded-lg bg-ink text-amber-bright">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>

                {step.subtitle && (
                  <p className="mt-5 font-mono text-[11px] font-medium uppercase tracking-ticker text-amber-deep">
                    {step.subtitle}
                  </p>
                )}
                <h3 className="mt-1.5 font-display text-lg font-medium text-ink">{step.title}</h3>
                {hasDesc && (
                  <p className="mt-2 text-sm leading-relaxed text-steel-600">{t(descKey)}</p>
                )}
              </Reveal>
            );
          })}
        </ol>

        {stats.length > 0 && (
          <dl className="mt-14 grid grid-cols-2 overflow-hidden rounded-card border border-steel-200 bg-white shadow-card md:grid-cols-4 md:divide-x md:divide-steel-200">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="border-b border-steel-200 px-6 py-7 text-center last:border-b-0 md:border-b-0"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-mono text-3xl font-semibold text-ink">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block font-mono text-[11px] uppercase tracking-ticker text-steel-500">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
