import { apiClient } from '@/lib/api/client';
import type {
  AdminProduct,
  AdminProductDetail,
  CreateProductInput,
  MediaAsset,
  Paginated,
  UpdateProductInput,
} from '@/lib/types';

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  region?: string;
  featured?: string;
  badge?: string;
  q?: string;
  sort?: string;
  status?: string;
}

export const productsApi = {
  list: (params: ProductListParams) =>
    apiClient.get<Paginated<AdminProduct>>('/admin/products', { params }).then((r) => r.data),

  /**
   * Full editable record for edit prefill — carries category/region IDs, specs,
   * badge codes, `imageUrl`, and per-locale (EN/RU/UZ) translations.
   */
  getById: (id: string) =>
    apiClient.get<AdminProductDetail>(`/admin/products/${id}`).then((r) => r.data),

  create: (body: CreateProductInput) =>
    apiClient.post<AdminProduct>('/admin/products', body).then((r) => r.data),

  update: (id: string, body: UpdateProductInput) =>
    apiClient.patch<AdminProduct>(`/admin/products/${id}`, body).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/admin/products/${id}`).then((r) => r.data),

  /**
   * Upload an image to `POST /admin/media` (multipart). Auth header is attached by
   * the axios interceptor; we set `multipart/form-data` so the default JSON
   * content-type doesn't cause the FormData to be JSON-serialized (the browser
   * fills in the boundary). Returns the created asset incl. its public `url`.
   */
  uploadMedia: (file: File, alt?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    return apiClient
      .post<MediaAsset>('/admin/media', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
