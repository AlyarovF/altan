import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Don't retry auth/permission failures — they won't resolve by retrying.
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/** Centralized query keys for cache invalidation across features. */
export const qk = {
  me: ['auth', 'me'] as const,
  products: (params?: unknown) => ['products', params] as const,
  categories: ['categories'] as const,
  regions: ['regions'] as const,
  badges: ['badges'] as const,
  news: (params?: unknown) => ['news', params] as const,
  quotes: (params?: unknown) => ['quotes', params] as const,
  quote: (id: string) => ['quotes', 'detail', id] as const,
  content: ['content'] as const,
  contentKey: (key: string) => ['content', 'key', key] as const,
  processSteps: ['processSteps'] as const,
  stats: ['stats'] as const,
  translations: (namespace: string) => ['translations', namespace] as const,
  translationsMissing: ['translations', 'missing'] as const,
  dashboard: ['dashboard'] as const,
};
