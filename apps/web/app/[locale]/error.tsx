'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Result } from 'antd';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('common');
  useEffect(() => {
    // Surface to monitoring in a real deployment.
  }, []);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <Result
        status="error"
        title={t('errorTitle')}
        subTitle={t('errorBody')}
        extra={
          <Button type="primary" onClick={reset}>
            {t('retry')}
          </Button>
        }
      />
    </div>
  );
}
