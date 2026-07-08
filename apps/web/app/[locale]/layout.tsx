import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getMessages } from '@/i18n/messages';
import { routing, type AppLocale } from '@/i18n/routing';
import { fontVariables } from '@/lib/fonts';
import { SITE_URL } from '@/lib/env';
import { fetchSiteContent } from '@/lib/api/content';
import { fetchCategories } from '@/lib/api/catalog';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CTABand } from '@/components/CTABand';
import { QuoteModal } from '@/features/quote/QuoteModal';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const content = await fetchSiteContent(locale);
  const t = await getTranslations({ locale, namespace: 'footer' });
  const name = content?.companyName ?? 'ALTAN Trading House';
  // CMS content is localized by the backend (?locale). Prefer the admin-authored
  // tagline for every locale; fall back to the bundled message when it's empty.
  const tagline = content?.tagline || t('tagline');

  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}`]));

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} — ${tagline}`,
      template: `%s · ${name}`,
    },
    description:
      (content?.tag as string | undefined) ??
      'Global hub for critical raw materials, sourced from Central Asia and delivered worldwide.',
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: name,
      title: `${name} — ${tagline}`,
      locale,
      url: `${SITE_URL}/${locale}`,
    },
    twitter: { card: 'summary_large_image', title: name },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);

  const [messages, content, categories] = await Promise.all([
    getMessages(locale as AppLocale),
    fetchSiteContent(locale),
    fetchCategories(),
  ]);
  const companyName = content?.companyName ?? 'ALTAN Trading House';

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        {/* Enable scroll-reveal only when JS runs; set pre-paint to avoid a flash
            and to keep content visible for no-JS / crawlers / print. The load
            failsafe force-reveals anything the IntersectionObserver hasn't (e.g.
            JS-but-no-scroll renderers, crawlers, anchor-jumps) so no section is
            ever left blank. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js-reveal');" +
              "addEventListener('load',function(){setTimeout(function(){" +
              "document.querySelectorAll('[data-reveal]:not([data-revealed])')" +
              ".forEach(function(el){el.setAttribute('data-revealed','true')})},1200)})",
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale as AppLocale}>
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <Header companyName={companyName} categories={categories ?? []} />
            <main id="main">{children}</main>
            <CTABand />
            <Footer companyName={companyName} footer={content?.footer} />
            <QuoteModal />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
