import { Outlet } from 'react-router-dom';
import { Result } from 'antd';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/components/Can';
import type { Permission } from '@/lib/rbac';

/** Route-level RBAC gate. Renders a 403 result if the user lacks `permission`. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const { t } = useTranslation();
  const allowed = usePermission(permission);
  if (!allowed) {
    return <Result status="403" title="403" subTitle={t('common.forbidden')} />;
  }
  return <Outlet />;
}
