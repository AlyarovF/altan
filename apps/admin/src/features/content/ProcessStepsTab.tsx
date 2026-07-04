import { useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Space, Table, App as AntApp } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { contentApi } from './api';
import type { ProcessStep, UpsertProcessStepInput } from '@/lib/types';

export function ProcessStepsTab() {
  const { message, modal } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('content.write');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.processSteps,
    queryFn: contentApi.listSteps,
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessStep | null>(null);
  const [form] = Form.useForm<UpsertProcessStepInput>();

  const save = useMutation({
    mutationFn: (body: UpsertProcessStepInput) => contentApi.upsertStep(body),
    onSuccess: () => {
      message.success('Saved');
      void qc.invalidateQueries({ queryKey: qk.processSteps });
      setOpen(false);
    },
    onError: (e) => message.error(normalizeError(e).message),
  });
  const del = useMutation({
    mutationFn: (id: string) => contentApi.deleteStep(id),
    onSuccess: () => {
      message.success('Deleted');
      void qc.invalidateQueries({ queryKey: qk.processSteps });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const sorted = [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const columns: ColumnsType<ProcessStep> = [
    { title: 'Step', dataIndex: 'stepNo', width: 70 },
    { title: 'Key', dataIndex: 'key', render: (k) => <code>{k}</code> },
    { title: 'Title', dataIndex: 'title' },
    { title: 'Subtitle', dataIndex: 'subtitle', render: (s) => (s as string) ?? '—' },
    { title: 'Icon', dataIndex: 'icon', render: (i) => (i as string) ?? '—' },
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
                form.setFieldsValue(r as never);
                setOpen(true);
              }}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                modal.confirm({
                  title: `Delete step ${r.key}?`,
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
            setOpen(true);
          }}
        >
          New step
        </Button>
      )}
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table rowKey="id" size="small" pagination={false} columns={columns} dataSource={sorted} />
      </QueryState>
      <Modal
        title={editing ? 'Edit step' : 'New step'}
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
            tooltip="Stable identifier; upsert is keyed by this."
          >
            <Input disabled={!!editing} placeholder="source" />
          </Form.Item>
          <Form.Item label="Step number" name="stepNo" rules={[{ required: true }]}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Subtitle" name="subtitle">
            <Input />
          </Form.Item>
          <Form.Item label="Icon" name="icon" tooltip="lucide icon name">
            <Input placeholder="pickaxe" />
          </Form.Item>
          <Form.Item label="Sort order" name="sortOrder">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
