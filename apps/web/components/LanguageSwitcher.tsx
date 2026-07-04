'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dropdown, type MenuProps } from 'antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';
import { usePathname, useRouter, routing, type AppLocale } from '@/i18n/routing';

/** Locale switcher. Replaces the locale segment while preserving the current path. */
export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('lang');
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const items: MenuProps['items'] = routing.locales.map((code) => ({
    key: code,
    label: t(code),
  }));

  const onSelect: MenuProps['onClick'] = ({ key }) => {
    startTransition(() => {
      router.replace(pathname, { locale: key as AppLocale });
    });
  };

  return (
    <Dropdown
      menu={{ items, selectable: true, selectedKeys: [locale], onClick: onSelect }}
      trigger={['click']}
      disabled={isPending}
    >
      <button
        type="button"
        aria-label={t('label')}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-steel-200 transition-colors hover:text-white"
      >
        <GlobalOutlined />
        <span className="uppercase">{locale}</span>
        <DownOutlined className="text-[10px]" />
      </button>
    </Dropdown>
  );
}
