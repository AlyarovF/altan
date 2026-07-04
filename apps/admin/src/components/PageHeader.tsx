import type { ReactNode } from 'react';
import { Typography } from 'antd';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}

export function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Typography.Title level={3} className="!mb-0 !text-ink">
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Text type="secondary" className="text-sm">
            {subtitle}
          </Typography.Text>
        ) : null}
      </div>
      {extra ? <div className="flex items-center gap-2">{extra}</div> : null}
    </div>
  );
}
