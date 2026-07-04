import { apiClient } from '@/lib/api/client';
import type {
  ImportTranslationsResult,
  MissingTranslations,
  Translation,
  UpsertTranslationInput,
} from '@/lib/types';

/** Nested export shape: { en: { "ns.key": value }, ru: {...}, uz: {...} }. */
export type TranslationsExport = Record<'en' | 'ru' | 'uz', Record<string, string>>;

export const translationsApi = {
  listByNamespace: (namespace: string) =>
    apiClient
      .get<Translation[]>('/admin/translations', { params: { namespace } })
      .then((r) => r.data),
  upsert: (body: UpsertTranslationInput) =>
    apiClient.put<Translation>('/admin/translations', body).then((r) => r.data),
  missing: () =>
    apiClient.get<MissingTranslations>('/admin/translations/missing').then((r) => r.data),
  export: () => apiClient.get<TranslationsExport>('/admin/translations/export').then((r) => r.data),
  import: (data: unknown) =>
    apiClient
      .post<ImportTranslationsResult>('/admin/translations/import', { data })
      .then((r) => r.data),
};
