import { Tabs } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { SiteContentTab } from './SiteContentTab';
import { ProcessStepsTab } from './ProcessStepsTab';
import { SiteStatsTab } from './SiteStatsTab';
import { RevalidateButton } from './RevalidateButton';

export function ContentPage() {
  return (
    <>
      <PageHeader
        title="Site content"
        subtitle="Copy, process steps and stats shown on the public site"
        extra={<RevalidateButton />}
      />
      <Tabs
        items={[
          { key: 'content', label: 'Site content', children: <SiteContentTab /> },
          { key: 'steps', label: 'Process steps', children: <ProcessStepsTab /> },
          { key: 'stats', label: 'Site stats', children: <SiteStatsTab /> },
        ]}
      />
    </>
  );
}
