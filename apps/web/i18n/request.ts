import { getRequestConfig } from 'next-intl/server';
import { routing, type AppLocale } from './routing';
import { getMessages } from './messages';

/**
 * Per-request i18n config consumed by the next-intl plugin. Loads the message
 * catalog (static fallback + backend overlay) for the negotiated locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale =
    requested && routing.locales.includes(requested as AppLocale)
      ? (requested as AppLocale)
      : routing.defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
