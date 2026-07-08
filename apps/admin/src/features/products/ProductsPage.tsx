import { useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  App as AntApp,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductStatus } from '@altan/shared';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { formatDateShort, formatPrice } from '@/lib/format';
import { ROW_ACTION_HIT } from '@/lib/ui';
import { useCategories, useRegions } from '@/features/taxonomy/hooks';
import { productsApi, type ProductListParams } from './api';
import { ProductFormDrawer } from './ProductFormDrawer';
import type { AdminProduct } from '@/lib/types';

export function ProductsPage() {
  const { message, modal } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('product.write');
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const [params, setParams] = useState<ProductListParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: qk.products(params),
    queryFn: () => productsApi.list(params),
    placeholderData: (prev) => prev,
  });

  const patch = useMutation({
    mutationFn: (p: { id: string; body: Partial<AdminProduct> }) =>
      productsApi.update(p.id, p.body as never),
    onSuccess: () => {
      message.success('Updated');
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditing(p);
    setDrawerOpen(true);
  }

  const columns: ColumnsType<AdminProduct> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        sorter: true,
        render: (_, r) => (
          <button
            className="cursor-pointer border-0 bg-transparent p-0 text-left font-medium text-amber-deep"
            onClick={() => openEdit(r)}
          >
            {r.name}
          </button>
        ),
      },
      { title: 'Category', dataIndex: ['category', 'name'], responsive: ['md'] },
      { title: 'Region', dataIndex: ['region', 'name'], responsive: ['lg'] },
      {
        title: 'Badges',
        dataIndex: 'badges',
        render: (b: string[]) => b.map((x) => <Tag key={x}>{x}</Tag>),
        responsive: ['lg'],
      },
      {
        title: 'Price',
        key: 'price',
        render: (_, r) =>
          r.priceAmount ? (
            <span className="font-mono">
              {formatPrice(r.priceAmount, r.priceCurrency, r.priceUnit)}
            </span>
          ) : (
            '—'
          ),
      },
      {
        title: 'Featured',
        dataIndex: 'featured',
        align: 'center',
        render: (f: boolean, r) => (
          <Switch
            size="small"
            checked={f}
            disabled={!canWrite || patch.isPending}
            onChange={(checked) => patch.mutate({ id: r.id, body: { featured: checked } })}
            checkedChildren={<StarFilled />}
          />
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        sorter: true,
        render: (s: ProductStatus) => (
          <Tag color={s === ProductStatus.PUBLISHED ? 'green' : 'default'}>{s}</Tag>
        ),
      },
      {
        title: 'Updated',
        dataIndex: 'updatedAt',
        sorter: true,
        responsive: ['xl'],
        render: (v: string) => formatDateShort(v),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_, r) => (
          <Space size="middle">
            <Tooltip title="Edit">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                icon={<EditOutlined />}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
            {canWrite && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    {
                      key: 'toggle',
                      label: r.status === ProductStatus.PUBLISHED ? 'Unpublish' : 'Publish',
                      onClick: () =>
                        patch.mutate({
                          id: r.id,
                          body: {
                            status:
                              r.status === ProductStatus.PUBLISHED
                                ? ProductStatus.DRAFT
                                : ProductStatus.PUBLISHED,
                          },
                        }),
                    },
                    {
                      key: 'feature',
                      label: r.featured ? 'Unfeature' : 'Feature',
                      onClick: () => patch.mutate({ id: r.id, body: { featured: !r.featured } }),
                    },
                    { type: 'divider' },
                    {
                      key: 'delete',
                      danger: true,
                      icon: <DeleteOutlined />,
                      label: 'Delete',
                      onClick: () =>
                        modal.confirm({
                          title: `Delete “${r.name}”?`,
                          okType: 'danger',
                          okText: 'Delete',
                          onOk: () => del.mutateAsync(r.id),
                        }),
                    },
                  ],
                }}
              >
                <Button
                  size="small"
                  className={ROW_ACTION_HIT}
                  aria-label={`More actions for ${r.name}`}
                  icon={<MoreOutlined />}
                />
              </Dropdown>
            )}
          </Space>
        ),
      },
    ],
    [canWrite, patch, del, modal],
  );

  function onTableChange(
    pag: TablePaginationConfig,
    _f: unknown,
    sorter: SorterResult<AdminProduct> | SorterResult<AdminProduct>[],
  ) {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const sort =
      s?.field && s.order
        ? `${String(s.field)}:${s.order === 'ascend' ? 'asc' : 'desc'}`
        : undefined;
    setParams((p) => ({ ...p, page: pag.current ?? 1, limit: pag.pageSize ?? 20, sort }));
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Catalog management"
        extra={
          canWrite ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New product
            </Button>
          ) : undefined
        }
      />

      <Space wrap className="mb-3">
        <Input.Search
          allowClear
          placeholder="Search name / slug"
          style={{ width: 240 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => setParams((p) => ({ ...p, page: 1, q: v || undefined }))}
        />
        <Select
          allowClear
          placeholder="Category"
          style={{ width: 180 }}
          options={(categories ?? []).map((c) => ({ value: c.slug, label: c.name }))}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, category: v }))}
        />
        <Select
          allowClear
          placeholder="Region"
          style={{ width: 160 }}
          options={(regions ?? []).map((r) => ({ value: r.code, label: r.name }))}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, region: v }))}
        />
        <Select
          allowClear
          placeholder="Featured"
          style={{ width: 130 }}
          options={[
            { value: 'true', label: 'Featured' },
            { value: 'false', label: 'Not featured' },
          ]}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, featured: v }))}
        />
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 140 }}
          options={[
            { value: ProductStatus.PUBLISHED, label: 'Published' },
            { value: ProductStatus.DRAFT, label: 'Draft' },
          ]}
          onChange={(v) => setParams((p) => ({ ...p, page: 1, status: v }))}
        />
      </Space>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table<AdminProduct>
          rowKey="id"
          size="middle"
          loading={isFetching}
          columns={columns}
          dataSource={data?.data ?? []}
          onChange={onTableChange}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: data?.meta.page,
            pageSize: data?.meta.limit,
            total: data?.meta.total,
            showSizeChanger: true,
            showTotal: (t) => `${t} products`,
          }}
        />
      </QueryState>

      <ProductFormDrawer open={drawerOpen} product={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
