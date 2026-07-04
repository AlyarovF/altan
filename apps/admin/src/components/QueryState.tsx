import type { ReactNode } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { normalizeError } from '@/lib/api/client';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Renders loading / error / empty states explicitly so no async path is a silent
 * spinner. Wrap any data region with this to keep features terse.
 */
export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  onRetry,
  children,
}: QueryStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spin tip={t('common.loading')} />
      </div>
    );
  }
  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message={t('common.errorTitle')}
        description={normalizeError(error).message}
        action={
          onRetry ? (
            <Button size="small" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : undefined
        }
      />
    );
  }
  if (isEmpty) {
    return <Empty description={t('common.empty')} className="py-12" />;
  }
  return <>{children}</>;
}
