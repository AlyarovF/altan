import type { ReactNode } from 'react';
import './globals.css';

/**
 * Thin root layout. The real `<html>`/`<body>` with locale + providers lives in
 * `app/[locale]/layout.tsx` so next-intl can set the correct `lang`/`dir`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
