'use client';

import { Button, type ButtonProps } from 'antd';
import { useQuoteModal, type QuotePrefillItem } from '@/features/quote/QuoteModalContext';

interface QuoteButtonProps extends Omit<ButtonProps, 'onClick'> {
  label: string;
  prefill?: QuotePrefillItem;
}

/** A button that opens the global quote modal, optionally prefilled with a product. */
export function QuoteButton({ label, prefill, ...buttonProps }: QuoteButtonProps) {
  const { openQuote } = useQuoteModal();
  return (
    <Button {...buttonProps} onClick={() => openQuote(prefill)}>
      {label}
    </Button>
  );
}
