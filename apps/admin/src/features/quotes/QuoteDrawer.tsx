import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
  App as AntApp,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUOTE_STATUS_TRANSITIONS, QuoteStatus } from '@altan/shared';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { usePermission } from '@/components/Can';
import { QueryState } from '@/components/QueryState';
import { SlaTag } from './SlaTag';
import { quotesApi } from './api';
import type { QuoteItem } from '@/lib/types';

const STATUS_FLOW: QuoteStatus[] = [
  QuoteStatus.NEW,
  QuoteStatus.IN_REVIEW,
  QuoteStatus.QUOTED,
  QuoteStatus.WON,
];

export function QuoteDrawer({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('quote.write');
  const [respondForm] = Form.useForm();
  const [nextStatus, setNextStatus] = useState<QuoteStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.quote(id ?? ''),
    queryFn: () => quotesApi.detail(id!),
    enabled: open && Boolean(id),
  });

  useEffect(() => {
    setNextStatus(undefined);
    respondForm.resetFields();
  }, [id, respondForm]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['quotes'] });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
  };

  const statusMut = useMutation({
    mutationFn: (status: QuoteStatus) => quotesApi.updateStatus(id!, status),
    onSuccess: (d) => {
      message.success(`Status → ${d.status}`);
      qc.setQueryData(qk.quote(id ?? ''), d);
      setNextStatus(undefined);
      invalidate();
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const respondMut = useMutation({
    mutationFn: (vals: { responseMessage: string; internalNotes?: string }) =>
      quotesApi.respond(id!, vals),
    onSuccess: (d) => {
      message.success('Response recorded');
      qc.setQueryData(qk.quote(id ?? ''), d);
      respondForm.resetFields();
      invalidate();
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const allowed = data ? QUOTE_STATUS_TRANSITIONS[data.status as QuoteStatus] : [];
  const stepIndex = data ? Math.max(0, STATUS_FLOW.indexOf(data.status as QuoteStatus)) : 0;

  const itemCols = [
    { title: 'Product', dataIndex: 'productName' },
    { title: 'Qty', dataIndex: 'quantity' },
    { title: 'Unit', dataIndex: 'unit' },
    { title: 'Notes', dataIndex: 'notes', render: (n: string | null) => n ?? '—' },
  ];

  return (
    <Drawer
      title={data ? `Quote ${data.ref}` : 'Quote'}
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <Space>
                <Tag>{data.status}</Tag>
                <SlaTag
                  slaDueAt={data.slaDueAt}
                  respondedAt={data.respondedAt}
                  overdue={data.overdue}
                  slaMet={data.slaMet}
                />
              </Space>
            </div>

            <Steps
              size="small"
              current={stepIndex}
              status={
                data.status === QuoteStatus.LOST || data.status === QuoteStatus.CLOSED
                  ? 'error'
                  : 'process'
              }
              items={STATUS_FLOW.map((s) => ({ title: s }))}
              className="mb-5"
            />

            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Company">{data.companyName}</Descriptions.Item>
              <Descriptions.Item label="Contact">{data.contactName}</Descriptions.Item>
              <Descriptions.Item label="Email">{data.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">
                {(data.phone as string | null) ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Country">{data.country}</Descriptions.Item>
              <Descriptions.Item label="Incoterm">{data.incoterm}</Descriptions.Item>
              <Descriptions.Item label="Destination" span={2}>
                {data.destination}
              </Descriptions.Item>
              <Descriptions.Item label="Source">{data.source}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(data.createdAt)}</Descriptions.Item>
              {data.message ? (
                <Descriptions.Item label="Message" span={2}>
                  {data.message as string}
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <Divider orientation="left" className="!mt-6">
              Line items
            </Divider>
            <Table<QuoteItem>
              rowKey="id"
              size="small"
              pagination={false}
              columns={itemCols}
              dataSource={data.items}
            />

            <Divider orientation="left" className="!mt-6">
              Status workflow
            </Divider>
            {allowed.length === 0 ? (
              <Typography.Text type="secondary">This quote is in a terminal state.</Typography.Text>
            ) : canWrite ? (
              <Space>
                <Select
                  placeholder="Transition to…"
                  style={{ width: 200 }}
                  value={nextStatus}
                  onChange={setNextStatus}
                  options={allowed.map((s) => ({ value: s, label: s }))}
                />
                <Button
                  type="primary"
                  disabled={!nextStatus}
                  loading={statusMut.isPending}
                  onClick={() => nextStatus && statusMut.mutate(nextStatus)}
                >
                  Apply
                </Button>
              </Space>
            ) : (
              <Alert type="info" showIcon message="You have read-only access to quotes." />
            )}

            <Divider orientation="left" className="!mt-6">
              Respond &amp; notes
            </Divider>
            {data.respondedAt ? (
              <Alert
                className="mb-3"
                type={data.slaMet ? 'success' : 'warning'}
                showIcon
                message={`Responded ${formatDate(data.respondedAt as string)} — SLA ${data.slaMet ? 'met' : 'missed'}`}
              />
            ) : null}
            {canWrite ? (
              <Form
                form={respondForm}
                layout="vertical"
                initialValues={{
                  responseMessage: (data.responseMessage as string | null) ?? '',
                  internalNotes: (data.internalNotes as string | null) ?? '',
                }}
                onFinish={(v) => respondMut.mutate(v)}
              >
                <Form.Item
                  label="Response to customer"
                  name="responseMessage"
                  rules={[{ required: true, message: 'Response message is required' }]}
                >
                  <Input.TextArea rows={3} placeholder="Quoted price, validity, terms…" />
                </Form.Item>
                <Form.Item label="Internal notes" name="internalNotes">
                  <Input.TextArea rows={2} placeholder="Visible to staff only" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={respondMut.isPending}>
                  {data.respondedAt ? 'Update response' : 'Record response'}
                </Button>
              </Form>
            ) : (
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Response">
                  {(data.responseMessage as string | null) ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Internal notes">
                  {(data.internalNotes as string | null) ?? '—'}
                </Descriptions.Item>
              </Descriptions>
            )}

            <Divider orientation="left" className="!mt-6">
              Activity
            </Divider>
            <Timeline
              items={[
                { children: `Created ${formatDate(data.createdAt)} via ${data.source}` },
                { children: `Current status: ${data.status}` },
                ...(data.slaDueAt
                  ? [
                      {
                        color: data.overdue ? 'red' : 'blue',
                        children: `SLA due ${formatDate(data.slaDueAt as string)}`,
                      },
                    ]
                  : []),
                ...(data.respondedAt
                  ? [
                      {
                        color: data.slaMet ? 'green' : 'red',
                        children: `Responded ${formatDate(data.respondedAt as string)} (SLA ${data.slaMet ? 'met' : 'missed'})`,
                      },
                    ]
                  : []),
              ]}
            />
            <Typography.Text type="secondary" className="text-xs">
              Note: derived from quote timestamps — a dedicated immutable audit-trail endpoint is
              not yet in the API contract.
            </Typography.Text>
            {isLoading ? <Spin /> : null}
          </>
        )}
      </QueryState>
    </Drawer>
  );
}
