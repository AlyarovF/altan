import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { LOCALES } from '@altan/shared';

/** Locale routing: `/en`, `/ru`, `/uz` — always prefixed for clean, indexable URLs. */
export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];

/** Locale-aware navigation primitives (Link, redirect, usePathname, useRouter). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
