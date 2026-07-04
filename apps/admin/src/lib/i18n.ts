import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Admin UI strings (i18next). These are operator-facing chrome labels, kept in
 * code (the public, content-managed strings live in the backend content/i18n API).
 * EN is the working language; RU/UZ stubs fall back to EN via the resource merge.
 */
const en = {
  app: { title: 'ALTAN Admin', signOut: 'Sign out', language: 'Language' },
  nav: {
    dashboard: 'Dashboard',
    products: 'Products',
    taxonomy: 'Taxonomy',
    news: 'News',
    quotes: 'Quotes',
    content: 'Site content',
    translations: 'Translations',
    toggleMenu: 'Toggle navigation menu',
  },
  common: {
    create: 'Create',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this?',
    search: 'Search',
    filters: 'Filters',
    reset: 'Reset',
    actions: 'Actions',
    status: 'Status',
    loading: 'Loading…',
    errorTitle: 'Something went wrong',
    retry: 'Retry',
    empty: 'No data',
    saved: 'Saved',
    deleted: 'Deleted',
    publish: 'Publish',
    unpublish: 'Unpublish',
    draft: 'Draft',
    published: 'Published',
    featured: 'Featured',
    yes: 'Yes',
    no: 'No',
    export: 'Export CSV',
    forbidden: 'You do not have permission to perform this action.',
  },
  login: {
    title: 'Sign in to ALTAN Admin',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    failed: 'Invalid email or password.',
  },
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: en },
    uz: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
