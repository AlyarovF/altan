'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { ChevronDown, ArrowRight } from 'lucide-react';
import type { Category } from '@altan/shared';
import { Link, usePathname } from '@/i18n/routing';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandMark } from './BrandMark';
import { useQuoteModal } from '@/features/quote/QuoteModalContext';

/** Flat nav links (Materials is a dropdown, handled separately). */
const NAV = [
  { href: '/capabilities', key: 'capabilities' },
  { href: '/quality', key: 'quality' },
  { href: '/news', key: 'news' },
  { href: '/about', key: 'about' },
] as const;

export function Header({
  companyName,
  categories = [],
}: {
  companyName: string;
  categories?: Category[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { openQuote } = useQuoteModal();

  // RU/UZ nav labels are much longer than EN and overflow the fixed 1220px shell
  // on desktop. For these locales we (a) collapse the inline nav to the drawer at
  // a wider breakpoint (2xl) and (b) tighten spacing + use a shorter CTA so the
  // row still fits when it is shown. EN keeps the roomier xl layout.
  const wideLocale = locale === 'ru' || locale === 'uz';
  const navShow = wideLocale
    ? 'hidden items-center gap-0.5 2xl:flex'
    : 'hidden items-center gap-0.5 xl:flex';
  const langShow = wideLocale ? 'hidden 2xl:block' : 'hidden xl:block';
  const contactShow = wideLocale
    ? 'hidden text-sm font-medium text-steel-300 hover:text-white 2xl:inline-flex 2xl:px-2.5 2xl:py-2'
    : 'hidden text-sm font-medium text-steel-300 hover:text-white xl:inline-flex xl:px-3 xl:py-2';
  const burgerHide = wideLocale ? '2xl:hidden' : 'xl:hidden';
  const navPad = wideLocale ? 'px-2.5' : 'px-3';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const materialsRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Close the Materials panel on Escape or outside interaction.
  useEffect(() => {
    if (!materialsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMaterialsOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [materialsOpen]);

  const openMaterials = () => {
    clearTimeout(closeTimer.current);
    setMaterialsOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMaterialsOpen(false), 120);
  };

  const linkCls = (href: string) =>
    `whitespace-nowrap rounded-md ${navPad} py-2 text-sm font-medium transition-colors ${
      isActive(href) ? 'text-white' : 'text-steel-300 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/90 backdrop-blur supports-[backdrop-filter]:bg-ink-900/75">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={companyName}>
          <BrandMark size={32} />
          <span className="whitespace-nowrap font-display text-[17px] font-medium tracking-tight text-white">
            {companyName}
          </span>
        </Link>

        <nav className={`${navShow} whitespace-nowrap`} aria-label="Primary">
          {/* Materials dropdown */}
          <div
            ref={materialsRef}
            className="relative"
            onMouseEnter={openMaterials}
            onMouseLeave={scheduleClose}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setMaterialsOpen(false);
            }}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md ${navPad} py-2 text-sm font-medium transition-colors ${
                isActive('/catalog') ? 'text-white' : 'text-steel-300 hover:text-white'
              }`}
              aria-expanded={materialsOpen}
              aria-haspopup="true"
              onClick={() => setMaterialsOpen((v) => !v)}
              onFocus={openMaterials}
            >
              {t('nav.materials')}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${materialsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {materialsOpen && (
              <div
                className="absolute left-0 top-full pt-2"
                onMouseEnter={openMaterials}
                onMouseLeave={scheduleClose}
              >
                <div className="w-[420px] overflow-hidden rounded-card border border-steel-200 bg-white p-2 shadow-lift">
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/catalog?category=${cat.slug}`}
                        className="rounded-md px-3 py-2.5 transition-colors hover:bg-steel-50"
                        onClick={() => setMaterialsOpen(false)}
                      >
                        <span className="block text-sm font-medium text-ink">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/catalog"
                    className="mt-1 flex items-center justify-between rounded-md bg-ink px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-700"
                    onClick={() => setMaterialsOpen(false)}
                  >
                    {t('catalog.title')}
                    <ArrowRight className="h-4 w-4 text-amber-bright" aria-hidden />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {NAV.map((item) => (
            <Link key={item.key} href={item.href} className={linkCls(item.href)}>
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className={langShow}>
            <LanguageSwitcher />
          </div>
          <Link href="/contact" className={contactShow}>
            {t('nav.contact')}
          </Link>
          {/* antd `.ant-btn { display }` beats Tailwind `.hidden`, so the responsive
              visibility lives on a wrapper span, not on the Button itself. */}
          <span className="hidden md:inline-flex">
            <Button type="primary" onClick={() => openQuote()}>
              {wideLocale ? t('common.requestQuoteShort') : t('common.requestQuote')}
            </Button>
          </span>
          <button
            type="button"
            className={`grid h-11 w-11 place-items-center rounded-md text-steel-200 hover:text-white ${burgerHide}`}
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuOutlined />
          </button>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={300}
        closeIcon={<span className="text-white">✕</span>}
        title={<span className="text-white">{companyName}</span>}
        styles={{
          body: { background: '#0C0F14' },
          header: { background: '#0C0F14', borderColor: 'rgba(255,255,255,0.1)' },
        }}
      >
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          <Link
            href="/catalog"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md px-3 py-2.5 text-base font-medium text-white hover:bg-white/5"
          >
            {t('nav.materials')}
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-steel-200 hover:bg-white/5 hover:text-white"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md px-3 py-2.5 text-base font-medium text-steel-200 hover:bg-white/5 hover:text-white"
          >
            {t('nav.contact')}
          </Link>
          <div className="mt-4 border-t border-white/10 pt-4">
            <LanguageSwitcher />
          </div>
          <Button
            type="primary"
            block
            size="large"
            className="mt-4"
            onClick={() => {
              setDrawerOpen(false);
              openQuote();
            }}
          >
            {t('common.requestQuote')}
          </Button>
        </nav>
      </Drawer>
    </header>
  );
}
