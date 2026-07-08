'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  Space,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import {
  INCOTERMS,
  UNITS,
  quoteRequestSchema,
  type QuoteRequestInput,
  type Unit,
} from '@altan/shared';
import { submitQuoteRequest, normalizeError } from '@/lib/api/client';
import { useQuoteModal } from './QuoteModalContext';

const { TextArea } = Input;

const EMPTY_ITEM = {
  productName: '',
  quantity: undefined as unknown as number,
  unit: 'kg' as Unit,
};

/** Prefill units come from free-form product data — only accept canonical UNITS. */
function toUnit(unit?: string): Unit {
  return UNITS.includes(unit as Unit) ? (unit as Unit) : 'kg';
}

function buildDefaults(prefillName?: string, unit?: string): QuoteRequestInput {
  return {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
    incoterm: 'CIF',
    destination: '',
    message: '',
    items: [
      prefillName
        ? { productName: prefillName, quantity: undefined as unknown as number, unit: toUnit(unit) }
        : { ...EMPTY_ITEM },
    ],
  };
}

export function QuoteModal() {
  const t = useTranslations('quote');
  const tc = useTranslations('common');
  const { open, prefill, closeQuote } = useQuoteModal();
  const { message } = AntdApp.useApp();

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: buildDefaults(prefill?.productName, prefill?.unit),
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Honeypot: a hidden field bots tend to fill. We drop the submit if it's set.
  const honeypot = register('companyWebsite' as never);

  const mutation = useMutation({
    mutationFn: submitQuoteRequest,
    onError: (err) => {
      message.error(normalizeError(err).message || t('errorBody'));
    },
  });

  // Reset the form whenever the modal (re)opens, applying any prefill.
  useEffect(() => {
    if (open) {
      mutation.reset();
      reset(buildDefaults(prefill?.productName, prefill?.unit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  const onSubmit = (values: QuoteRequestInput & { companyWebsite?: string }) => {
    if (values.companyWebsite) return; // honeypot tripped — silently drop
    const { companyWebsite: _hp, ...payload } = values;
    mutation.mutate(payload);
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    closeQuote();
  };

  const success = mutation.isSuccess ? mutation.data : null;

  const incotermOptions = INCOTERMS.map((code) => ({ value: code, label: code }));
  const unitOptions = UNITS.map((unit) => ({ value: unit, label: unit }));

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={success ? null : t('title')}
      footer={null}
      width={620}
      destroyOnClose
      maskClosable={!mutation.isPending}
      aria-label={t('title')}
    >
      {success ? (
        <Result
          status="success"
          title={t('successTitle')}
          subTitle={
            <div className="space-y-3">
              <p className="text-steel-600">{t('success')}</p>
              <div className="inline-flex flex-col items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 px-6 py-4">
                <span className="text-xs uppercase tracking-eyebrow text-steel-500">
                  {t('yourRef')}
                </span>
                <span className="font-mono text-xl font-semibold text-ink">{success.ref}</span>
              </div>
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-amber-deep">
                <ClockCircleOutlined /> {t('slaPromise')}
              </p>
            </div>
          }
          extra={
            <Button
              key="another"
              onClick={() => {
                mutation.reset();
                reset(buildDefaults());
              }}
            >
              {t('submitAnother')}
            </Button>
          }
        />
      ) : (
        <Form
          layout="vertical"
          onFinish={handleSubmit(onSubmit)}
          requiredMark="optional"
          className="mt-2"
        >
          <p className="mb-5 text-sm text-steel-600">{t('subtitle')}</p>

          {/* Honeypot — visually hidden, off-screen, not announced. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] h-px w-px opacity-0"
            {...honeypot}
          />

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="companyName"
              render={({ field }) => (
                <Form.Item
                  label={t('companyName')}
                  required
                  validateStatus={errors.companyName ? 'error' : undefined}
                  help={errors.companyName ? t('required') : undefined}
                >
                  <Input {...field} autoComplete="organization" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="contactName"
              render={({ field }) => (
                <Form.Item
                  label={t('contactName')}
                  required
                  validateStatus={errors.contactName ? 'error' : undefined}
                  help={errors.contactName ? t('required') : undefined}
                >
                  <Input {...field} autoComplete="name" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Form.Item
                  label={t('email')}
                  required
                  validateStatus={errors.email ? 'error' : undefined}
                  help={errors.email ? t('invalidEmail') : undefined}
                >
                  <Input {...field} type="email" autoComplete="email" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Form.Item label={t('phone')}>
                  <Input {...field} autoComplete="tel" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <Form.Item
                  label={t('country')}
                  required
                  validateStatus={errors.country ? 'error' : undefined}
                  help={errors.country ? t('required') : undefined}
                >
                  <Input {...field} autoComplete="country-name" />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="destination"
              render={({ field }) => (
                <Form.Item
                  label={t('destination')}
                  required
                  validateStatus={errors.destination ? 'error' : undefined}
                  help={errors.destination ? t('required') : undefined}
                >
                  <Input {...field} />
                </Form.Item>
              )}
            />
            <Controller
              control={control}
              name="incoterm"
              render={({ field }) => (
                <Form.Item label={t('incoterm')} required>
                  <Select {...field} options={incotermOptions} />
                </Form.Item>
              )}
            />
          </div>

          <div className="mt-1 rounded-lg border border-steel-200 bg-steel-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{t('material')}</span>
              {errors.items && !Array.isArray(errors.items) && (
                <span className="text-xs text-signal-down">{t('minItems')}</span>
              )}
            </div>
            <div className="space-y-3">
              {fields.map((fieldItem, index) => (
                <div
                  key={fieldItem.id}
                  className="grid grid-cols-[1fr] gap-2 sm:grid-cols-[1fr_120px_96px_auto]"
                >
                  <Controller
                    control={control}
                    name={`items.${index}.productName`}
                    render={({ field }) => (
                      <Form.Item
                        className="!mb-0"
                        validateStatus={errors.items?.[index]?.productName ? 'error' : undefined}
                      >
                        <Input {...field} placeholder={t('material')} />
                      </Form.Item>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <Form.Item
                        className="!mb-0"
                        validateStatus={errors.items?.[index]?.quantity ? 'error' : undefined}
                      >
                        <InputNumber
                          {...field}
                          className="!w-full"
                          min={0}
                          placeholder={t('quantity')}
                        />
                      </Form.Item>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <Form.Item className="!mb-0">
                        <Select {...field} options={unitOptions} aria-label={t('unit')} />
                      </Form.Item>
                    )}
                  />
                  <Button
                    type="text"
                    aria-label={t('removeItem')}
                    icon={<DeleteOutlined />}
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  />
                </div>
              ))}
            </div>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              className="!mt-2 !px-0"
              onClick={() => append({ ...EMPTY_ITEM })}
            >
              {t('addItem')}
            </Button>
          </div>

          <Controller
            control={control}
            name="message"
            render={({ field }) => (
              <Form.Item label={t('message')} className="!mt-4">
                <TextArea {...field} rows={3} placeholder={t('messagePlaceholder')} />
              </Form.Item>
            )}
          />

          <Space className="mt-2 w-full justify-end">
            <Button onClick={handleClose} disabled={mutation.isPending}>
              {tc('cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              icon={<ClockCircleOutlined />}
            >
              {mutation.isPending ? t('submitting') : t('submit')}
            </Button>
          </Space>
        </Form>
      )}
    </Modal>
  );
}
