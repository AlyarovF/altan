'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** A material to prefill the quote form with (from a product card or detail page). */
export interface QuotePrefillItem {
  productId?: string;
  productName: string;
  unit?: string;
  minOrderQty?: string | null;
}

interface QuoteModalState {
  open: boolean;
  prefill?: QuotePrefillItem;
  openQuote: (prefill?: QuotePrefillItem) => void;
  closeQuote: () => void;
}

const QuoteModalContext = createContext<QuoteModalState | null>(null);

export function QuoteModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<QuotePrefillItem | undefined>(undefined);

  const value = useMemo<QuoteModalState>(
    () => ({
      open,
      prefill,
      openQuote: (next) => {
        setPrefill(next);
        setOpen(true);
      },
      closeQuote: () => setOpen(false),
    }),
    [open, prefill],
  );

  return <QuoteModalContext.Provider value={value}>{children}</QuoteModalContext.Provider>;
}

/** Hook any CTA can use to open the global quote modal (optionally prefilled). */
export function useQuoteModal(): QuoteModalState {
  const ctx = useContext(QuoteModalContext);
  if (!ctx) throw new Error('useQuoteModal must be used within <QuoteModalProvider>');
  return ctx;
}
