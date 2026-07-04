import { apiClient } from '@/lib/api/client';
import { SiteStatGroup } from '@altan/shared';
import type {
  ContentItem,
  ContentKeyLocales,
  Locale,
  ProcessStep,
  SiteStat,
  UpsertProcessStepInput,
  UpsertSiteStatInput,
} from '@/lib/types';

/** `/admin/stats` returns stats grouped by where they render. */
export type GroupedStats = Record<SiteStatGroup, SiteStat[]>;

export const contentApi = {
  listContent: () => apiClient.get<ContentItem[]>('/admin/content').then((r) => r.data),
  /** All three locale values for a key: `{ key, values: { en, ru, uz } }` (ru/uz null when no override). */
  getContentLocales: (key: string) =>
    apiClient.get<ContentKeyLocales>(`/admin/content/${key}`).then((r) => r.data),
  /** Upsert a value for a locale. `en` writes the base + fallback; `ru`/`uz` write an override. */
  upsertContent: (key: string, valueJson: unknown, locale: Locale = 'en') =>
    apiClient.put<ContentItem>(`/admin/content/${key}`, { valueJson, locale }).then((r) => r.data),
  /** Delete a single RU/UZ override so the key falls back to the EN base again. */
  deleteContentOverride: (key: string, locale: Exclude<Locale, 'en'>) =>
    apiClient.delete(`/admin/content/${key}`, { params: { locale } }).then((r) => r.data),
  revalidate: () =>
    apiClient.post<{ version: number }>('/admin/content/revalidate').then((r) => r.data),

  listSteps: () => apiClient.get<ProcessStep[]>('/admin/process-steps').then((r) => r.data),
  upsertStep: (body: UpsertProcessStepInput) =>
    apiClient.put<ProcessStep>('/admin/process-steps', body).then((r) => r.data),
  deleteStep: (id: string) => apiClient.delete(`/admin/process-steps/${id}`).then((r) => r.data),

  listStats: () => apiClient.get<GroupedStats>('/admin/stats').then((r) => r.data),
  upsertStat: (body: UpsertSiteStatInput) =>
    apiClient.put<SiteStat>('/admin/stats', body).then((r) => r.data),
  deleteStat: (id: string) => apiClient.delete(`/admin/stats/${id}`).then((r) => r.data),
};
