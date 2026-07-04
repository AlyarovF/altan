import { apiClient } from '@/lib/api/client';
import type {
  AdminQuoteDetail,
  AdminQuoteListItem,
  Paginated,
  RespondQuoteInput,
} from '@/lib/types';
import type { QuoteStatus } from '@altan/shared';

export interface QuoteListParams {
  page?: number;
  limit?: number;
  status?: string;
  overdue?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const quotesApi = {
  list: (params: QuoteListParams) =>
    apiClient
      .get<Paginated<AdminQuoteListItem>>('/admin/quote-requests', { params })
      .then((r) => r.data),
  detail: (id: string) =>
    apiClient.get<AdminQuoteDetail>(`/admin/quote-requests/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: QuoteStatus) =>
    apiClient
      .patch<AdminQuoteDetail>(`/admin/quote-requests/${id}/status`, { status })
      .then((r) => r.data),
  respond: (id: string, body: RespondQuoteInput) =>
    apiClient
      .post<AdminQuoteDetail>(`/admin/quote-requests/${id}/respond`, body)
      .then((r) => r.data),
};
