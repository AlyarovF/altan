import { useMemo, useState } from 'react';
import { Alert, Button, Input, Select, Space, Table, Tag, Upload, App as AntApp } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LOCALES } from '@altan/shared';
import { PageHeader } from '@/components/PageHeader';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import { RevalidateButton } from '@/features/content/RevalidateButton';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { downloadJson } from '@/lib/format';
import { translationsApi, type TranslationsExport } from './api';

interface Row {
  fullKey: string;
  namespace: string;
  key: string;
  en: string;
  ru: string;
  uz: string;
}

/** Split a flat dotted key ("nav.catalog") into namespace + key. */
function splitKey(fullKey: string): { namespace: string; key: string } {
  const idx = fullKey.indexOf('.');
  if (idx < 0) return { namespace: 'common', key: fullKey };
  return { namespace: fullKey.slice(0, idx), key: fullKey.slice(idx + 1) };
}

function buildRows(exp: TranslationsExport): Row[] {
  const keys = new Set<string>();
  LOCALES.forEach((l) => Object.keys(exp[l] ?? {}).forEach((k) => keys.add(k)));
  return [...keys].sort().map((fullKey) => {
    const { namespace, key } = splitKey(fullKey);
    return {
      fullKey,
      namespace,
      key,
      en: exp.en?.[fullKey] ?? '',
      ru: exp.ru?.[fullKey] ?? '',
      uz: exp.uz?.[fullKey] ?? '',
    };
  });
}

export function TranslationsPage() {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const canWrite = usePermission('content.write');
  const [namespace, setNamespace] = useState<string>();
  const [search, setSearch] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.translations('__all__'),
    queryFn: translationsApi.export,
  });
  const { data: missing } = useQuery({
    queryKey: qk.translationsMissing,
    queryFn: translationsApi.missing,
  });

  const upsert = useMutation({
    mutationFn: (body: { namespace: string; key: string; locale: string; value: string }) =>
      translationsApi.upsert(body as never),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.translations('__all__') });
      void qc.invalidateQueries({ queryKey: qk.translationsMissing });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const importMut = useMutation({
    mutationFn: (json: unknown) => translationsApi.import(json),
    onSuccess: (res) => {
      message.success(`Imported ${res.imported} of ${res.total} entries`);
      void qc.invalidateQueries({ queryKey: qk.translations('__all__') });
      void qc.invalidateQueries({ queryKey: qk.translationsMissing });
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const allRows = useMemo(() => (data ? buildRows(data) : []), [data]);
  const namespaces = useMemo(() => [...new Set(allRows.map((r) => r.namespace))].sort(), [allRows]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (namespace && r.namespace !== namespace) return false;
      if (onlyMissing && r.en && r.ru && r.uz) return false;
      if (q && !`${r.fullKey} ${r.en} ${r.ru} ${r.uz}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, namespace, search, onlyMissing]);

  const missingCount = (missing?.missing?.ru?.length ?? 0) + (missing?.missing?.uz?.length ?? 0);

  function makeLocaleColumn(locale: 'en' | 'ru' | 'uz'): ColumnsType<Row>[number] {
    return {
      title: locale.toUpperCase(),
      dataIndex: locale,
      render: (val: string, row) => (
        <CellEditor
          key={`${row.fullKey}:${locale}:${val}`}
          value={val}
          disabled={!canWrite}
          missing={!val}
          onSave={(v) =>
            upsert.mutate({ namespace: row.namespace, key: row.key, locale, value: v })
          }
        />
      ),
    };
  }

  const columns: ColumnsType<Row> = [
    { title: 'Namespace', dataIndex: 'namespace', width: 130, render: (n) => <Tag>{n}</Tag> },
    {
      title: 'Key',
      dataIndex: 'key',
      width: 200,
      render: (k) => <code className="text-xs">{k}</code>,
    },
    makeLocaleColumn('en'),
    makeLocaleColumn('ru'),
    makeLocaleColumn('uz'),
  ];

  function onUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importMut.mutate(JSON.parse(String(reader.result)));
      } catch {
        message.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    return false;
  }

  return (
    <>
      <PageHeader
        title="Translations"
        subtitle="EN / RU / UZ — inline edit, import / export"
        extra={
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => downloadJson('altan-translations.json', data)}
            >
              Export JSON
            </Button>
            {canWrite && (
              <Upload accept=".json" showUploadList={false} beforeUpload={onUpload}>
                <Button icon={<UploadOutlined />} loading={importMut.isPending}>
                  Import JSON
                </Button>
              </Upload>
            )}
            <RevalidateButton />
          </Space>
        }
      />

      {missingCount > 0 ? (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message={`${missingCount} missing translation(s): RU ${missing?.missing.ru?.length ?? 0}, UZ ${missing?.missing.uz?.length ?? 0}`}
          action={
            <Button size="small" onClick={() => setOnlyMissing((v) => !v)}>
              {onlyMissing ? 'Show all' : 'Show missing'}
            </Button>
          }
        />
      ) : (
        <Alert type="success" showIcon className="mb-3" message="No missing translations." />
      )}

      <Space wrap className="mb-3">
        <Input.Search
          allowClear
          placeholder="Search key / value"
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Namespace"
          style={{ width: 180 }}
          value={namespace}
          options={namespaces.map((n) => ({ value: n, label: n }))}
          onChange={setNamespace}
        />
        <Select
          style={{ width: 160 }}
          value={onlyMissing ? 'missing' : 'all'}
          options={[
            { value: 'all', label: 'All keys' },
            { value: 'missing', label: 'Missing only' },
          ]}
          onChange={(v) => setOnlyMissing(v === 'missing')}
        />
      </Space>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Table<Row>
          rowKey="fullKey"
          size="small"
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} keys` }}
        />
      </QueryState>
    </>
  );
}

/**
 * Inline cell editor. Local state is seeded from `value`; on blur it commits via
 * onSave only if changed. The parent passes a `key` derived from the server value
 * so a remount re-seeds local state after import/refresh.
 */
function CellEditor({
  value,
  onSave,
  disabled,
  missing,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled: boolean;
  missing: boolean;
}) {
  const [val, setVal] = useState(value);
  return (
    <Input.TextArea
      autoSize
      status={missing && !val ? 'warning' : undefined}
      disabled={disabled}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== value) onSave(val);
      }}
      className="!text-xs"
    />
  );
}
