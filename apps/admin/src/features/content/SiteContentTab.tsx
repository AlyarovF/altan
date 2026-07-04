import { useMemo, useState } from 'react';
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { QueryState } from '@/components/QueryState';
import { usePermission } from '@/components/Can';
import type { Locale } from '@/lib/types';
import { contentApi } from './api';

/**
 * Site content editor, per locale (EN base + RU/UZ overrides, EN fallback).
 *
 * The content API accepts any JSON per key, so we pick an editor by value shape:
 * scalar keys (companyName, tagline, tag) get a text field, string-array keys
 * (trustBadges) get a tag-list editor, and structured keys (footer, …) get a JSON
 * editor with parse validation. Each key is edited across all three locales: values
 * load from `GET /admin/content/:key`, saves go per-locale via `PUT` with `locale`,
 * and an RU/UZ override can be cleared (DELETE) so the key falls back to EN again.
 */
const STRING_KEYS = ['companyName', 'tagline', 'tag'];
const STRING_LIST_KEYS = ['trustBadges'];
/** Ordering weight for the editor list (scalars first, then lists, then objects). */
const ORDER = [...STRING_KEYS, ...STRING_LIST_KEYS];

type Kind = 'string' | 'stringList' | 'json';
const LOCALES: Locale[] = ['en', 'ru', 'uz'];

function kindOf(key: string): Kind {
  if (STRING_KEYS.includes(key)) return 'string';
  if (STRING_LIST_KEYS.includes(key)) return 'stringList';
  return 'json';
}

export function SiteContentTab() {
  const canWrite = usePermission('content.write');
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.content,
    queryFn: contentApi.listContent,
  });

  const sortedKeys = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => {
          const ai = ORDER.indexOf(a.key);
          const bi = ORDER.indexOf(b.key);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
        .map((item) => item.key),
    [data],
  );

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={sortedKeys.length === 0}
    >
      <Space direction="vertical" size="middle" className="w-full">
        {sortedKeys.map((key) => (
          <ContentKeyCard key={key} contentKey={key} kind={kindOf(key)} canWrite={canWrite} />
        ))}
      </Space>
    </QueryState>
  );
}

/** One content key, edited across EN / RU / UZ. Loads all locale values on demand. */
function ContentKeyCard({
  contentKey,
  kind,
  canWrite,
}: {
  contentKey: string;
  kind: Kind;
  canWrite: boolean;
}) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const [locale, setLocale] = useState<Locale>('en');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.contentKey(contentKey),
    queryFn: () => contentApi.getContentLocales(contentKey),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.contentKey(contentKey) });
    void qc.invalidateQueries({ queryKey: qk.content });
  };

  const save = useMutation({
    mutationFn: (p: { valueJson: unknown; locale: Locale }) =>
      contentApi.upsertContent(contentKey, p.valueJson, p.locale),
    onSuccess: () => {
      message.success('Saved — remember to publish to update the public site');
      invalidate();
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const clear = useMutation({
    mutationFn: (loc: Exclude<Locale, 'en'>) => contentApi.deleteContentOverride(contentKey, loc),
    onSuccess: () => {
      message.success('Override cleared — now falls back to EN. Remember to publish.');
      invalidate();
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  const values = data?.values;
  const hasOverride = (loc: Locale) => (loc === 'en' ? true : values?.[loc] != null);

  const options = LOCALES.map((loc) => ({
    value: loc,
    label: (
      <span className="inline-flex items-center gap-1.5">
        {loc.toUpperCase()}
        {loc !== 'en' && hasOverride(loc) && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-deep"
            aria-label="has override"
          />
        )}
      </span>
    ),
  }));

  const editorProps = values && {
    locale,
    value: values[locale],
    fallback: values.en,
    hasOverride: hasOverride(locale),
    disabled: !canWrite,
    saving: save.isPending,
    clearing: clear.isPending,
    onSave: (v: unknown) => save.mutate({ valueJson: v, locale }),
    onClear: () => clear.mutate(locale as Exclude<Locale, 'en'>),
  };

  return (
    <Card
      size="small"
      title={<code>{contentKey}</code>}
      extra={
        <Segmented<Locale>
          size="small"
          value={locale}
          onChange={setLocale}
          options={options}
          aria-label={`Locale for ${contentKey}`}
        />
      }
    >
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {editorProps && kind === 'string' && <StringEditor key={locale} {...editorProps} />}
        {editorProps && kind === 'stringList' && <StringListEditor key={locale} {...editorProps} />}
        {editorProps && kind === 'json' && <JsonEditor key={locale} {...editorProps} />}
      </QueryState>
    </Card>
  );
}

interface EditorProps {
  locale: Locale;
  /** Value for the active locale (null for an unset RU/UZ override). */
  value: unknown;
  /** EN base value, shown as fallback guidance for RU/UZ. */
  fallback: unknown;
  hasOverride: boolean;
  onSave: (v: unknown) => void;
  onClear: () => void;
  saving: boolean;
  clearing: boolean;
  disabled: boolean;
}

/** Shared "falls back to EN" note + clear-override control shown under each editor. */
function OverrideControls({
  locale,
  hasOverride,
  fallbackPreview,
  onClear,
  clearing,
  disabled,
}: Pick<EditorProps, 'locale' | 'hasOverride' | 'onClear' | 'clearing' | 'disabled'> & {
  fallbackPreview?: string;
}) {
  if (locale === 'en') return null;
  const loc = locale.toUpperCase();
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      {hasOverride ? (
        <Typography.Text type="secondary" className="text-xs">
          Overriding the EN base for {loc}.
        </Typography.Text>
      ) : (
        <Typography.Text type="secondary" className="text-xs">
          No {loc} override — falls back to EN
          {fallbackPreview ? `: “${fallbackPreview}”` : ''}.
        </Typography.Text>
      )}
      {hasOverride && (
        <Button
          size="small"
          type="text"
          danger
          loading={clearing}
          disabled={disabled}
          onClick={onClear}
        >
          Clear override
        </Button>
      )}
    </div>
  );
}

function StringEditor({
  locale,
  value,
  fallback,
  hasOverride,
  onSave,
  onClear,
  saving,
  clearing,
  disabled,
}: EditorProps) {
  const current = hasOverride ? String(value ?? '') : '';
  const [val, setVal] = useState(current);
  const enText = String(fallback ?? '');
  return (
    <>
      <Space.Compact className="w-full">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={disabled}
          placeholder={locale !== 'en' && !hasOverride ? enText : undefined}
          aria-label={`${locale} value`}
        />
        <Button
          type="primary"
          loading={saving}
          disabled={disabled || val === current}
          onClick={() => onSave(val)}
        >
          Save
        </Button>
      </Space.Compact>
      <OverrideControls
        locale={locale}
        hasOverride={hasOverride}
        fallbackPreview={enText}
        onClear={onClear}
        clearing={clearing}
        disabled={disabled}
      />
    </>
  );
}

function StringListEditor({
  locale,
  value,
  fallback,
  hasOverride,
  onSave,
  onClear,
  saving,
  clearing,
  disabled,
}: EditorProps) {
  const current = hasOverride && Array.isArray(value) ? (value as unknown[]).map(String) : [];
  const [items, setItems] = useState<string[]>(current);
  const enItems = Array.isArray(fallback) ? (fallback as unknown[]).map(String) : [];
  const dirty = JSON.stringify(items) !== JSON.stringify(current);
  return (
    <>
      <div className="flex items-start gap-2">
        <Select
          mode="tags"
          value={items}
          onChange={setItems}
          disabled={disabled}
          open={false}
          suffixIcon={null}
          className="w-full"
          placeholder={
            locale !== 'en' && !hasOverride && enItems.length
              ? `Falls back to EN: ${enItems.join(', ')}`
              : 'Type a badge and press Enter'
          }
          aria-label={`${locale} badges`}
        />
        <Button
          type="primary"
          loading={saving}
          disabled={disabled || !dirty}
          onClick={() => onSave(items)}
        >
          Save
        </Button>
      </div>
      <Typography.Text type="secondary" className="text-xs">
        Press Enter to add each item; click the × on a tag to remove it.
      </Typography.Text>
      <OverrideControls
        locale={locale}
        hasOverride={hasOverride}
        fallbackPreview={enItems.join(', ')}
        onClear={onClear}
        clearing={clearing}
        disabled={disabled}
      />
    </>
  );
}

function JsonEditor({
  locale,
  value,
  fallback,
  hasOverride,
  onSave,
  onClear,
  saving,
  clearing,
  disabled,
}: EditorProps) {
  const initial = hasOverride ? JSON.stringify(value, null, 2) : '';
  const enJson = JSON.stringify(fallback, null, 2);
  const [text, setText] = useState(initial);
  const [err, setErr] = useState<string>();

  function submit() {
    try {
      const parsed = JSON.parse(text);
      setErr(undefined);
      onSave(parsed);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button
          type="primary"
          size="small"
          loading={saving}
          disabled={disabled || text === initial}
          onClick={submit}
        >
          Save
        </Button>
      </div>
      <Form.Item validateStatus={err ? 'error' : undefined} help={err} className="!mb-0">
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 18 }}
          disabled={disabled}
          placeholder={locale !== 'en' && !hasOverride ? enJson : undefined}
          className="!font-mono !text-xs"
          aria-label={`${locale} JSON`}
        />
      </Form.Item>
      <Typography.Text type="secondary" className="text-xs">
        Structured JSON (footer / hero). Edit carefully.
      </Typography.Text>
      <OverrideControls
        locale={locale}
        hasOverride={hasOverride}
        onClear={onClear}
        clearing={clearing}
        disabled={disabled}
      />
    </>
  );
}
