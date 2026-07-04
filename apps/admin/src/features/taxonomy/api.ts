import { apiClient } from '@/lib/api/client';
import type {
  Badge,
  Category,
  CreateCategoryInput,
  CreateRegionInput,
  Region,
  ReorderItem,
  UpdateCategoryInput,
  UpdateRegionInput,
  UpsertBadgeInput,
} from '@/lib/types';

export const taxonomyApi = {
  listCategories: () => apiClient.get<Category[]>('/admin/categories').then((r) => r.data),
  createCategory: (body: CreateCategoryInput) =>
    apiClient.post<Category>('/admin/categories', body).then((r) => r.data),
  updateCategory: (id: string, body: UpdateCategoryInput) =>
    apiClient.patch<Category>(`/admin/categories/${id}`, body).then((r) => r.data),
  deleteCategory: (id: string) => apiClient.delete(`/admin/categories/${id}`).then((r) => r.data),

  listRegions: () => apiClient.get<Region[]>('/admin/regions').then((r) => r.data),
  createRegion: (body: CreateRegionInput) =>
    apiClient.post<Region>('/admin/regions', body).then((r) => r.data),
  updateRegion: (id: string, body: UpdateRegionInput) =>
    apiClient.patch<Region>(`/admin/regions/${id}`, body).then((r) => r.data),
  deleteRegion: (id: string) => apiClient.delete(`/admin/regions/${id}`).then((r) => r.data),

  listBadges: () => apiClient.get<Badge[]>('/admin/badges').then((r) => r.data),
  upsertBadge: (code: string, body: UpsertBadgeInput) =>
    apiClient.post<Badge>(`/admin/badges/${code}`, body).then((r) => r.data),
  deleteBadge: (code: string) => apiClient.delete(`/admin/badges/${code}`).then((r) => r.data),

  reorderProducts: (items: ReorderItem[]) =>
    apiClient.patch('/admin/products/reorder', { items }).then((r) => r.data),
};
