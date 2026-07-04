import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
  App as AntApp,
} from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ChangeDirection, Outlook, ProductStatus } from '@altan/shared';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { slugify } from '@/lib/format';
import { newsFormSchema, type NewsFormValues } from './schema';
import { NewsCardPreview } from './NewsCardPreview';
import { newsApi } from './api';
import type { AdminNews, CreateNewsInput } from '@/lib/types';

const emptyLocale = { title: '', summary: '', body: '' };

const defaults: NewsFormValues = {
  title: '',
  slug: '',
  commodity: '',
  publishedAt: null,
  priceLabel: '',
  changeLabel: '',
  changeDirection: ChangeDirection.FLAT,
  outlook: Outlook.FIRM,
  summary: '',
  body: '',
  status: ProductStatus.DRAFT,
  ru: { ...emptyLocale },
  uz: { ...emptyLocale },
};

export function NewsFormDrawer({
  open,
  article,
  onClose,
}: {
  open: boolean;
  article: AdminNews | null;
  onClose: () => void;
}) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const isEdit = Boolean(article);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<NewsFormValues>({ resolver: zodResolver(newsFormSchema), defaultValues: defaults });

  const watched = useWatch({ control });

  useEffect(() => {
    if (!open) return;
    if (!article) {
      reset(defaults);
      return;
    }
    reset({
      ...defaults,
      title: article.title,
      slug: article.slug,
      commodity: article.commodity,
      publishedAt: (article.publishedAt as string | null) ?? null,
      priceLabel: (article.priceLabel as string | null) ?? '',
      changeLabel: (article.changeLabel as string | null) ?? '',
      changeDirection: article.changeDirection as ChangeDirection,
      outlook: article.outlook as Outlook,
      summary: (article.summary as string | null) ?? '',
      body: (article.body as string | null) ?? '',
      status: article.status as ProductStatus,
    });
  }, [open, article, reset]);

  const mutation = useMutation({
    mutationFn: (v: NewsFormValues) => {
      const body = toPayload(v, article?.sortOrder ?? 0);
      return isEdit ? newsApi.update(article!.id, body) : newsApi.create(body);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Article updated' : 'Article created');
      void qc.invalidateQueries({ queryKey: ['news'] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      onClose();
    },
    onError: (e) => message.error(normalizeError(e).message),
  });

  function fieldErr(e?: { message?: string }) {
    return e ? { validateStatus: 'error' as const, help: e.message } : {};
  }

  return (
    <Drawer
      title={isEdit ? `Edit · ${article?.title}` : 'New article'}
      width={920}
      open={open}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={mutation.isPending}
            onClick={handleSubmit(
              (v) => mutation.mutate(v),
              () => message.error('Fix the highlighted fields'),
            )}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Form layout="vertical">
            <Tabs
              items={[
                {
                  key: 'core',
                  label: 'Content (EN)',
                  children: (
                    <>
                      <Form.Item label="Title" required {...fieldErr(errors.title)}>
                        <Controller
                          control={control}
                          name="title"
                          render={({ field }) => (
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!getValues('slug')) setValue('slug', slugify(e.target.value));
                              }}
                            />
                          )}
                        />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item label="Slug" required {...fieldErr(errors.slug)}>
                            <Controller
                              control={control}
                              name="slug"
                              render={({ field }) => <Input {...field} />}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Commodity" required {...fieldErr(errors.commodity)}>
                            <Controller
                              control={control}
                              name="commodity"
                              render={({ field }) => <Input {...field} placeholder="APT" />}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item label="Price label">
                            <Controller
                              control={control}
                              name="priceLabel"
                              render={({ field }) => <Input {...field} placeholder="$292/MTU" />}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Change label">
                            <Controller
                              control={control}
                              name="changeLabel"
                              render={({ field }) => <Input {...field} placeholder="+8.4% YTD" />}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Direction">
                            <Controller
                              control={control}
                              name="changeDirection"
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  options={[
                                    { value: ChangeDirection.UP, label: '▲ Up' },
                                    { value: ChangeDirection.DOWN, label: '▼ Down' },
                                    { value: ChangeDirection.FLAT, label: '▬ Flat' },
                                  ]}
                                />
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={8}>
                          <Form.Item label="Outlook">
                            <Controller
                              control={control}
                              name="outlook"
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  options={Object.values(Outlook).map((o) => ({
                                    value: o,
                                    label: o,
                                  }))}
                                />
                              )}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Published at">
                            <Controller
                              control={control}
                              name="publishedAt"
                              render={({ field }) => (
                                <DatePicker
                                  className="w-full"
                                  showTime
                                  value={field.value ? dayjs(field.value) : null}
                                  onChange={(d) => field.onChange(d ? d.toISOString() : null)}
                                />
                              )}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Status">
                            <Controller
                              control={control}
                              name="status"
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  options={[
                                    { value: ProductStatus.DRAFT, label: 'Draft' },
                                    { value: ProductStatus.PUBLISHED, label: 'Published' },
                                  ]}
                                />
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item label="Summary">
                        <Controller
                          control={control}
                          name="summary"
                          render={({ field }) => <Input.TextArea {...field} rows={2} />}
                        />
                      </Form.Item>
                      <Form.Item
                        label="Body (Markdown)"
                        tooltip="Markdown is stored as-is and rendered on the public detail page."
                      >
                        <Controller
                          control={control}
                          name="body"
                          render={({ field }) => <Input.TextArea {...field} rows={8} />}
                        />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: 'ru',
                  label: 'Русский',
                  children: <LocaleNews control={control} prefix="ru" />,
                },
                {
                  key: 'uz',
                  label: 'O‘zbekcha',
                  children: <LocaleNews control={control} prefix="uz" />,
                },
              ]}
            />
          </Form>
        </Col>
        <Col xs={24} lg={10}>
          <Typography.Text
            type="secondary"
            className="mb-2 block text-xs uppercase tracking-widest"
          >
            Public card preview
          </Typography.Text>
          <NewsCardPreview values={{ ...defaults, ...(watched as NewsFormValues) }} />
        </Col>
      </Row>
    </Drawer>
  );
}

function toPayload(v: NewsFormValues, sortOrder: number): CreateNewsInput {
  const translations = [
    { locale: 'ru' as const, ...v.ru },
    { locale: 'uz' as const, ...v.uz },
  ]
    .filter((t) => t.title || t.summary || t.body)
    .map((t) => ({
      locale: t.locale,
      title: t.title || v.title,
      summary: t.summary || undefined,
      body: t.body || undefined,
    }));

  return {
    title: v.title,
    slug: v.slug,
    commodity: v.commodity,
    publishedAt: v.publishedAt || undefined,
    priceLabel: v.priceLabel || undefined,
    changeLabel: v.changeLabel || undefined,
    changeDirection: v.changeDirection,
    outlook: v.outlook,
    summary: v.summary || undefined,
    body: v.body || undefined,
    status: v.status,
    sortOrder,
    translations,
  };
}

function LocaleNews({
  control,
  prefix,
}: {
  control: ReturnType<typeof useForm<NewsFormValues>>['control'];
  prefix: 'ru' | 'uz';
}) {
  return (
    <>
      <Form.Item label="Title">
        <Controller
          control={control}
          name={`${prefix}.title`}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Form.Item label="Summary">
        <Controller
          control={control}
          name={`${prefix}.summary`}
          render={({ field }) => <Input.TextArea {...field} rows={2} />}
        />
      </Form.Item>
      <Form.Item label="Body (Markdown)">
        <Controller
          control={control}
          name={`${prefix}.body`}
          render={({ field }) => <Input.TextArea {...field} rows={8} />}
        />
      </Form.Item>
    </>
  );
}
