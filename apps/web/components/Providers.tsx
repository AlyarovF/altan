'use client';

import { useState, type ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { QueryClientProvider } from '@tanstack/react-query';
import { antdTheme } from '@/lib/theme';
import { getQueryClient } from '@/lib/query';
import { QuoteModalProvider } from '@/features/quote/QuoteModalContext';
import type { AppLocale } from '@/i18n/routing';

const antdLocales: Record<AppLocale, typeof enUS> = {
  en: enUS,
  ru: ruRU,
  // antd has no UZ pack; English controls + our own copy is the pragmatic choice.
  uz: enUS,
};

/**
 * Client-side provider stack: AntD SSR style registry + themed ConfigProvider,
 * TanStack Query (browser-singleton client), AntD `App` (message/notify context),
 * and the global quote-modal provider.
 */
export function Providers({ children, locale }: { children: ReactNode; locale: AppLocale }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={antdLocales[locale]}>
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <QuoteModalProvider>{children}</QuoteModalProvider>
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
