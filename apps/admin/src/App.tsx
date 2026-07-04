import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import enUS from 'antd/locale/en_US';
import { antdTheme } from '@/lib/theme';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';
import '@/lib/i18n';

export function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={enUS}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
