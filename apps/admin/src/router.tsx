import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequirePermission } from '@/features/auth/RequirePermission';

// Heavy feature screens are code-split so the initial bundle stays lean.
// The dashboard pulls in the @ant-design/plots chart engine, so it is lazy too —
// keeping that heavy dependency out of the first-paint bundle.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProductsPage = lazy(() =>
  import('@/features/products/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const TaxonomyPage = lazy(() =>
  import('@/features/taxonomy/TaxonomyPage').then((m) => ({ default: m.TaxonomyPage })),
);
const NewsPage = lazy(() =>
  import('@/features/news/NewsPage').then((m) => ({ default: m.NewsPage })),
);
const QuotesPage = lazy(() =>
  import('@/features/quotes/QuotesPage').then((m) => ({ default: m.QuotesPage })),
);
const ContentPage = lazy(() =>
  import('@/features/content/ContentPage').then((m) => ({ default: m.ContentPage })),
);
const TranslationsPage = lazy(() =>
  import('@/features/translations/TranslationsPage').then((m) => ({ default: m.TranslationsPage })),
);

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <Lazy>
                <DashboardPage />
              </Lazy>
            ),
          },
          {
            element: <RequirePermission permission="product.read" />,
            children: [
              {
                path: 'products',
                element: (
                  <Lazy>
                    <ProductsPage />
                  </Lazy>
                ),
              },
              {
                path: 'taxonomy',
                element: (
                  <Lazy>
                    <TaxonomyPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            element: <RequirePermission permission="news.read" />,
            children: [
              {
                path: 'news',
                element: (
                  <Lazy>
                    <NewsPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            element: <RequirePermission permission="quote.read" />,
            children: [
              {
                path: 'quotes',
                element: (
                  <Lazy>
                    <QuotesPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            element: <RequirePermission permission="content.read" />,
            children: [
              {
                path: 'content',
                element: (
                  <Lazy>
                    <ContentPage />
                  </Lazy>
                ),
              },
              {
                path: 'translations',
                element: (
                  <Lazy>
                    <TranslationsPage />
                  </Lazy>
                ),
              },
            ],
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
