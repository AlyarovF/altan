import { getTranslations } from 'next-intl/server';
import { Button, Result } from 'antd';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <Result
        status="404"
        title={t('notFoundTitle')}
        subTitle={t('notFoundBody')}
        extra={
          <Link href="/">
            <Button type="primary">{t('backHome')}</Button>
          </Link>
        }
      />
    </div>
  );
}
