import { apiClient } from '@/lib/api/client';
import type { AdminNews, CreateNewsInput, Paginated, UpdateNewsInput } from '@/lib/types';

export interface NewsListParams {
  page?: number;
  limit?: number;
  commodity?: string;
}

export const newsApi = {
  list: (params: NewsListParams) =>
    apiClient.get<Paginated<AdminNews>>('/admin/news', { params }).then((r) => r.data),
  create: (body: CreateNewsInput) =>
    apiClient.post<AdminNews>('/admin/news', body).then((r) => r.data),
  update: (id: string, body: UpdateNewsInput) =>
    apiClient.patch<AdminNews>(`/admin/news/${id}`, body).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/admin/news/${id}`).then((r) => r.data),
};
