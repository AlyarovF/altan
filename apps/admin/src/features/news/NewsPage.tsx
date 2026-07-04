import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, Space, Table, Tag, Tooltip, App as AntApp } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeDirection, Outlook, ProductStatus } from '@altan/shared';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { formatDateShort } from '@/lib/format';
import { ROW_ACTION_HIT } from '@/lib/ui';
import { newsApi, type NewsListParams } from './api';
import { NewsFormDrawer } from './NewsFormDrawer';
import type { AdminNews } from '@/lib/types';

const OUTLOOK_COLOR: Record<string, string> = {
  [Outlook.FIRM]: 'green',
  [Outlook.BULLISH]: 'green',
  [Outlook.BEARISH]: 'red',
  [Outlook.MIXED]: 'gold',
};
const DIR_SIGN: Record<string, string> = {
  [ChangeDirection.UP]: '▲',
  [ChangeDirection.DOWN]: '▼',
  [ChangeDirection.FLAT]: '▬',
};

export function NewsPage() {
  const { message, modal } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('news.write');
  const [params, setParams] = useState<NewsListParams>({ page: 1, limit: 20 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNews | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: qk.news(params),
    queryFn: () => newsApi.list(params),
    placeholderData: (prev) => prev,
  });

  // Deep-link `?edit=<id>` from the dashboard opens the editor.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && data?.data) {
      const found = data.data.find((n) => n.id === editId);
      if (found) {
        setEditing(found);
        setDrawerOpen(true);
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, data, setSearchParams]);

  const del = useMutation({
    mutationFn: (id: string) => newsApi.remove(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const columns: ColumnsType<AdminNews> = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (_, r) => (
        <button
          className="cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-amber-deep"
          onClick={() => {
            setEditing(r);
            setDrawerOpen(true);
          }}
        >
          {r.title}
        </button>
      ),
    },
    { title: 'Commodity', dataIndex: 'commodity' },
    {
      title: 'Price',
      render: (_, r) => (
        <span>
          {(r.priceLabel as string) ?? '—'}{' '}
          {r.changeLabel ? (
            <span
              className={
                r.changeDirection === 'UP'
                  ? 'text-signal-up'
                  : r.changeDirection === 'DOWN'
                    ? 'text-signal-down'
                    : 'text-signal-flat'
              }
            >
              {DIR_SIGN[r.changeDirection]} {r.changeLabel as string}
            </span>
          ) : null}
        </span>
      ),
      responsive: ['md'],
    },
    {
      title: 'Outlook',
      dataIndex: 'outlook',
      render: (o: string) => <Tag color={OUTLOOK_COLOR[o]}>{o}</Tag>,
    },
    {
      title: 'Published',
      dataIndex: 'publishedAt',
      render: (v) => formatDateShort(v as string | null),
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={s === ProductStatus.PUBLISHED ? 'green' : 'default'}>{s}</Tag>
      ),
    },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              size="small"
              className={ROW_ACTION_HIT}
              aria-label={`Edit ${r.title}`}
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          {canWrite && (
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                className={ROW_ACTION_HIT}
                aria-label={`Delete ${r.title}`}
                icon={<DeleteOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: `Delete “${r.title}”?`,
                    okType: 'danger',
                    onOk: () => del.mutateAsync(r.id),
                  })
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  function onChange(pag: TablePaginationConfig) {
    setParams((p) => ({ ...p, page: pag.current ?? 1, limit: pag.pageSize ?? 20 }));
  }

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Market intelligence articles"
        extra={
          canWrite ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              New article
            </Button>
          ) : undefined
        }
      />
      <Space className="mb-3">
        <Input.Search
          allowClear
          placeholder="Filter by commodity"
          style={{ width: 240 }}
          onSearch={(v) => setParams((p) => ({ ...p, page: 1, commodity: v || undefined }))}
        />
      </Space>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table<AdminNews>
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={data?.data ?? []}
          onChange={onChange}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: data?.meta.page,
            pageSize: data?.meta.limit,
            total: data?.meta.total,
            showTotal: (t) => `${t} articles`,
          }}
        />
      </QueryState>
      <NewsFormDrawer open={drawerOpen} article={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
