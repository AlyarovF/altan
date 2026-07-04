import { apiClient } from '@/lib/api/client';
import type { AdminProduct, AdminQuoteListItem, AdminNews, Paginated } from '@/lib/types';

/**
 * The dashboard derives KPIs from existing list endpoints (there is no dedicated
 * dashboard endpoint in the contract). We pull a generous page of each and
 * aggregate client-side. Quotes are the operational focus (SLA), so we fetch a
 * larger page there.
 */
export async function fetchDashboardData() {
  const [quotes, products, news] = await Promise.all([
    apiClient
      .get<Paginated<AdminQuoteListItem>>('/admin/quote-requests', { params: { limit: 100 } })
      .then((r) => r.data),
    apiClient
      .get<Paginated<AdminProduct>>('/admin/products', { params: { limit: 100 } })
      .then((r) => r.data),
    apiClient
      .get<Paginated<AdminNews>>('/admin/news', { params: { limit: 5 } })
      .then((r) => r.data),
  ]);
  return { quotes, products, news };
}
