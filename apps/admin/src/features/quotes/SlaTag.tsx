import { Tag, Tooltip } from 'antd';
import { ClockCircleOutlined, WarningFilled, CheckCircleFilled } from '@ant-design/icons';
import { slaInfo, formatDate } from '@/lib/format';

interface QuoteSla {
  slaDueAt?: string | null;
  respondedAt?: string | null;
  overdue?: boolean;
  slaMet?: boolean;
}

/** SLA chip: overdue → red, due → amber, met → green, missed → red. */
export function SlaTag(props: QuoteSla) {
  const info = slaInfo(props);
  const map = {
    overdue: { color: 'error' as const, icon: <WarningFilled /> },
    due: { color: 'warning' as const, icon: <ClockCircleOutlined /> },
    met: { color: 'success' as const, icon: <CheckCircleFilled /> },
    none: { color: 'default' as const, icon: null },
  };
  const cfg =
    map[
      info.state === 'met'
        ? 'met'
        : info.state === 'overdue'
          ? 'overdue'
          : info.state === 'due'
            ? 'due'
            : 'none'
    ];
  return (
    <Tooltip title={info.dueAt ? `Due ${formatDate(info.dueAt)}` : undefined}>
      <Tag color={cfg.color} icon={cfg.icon ?? undefined} className="!m-0">
        {info.label}
      </Tag>
    </Tooltip>
  );
}
