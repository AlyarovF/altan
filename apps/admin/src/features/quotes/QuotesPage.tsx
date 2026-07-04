import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, DatePicker, Input, Select, Space, Table, Tag, App as AntApp } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { QuoteStatus } from '@altan/shared';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { qk } from '@/lib/queryClient';
import { downloadCsv, formatDate, slaInfo } from '@/lib/format';
import { normalizeError } from '@/lib/api/client';
import { quoteStatusColor } from '@/lib/statusColors';
import { quotesApi, type QuoteListParams } from './api';
import { SlaTag } from './SlaTag';
import { QuoteDrawer } from './QuoteDrawer';
import type { AdminQuoteListItem } from '@/lib/types';

const { RangePicker } = DatePicker;

export function QuotesPage() {
  const { message } = AntApp.useApp();
  const [searchParams] = useSearchParams();
  const [params, setParams] = useState<QuoteListParams>({
    page: 1,
    limit: 20,
    overdue: searchParams.get('overdue') ?? undefined,
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const overdue = searchParams.get('overdue');
    if (overdue) setParams((p) => ({ ...p, overdue }));
  }, [searchParams]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: qk.quotes(params),
    queryFn: () => quotesApi.list(params),
    placeholderData: (prev) => prev,
    refetchInterval: 60_000,
  });

  const columns: ColumnsType<AdminQuoteListItem> = [
    {
      title: 'Ref',
      dataIndex: 'ref',
      render: (ref, r) => (
        <button
          className="cursor-pointer border-0 bg-transparent p-0 font-mono text-amber-deep"
          onClick={() => setSelected(r.id)}
        >
          {ref}
        </button>
      ),
    },
    { title: 'Company', dataIndex: 'companyName' },
    { title: 'Contact', dataIndex: 'contactName', responsive: ['lg'] },
    { title: 'Country', dataIndex: 'country', responsive: ['md'] },
    { title: 'Incoterm', dataIndex: 'incoterm', responsive: ['lg'], render: (i) => <Tag>{i}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => <Tag color={quoteStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'SLA',
      key: 'sla',
      // Pass only SLA fields — spreading the whole row would put its `ref` (quote reference)
      // onto React's reserved `ref` prop and throw a string-ref error (#290).
      render: (_, r) => (
        <SlaTag
          slaDueAt={r.slaDueAt}
          respondedAt={r.respondedAt}
          overdue={r.overdue}
          slaMet={r.slaMet}
        />
      ),
    },
    { title: 'Created', dataIndex: 'createdAt', responsive: ['xl'], render: (v) => formatDate(v) },
  ];

  async function exportCsv() {
    setExporting(true);
    try {
      // Export ALL rows matching the current filters (not just the current page).
      const all = await quotesApi.list({ ...params, page: 1, limit: 1000 });
      const rows = all.data.map((q) => ({
        ref: q.ref,
        company: q.companyName,
        contact: q.contactName,
        email: q.email,
        country: q.country,
        incoterm: q.incoterm,
        destination: q.destination,
        status: q.status,
        sla: slaInfo(q).label,
        overdue: q.overdue ? 'YES' : 'NO',
        respondedAt: q.respondedAt ?? '',
        slaMet: q.respondedAt ? (q.slaMet ? 'MET' : 'MISSED') : '',
        createdAt: q.createdAt,
      }));
      downloadCsv(`altan-quotes-${dayjs().format('YYYYMMDD-HHmm')}.csv`, rows);
      message.success(`Exported ${rows.length} rows`);
    } catch (e) {
      message.error(normalizeError(e).message);
    } finally {
      setExporting(false);
    }
  }

  function onChange(pag: TablePaginationConfig) {
    setParams((p) => ({ ...p, page: pag.current ?? 1, limit: pag.pageSize ?? 20 }));
  }

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle="RFQ triage against the 12h SLA"
        extra={
          <Space>
            <Button
              aria-label="Refresh quotes"
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            />
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportCsv}>
              Export CSV
            </Button>
          </Space>
        }
      />

      <Space wrap className="mb-3">
        <Input.Search
          allowClear
          placeholder="Search ref / company / email"
          style={{ width: 260 }}
          onSearch={(v) => setParams((p) => ({ ...p, page: 1, search: v || undefined }))}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 150 }}
          options={Object.values(QuoteStatus).map((s) => ({ value: s, label: s }))}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, status: v }))}
        />
        <Select
          allowClear
          placeholder="SLA"
          style={{ width: 150 }}
          value={params.overdue}
          options={[
            { value: 'true', label: 'Overdue only' },
            { value: 'false', label: 'Within SLA' },
          ]}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, overdue: v }))}
        />
        <RangePicker
          onChange={(range) =>
            setParams((p) => ({
              ...p,
              page: 1,
              from: range?.[0]?.startOf('day').toISOString(),
              to: range?.[1]?.endOf('day').toISOString(),
            }))
          }
        />
      </Space>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table<AdminQuoteListItem>
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={data?.data ?? []}
          onChange={onChange}
          onRow={(r) => ({ onClick: () => setSelected(r.id), className: 'cursor-pointer' })}
          rowClassName={(r) => (!r.respondedAt && r.overdue ? '!bg-signal-down/10' : '')}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: data?.meta.page,
            pageSize: data?.meta.limit,
            total: data?.meta.total,
            showTotal: (t) => `${t} quotes`,
          }}
        />
      </QueryState>

      <QuoteDrawer id={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </>
  );
}
