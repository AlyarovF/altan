import { useState } from 'react';
import { Button, Form, Input, Modal, Space, Table, Tag, Tabs, Tooltip, App as AntApp } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { slugify } from '@/lib/format';
import { ROW_ACTION_HIT } from '@/lib/ui';
import { useBadges, useCategories, useRegions } from './hooks';
import { taxonomyApi } from './api';
import type { Badge, Category, Region } from '@/lib/types';

export function TaxonomyPage() {
  return (
    <>
      <PageHeader title="Taxonomy" subtitle="Categories, regions and badges" />
      <Tabs
        items={[
          { key: 'categories', label: 'Categories', children: <CategoriesTab /> },
          { key: 'regions', label: 'Regions', children: <RegionsTab /> },
          { key: 'badges', label: 'Badges', children: <BadgesTab /> },
        ]}
      />
    </>
  );
}

/** Shared move-up/down using sortOrder swaps via PATCH. */
function useReorder<T extends { id: string; sortOrder: number }>(
  rows: T[] | undefined,
  invalidateKey: readonly unknown[],
  patch: (id: string, sortOrder: number) => Promise<unknown>,
) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: async (dir: { id: string; up: boolean }) => {
      const sorted = [...(rows ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex((r) => r.id === dir.id);
      const swapIdx = dir.up ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
      const a = sorted[idx]!;
      const b = sorted[swapIdx]!;
      await Promise.all([patch(a.id, b.sortOrder), patch(b.id, a.sortOrder)]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidateKey }),
    onError: (e) => message.error(normalizeError(e).message),
  });
}

function CategoriesTab() {
  const qc = useQueryClient();
  const { message, modal } = AntApp.useApp();
  const canWrite = usePermission('taxonomy.write');
  const { data, isLoading, isError, error, refetch } = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const reorder = useReorder(data, qk.categories, (id, sortOrder) =>
    taxonomyApi.updateCategory(id, { sortOrder }),
  );

  const save = useMutation({
    mutationFn: (vals: { name: string; slug: string }) =>
      editing
        ? taxonomyApi.updateCategory(editing.id, vals)
        : taxonomyApi.createCategory({ ...vals, sortOrder: (data?.length ?? 0) + 1 }),
    onSuccess: () => {
      message.success('Saved');
      void qc.invalidateQueries({ queryKey: qk.categories });
      setOpen(false);
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => taxonomyApi.deleteCategory(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: qk.categories });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const sorted = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const columns: ColumnsType<Category> = [
    { title: 'Order', dataIndex: 'sortOrder', width: 70 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug', render: (s) => <code>{s}</code> },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r, i) =>
        canWrite ? (
          <Space size="middle">
            <Tooltip title="Move up">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Move ${r.name} up`}
                icon={<ArrowUpOutlined />}
                disabled={i === 0}
                onClick={() => reorder.mutate({ id: r.id, up: true })}
              />
            </Tooltip>
            <Tooltip title="Move down">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Move ${r.name} down`}
                icon={<ArrowDownOutlined />}
                disabled={i === sorted.length - 1}
                onClick={() => reorder.mutate({ id: r.id, up: false })}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Edit ${r.name}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(r);
                  form.setFieldsValue(r);
                  setOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                className={ROW_ACTION_HIT}
                aria-label={`Delete ${r.name}`}
                icon={<DeleteOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: `Delete ${r.name}?`,
                    okType: 'danger',
                    onOk: () => del.mutateAsync(r.id),
                  })
                }
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      {canWrite && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="mb-3"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          New category
        </Button>
      )}
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={sorted}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </QueryState>
      <Modal
        title={editing ? 'Edit category' : 'New category'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input
              onChange={(e) => !editing && form.setFieldValue('slug', slugify(e.target.value))}
            />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'lowercase-dashes only' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function RegionsTab() {
  const qc = useQueryClient();
  const { message, modal } = AntApp.useApp();
  const canWrite = usePermission('taxonomy.write');
  const { data, isLoading, isError, error, refetch } = useRegions();
  const [editing, setEditing] = useState<Region | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const reorder = useReorder(data, qk.regions, (id, sortOrder) =>
    taxonomyApi.updateRegion(id, { sortOrder }),
  );

  const save = useMutation({
    mutationFn: (vals: { name: string; code: string }) =>
      editing
        ? taxonomyApi.updateRegion(editing.id, vals)
        : taxonomyApi.createRegion({ ...vals, sortOrder: (data?.length ?? 0) + 1 }),
    onSuccess: () => {
      message.success('Saved');
      void qc.invalidateQueries({ queryKey: qk.regions });
      setOpen(false);
    },
    onError: (e) => message.error(normalizeError(e).message),
  });
  const del = useMutation({
    mutationFn: (id: string) => taxonomyApi.deleteRegion(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: qk.regions });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const sorted = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const columns: ColumnsType<Region> = [
    { title: 'Order', dataIndex: 'sortOrder', width: 70 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Code', dataIndex: 'code', render: (s) => <code>{s}</code> },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r, i) =>
        canWrite ? (
          <Space size="middle">
            <Tooltip title="Move up">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Move ${r.name} up`}
                icon={<ArrowUpOutlined />}
                disabled={i === 0}
                onClick={() => reorder.mutate({ id: r.id, up: true })}
              />
            </Tooltip>
            <Tooltip title="Move down">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Move ${r.name} down`}
                icon={<ArrowDownOutlined />}
                disabled={i === sorted.length - 1}
                onClick={() => reorder.mutate({ id: r.id, up: false })}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Edit ${r.name}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditing(r);
                  form.setFieldsValue(r);
                  setOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                className={ROW_ACTION_HIT}
                aria-label={`Delete ${r.name}`}
                icon={<DeleteOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: `Delete ${r.name}?`,
                    okType: 'danger',
                    onOk: () => del.mutateAsync(r.id),
                  })
                }
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      {canWrite && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="mb-3"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          New region
        </Button>
      )}
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={sorted}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </QueryState>
      <Modal
        title={editing ? 'Edit region' : 'New region'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Code" name="code" rules={[{ required: true }]}>
            <Input placeholder="ca" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function BadgesTab() {
  const qc = useQueryClient();
  const { message, modal } = AntApp.useApp();
  const canWrite = usePermission('taxonomy.write');
  const { data, isLoading, isError, error, refetch } = useBadges();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const save = useMutation({
    mutationFn: (vals: { code: string; label: string; emoji: string; color: string }) =>
      taxonomyApi.upsertBadge(vals.code, {
        label: vals.label,
        emoji: vals.emoji,
        color: vals.color,
      }),
    onSuccess: () => {
      message.success('Saved');
      void qc.invalidateQueries({ queryKey: qk.badges });
      setOpen(false);
    },
    onError: (e) => message.error(normalizeError(e).message),
  });
  const del = useMutation({
    mutationFn: (code: string) => taxonomyApi.deleteBadge(code),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: qk.badges });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const columns: ColumnsType<Badge> = [
    { title: 'Code', dataIndex: 'code', render: (c) => <code>{c}</code> },
    {
      title: 'Preview',
      render: (_, r) => (
        <Tag color={r.color}>
          {r.emoji} {r.label}
        </Tag>
      ),
    },
    { title: 'Color', dataIndex: 'color' },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) =>
        canWrite ? (
          <Space size="middle">
            <Tooltip title="Edit">
              <Button
                size="small"
                className={ROW_ACTION_HIT}
                aria-label={`Edit ${r.code}`}
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingCode(r.code);
                  form.setFieldsValue(r);
                  setOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                size="small"
                danger
                className={ROW_ACTION_HIT}
                aria-label={`Delete ${r.code}`}
                icon={<DeleteOutlined />}
                onClick={() =>
                  modal.confirm({
                    title: `Delete ${r.code}?`,
                    okType: 'danger',
                    onOk: () => del.mutateAsync(r.code),
                  })
                }
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      {canWrite && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="mb-3"
          onClick={() => {
            setEditingCode(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          New badge
        </Button>
      )}
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table
          rowKey="code"
          size="small"
          columns={columns}
          dataSource={data ?? []}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </QueryState>
      <Modal
        title={editingCode ? 'Edit badge' : 'New badge'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item
            label="Code"
            name="code"
            rules={[{ required: true, pattern: /^[A-Z0-9_]+$/, message: 'UPPER_SNAKE' }]}
          >
            <Input disabled={!!editingCode} placeholder="HOT" />
          </Form.Item>
          <Form.Item label="Emoji" name="emoji" rules={[{ required: true }]}>
            <Input placeholder="🔥" />
          </Form.Item>
          <Form.Item label="Label" name="label" rules={[{ required: true }]}>
            <Input placeholder="Hot" />
          </Form.Item>
          <Form.Item label="Color" name="color" rules={[{ required: true }]}>
            <Input placeholder="red / #E8543F" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
