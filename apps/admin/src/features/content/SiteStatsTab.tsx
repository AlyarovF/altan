import { useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  App as AntApp,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SiteStatGroup } from '@altan/shared';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { contentApi } from './api';
import type { SiteStat, UpsertSiteStatInput } from '@/lib/types';

export function SiteStatsTab() {
  const { message, modal } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('content.write');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.stats,
    queryFn: contentApi.listStats,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SiteStat | null>(null);
  const [form] = Form.useForm<UpsertSiteStatInput>();

  const save = useMutation({
    mutationFn: (body: UpsertSiteStatInput) => contentApi.upsertStat(body),
    onSuccess: () => {
      message.success('Saved');
      void qc.invalidateQueries({ queryKey: qk.stats });
      setOpen(false);
    },
    onError: (e) => message.error(normalizeError(e).message),
  });
  const del = useMutation({
    mutationFn: (id: string) => contentApi.deleteStat(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: qk.stats });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const rows: SiteStat[] = [
    ...(data?.[SiteStatGroup.HERO] ?? []),
    ...(data?.[SiteStatGroup.PROCESS_BAR] ?? []),
  ].sort((a, b) => a.group.localeCompare(b.group) || a.sortOrder - b.sortOrder);

  const columns: ColumnsType<SiteStat> = [
    {
      title: 'Group',
      dataIndex: 'group',
      render: (g) => <Tag color={g === SiteStatGroup.HERO ? 'gold' : 'blue'}>{g}</Tag>,
    },
    { title: 'Key', dataIndex: 'key', render: (k) => <code>{k}</code> },
    { title: 'Value', dataIndex: 'value', render: (v) => <strong>{v}</strong> },
    { title: 'Label', dataIndex: 'label' },
    { title: 'Order', dataIndex: 'sortOrder', width: 70 },
    {
      title: 'Actions',
      align: 'right',
      render: (_, r) =>
        canWrite ? (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(r);
                form.setFieldsValue(r);
                setOpen(true);
              }}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                modal.confirm({
                  title: `Delete ${r.key}?`,
                  okType: 'danger',
                  onOk: () => del.mutateAsync(r.id),
                })
              }
            />
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
            form.setFieldValue('group', SiteStatGroup.HERO);
            setOpen(true);
          }}
        >
          New stat
        </Button>
      )}
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table rowKey="id" size="small" pagination={false} columns={columns} dataSource={rows} />
      </QueryState>
      <Modal
        title={editing ? 'Edit stat' : 'New stat'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item
            label="Key"
            name="key"
            rules={[{ required: true }]}
            tooltip="Upsert is keyed by this."
          >
            <Input disabled={!!editing} placeholder="hero.product_lines" />
          </Form.Item>
          <Form.Item label="Value" name="value" rules={[{ required: true }]}>
            <Input placeholder="26+" />
          </Form.Item>
          <Form.Item label="Label" name="label" rules={[{ required: true }]}>
            <Input placeholder="product lines" />
          </Form.Item>
          <Form.Item label="Group" name="group" rules={[{ required: true }]}>
            <Select options={Object.values(SiteStatGroup).map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
