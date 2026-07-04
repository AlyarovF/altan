'use client';

import { useTranslations } from 'next-intl';
import { Button } from 'antd';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useQuoteModal } from '@/features/quote/QuoteModalContext';
import { Reveal } from './Reveal';

/**
 * The site-wide conversion band. Sits at the foot of every marketing page so the
 * primary action (Request a quote) is always one screen away, with a secondary
 * route to the trade desk. Copy is i18n-driven (`cta` namespace).
 */
export function CTABand() {
  const t = useTranslations('cta');
  const tc = useTranslations('common');
  const { openQuote } = useQuoteModal();

  return (
    <section className="surface-dark relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-blueprint opacity-60"
        style={{ backgroundSize: '52px 52px' }}
        aria-hidden
      />
      <div className="shell relative flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow-light">{t('eyebrow')}</p>
          <h2 className="mt-4 font-display text-3xl font-medium text-white sm:text-[2.6rem]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-steel-300">{t('body')}</p>
        </Reveal>
        <Reveal delay={80} className="flex shrink-0 flex-wrap items-center gap-3">
          <Button type="primary" size="large" onClick={() => openQuote()}>
            {tc('requestQuote')}
          </Button>
          <Link href="/contact">
            <Button
              size="large"
              ghost
              className="!border-white/25 !text-white hover:!border-amber-bright hover:!text-amber-bright"
            >
              <span className="inline-flex items-center gap-1.5">
                {t('secondary')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
