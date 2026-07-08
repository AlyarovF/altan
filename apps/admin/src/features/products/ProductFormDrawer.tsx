import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Divider,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Upload,
  App as AntApp,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CURRENCIES, INCOTERMS, ProductStatus, UNITS } from '@altan/shared';
import { qk } from '@/lib/queryClient';
import { normalizeError } from '@/lib/api/client';
import { resolveMediaUrl } from '@/lib/env';
import { slugify } from '@/lib/format';
import { useBadges, useCategories, useRegions } from '@/features/taxonomy/hooks';
import { SpecsEditor } from './SpecsEditor';
import { productFormSchema, type ProductFormValues } from './schema';
import { productsApi } from './api';
import type { AdminProduct, CreateProductInput } from '@/lib/types';

const emptyLocale = { name: '', shortDescription: '', description: '' };

const defaultValues: ProductFormValues = {
  name: '',
  slug: '',
  categoryId: '',
  regionId: '',
  status: ProductStatus.DRAFT,
  featured: false,
  grade: '',
  hsCode: '',
  standard: '',
  origin: '',
  minOrderQty: null,
  minOrderUnit: '',
  priceAmount: null,
  priceCurrency: '',
  priceUnit: '',
  priceBasis: '',
  priceNote: '',
  shortDescription: '',
  description: '',
  imageUrl: '',
  badges: [],
  specs: [],
  ru: { ...emptyLocale },
  uz: { ...emptyLocale },
};

interface Props {
  open: boolean;
  /** The summary row being edited, or null when creating. */
  product: AdminProduct | null;
  onClose: () => void;
}

export function ProductFormDrawer({ open, product, onClose }: Props) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();
  const isEdit = Boolean(product);

  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const { data: badges } = useBadges();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Fetch full editable record (IDs, specs, translations, imageUrl) for edit prefill.
  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ['product-detail', product?.id],
    queryFn: () => productsApi.getById(product!.id),
    enabled: open && isEdit && Boolean(product?.id),
  });

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      reset(defaultValues);
      return;
    }
    if (!detail) return;
    const ru = detail.translations.find((t) => t.locale === 'ru');
    const uz = detail.translations.find((t) => t.locale === 'uz');
    reset({
      ...defaultValues,
      name: detail.name,
      slug: detail.slug,
      categoryId: detail.categoryId,
      regionId: detail.regionId,
      status: detail.status as ProductStatus,
      featured: detail.featured,
      badges: detail.badges,
      grade: detail.grade ?? '',
      hsCode: detail.hsCode ?? '',
      standard: detail.standard ?? '',
      origin: detail.origin ?? '',
      minOrderQty: detail.minOrderQty != null ? Number(detail.minOrderQty) : null,
      // Stored enum-ish fields arrive as plain strings from the contract; the zod
      // schema re-validates them against UNITS/CURRENCIES/INCOTERMS on submit.
      minOrderUnit: (detail.minOrderUnit ?? '') as ProductFormValues['minOrderUnit'],
      priceAmount: detail.priceAmount != null ? Number(detail.priceAmount) : null,
      priceCurrency: (detail.priceCurrency ?? '') as ProductFormValues['priceCurrency'],
      priceUnit: (detail.priceUnit ?? '') as ProductFormValues['priceUnit'],
      priceBasis: (detail.priceBasis ?? '') as ProductFormValues['priceBasis'],
      priceNote: detail.priceNote ?? '',
      shortDescription: detail.shortDescription ?? '',
      description: detail.description ?? '',
      imageUrl: detail.imageUrl ?? '',
      specs: detail.specs.map((s) => ({ label: s.label, value: s.value, unit: s.unit ?? '' })),
      ru: {
        name: ru?.name ?? '',
        shortDescription: ru?.shortDescription ?? '',
        description: ru?.description ?? '',
      },
      uz: {
        name: uz?.name ?? '',
        shortDescription: uz?.shortDescription ?? '',
        description: uz?.description ?? '',
      },
    });
  }, [open, isEdit, detail, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const body = toPayload(values, product?.sortOrder ?? 0);
      return isEdit ? productsApi.update(product!.id, body) : productsApi.create(body);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Product updated' : 'Product created');
      void qc.invalidateQueries({ queryKey: ['products'] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      onClose();
    },
    onError: (err) => message.error(normalizeError(err).message),
  });

  const status = getValues('status');

  return (
    <Drawer
      title={isEdit ? `Edit · ${product?.name}` : 'New product'}
      width={760}
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
              () => message.error('Please fix the highlighted fields'),
            )}
          >
            Save
          </Button>
        </Space>
      }
    >
      {loadingDetail ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <Form layout="vertical">
          <Tabs
            items={[
              {
                key: 'core',
                label: 'Details (EN)',
                children: (
                  <CoreFields
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    getValues={getValues}
                    categories={categories ?? []}
                    regions={regions ?? []}
                    badges={(badges ?? []).map((b) => ({
                      value: b.code,
                      label: `${b.emoji} ${b.label}`,
                    }))}
                    statusPublished={status === ProductStatus.PUBLISHED}
                  />
                ),
              },
              {
                key: 'ru',
                label: 'Русский',
                children: <LocaleFields control={control} prefix="ru" />,
              },
              {
                key: 'uz',
                label: 'O‘zbekcha',
                children: <LocaleFields control={control} prefix="uz" />,
              },
              {
                key: 'specs',
                label: 'Specs',
                children: <SpecsEditor control={control} />,
              },
            ]}
          />
        </Form>
      )}
    </Drawer>
  );
}

/**
 * The PATCH contract distinguishes explicit `null` ("clear the stored value")
 * from `undefined`/absent ("keep it"). The generated write types don't model
 * nullable fields, so we cast the intentional null once here — without it,
 * clearing a price or min-order in the form would silently keep the old value.
 */
const CLEARED = null as unknown as undefined;

/** Map form values → CreateProductDto/UpdateProductDto. */
function toPayload(v: ProductFormValues, sortOrder: number): CreateProductInput {
  const translations = [
    { locale: 'ru' as const, ...v.ru },
    { locale: 'uz' as const, ...v.uz },
  ]
    .filter((t) => t.name || t.shortDescription || t.description)
    .map((t) => ({
      locale: t.locale,
      name: t.name || v.name,
      shortDescription: t.shortDescription || undefined,
      description: t.description || undefined,
    }));

  return {
    name: v.name,
    slug: v.slug,
    categoryId: v.categoryId,
    regionId: v.regionId,
    status: v.status,
    featured: v.featured,
    grade: v.grade || undefined,
    hsCode: v.hsCode || undefined,
    standard: v.standard || undefined,
    origin: v.origin || undefined,
    minOrderQty: v.minOrderQty ?? CLEARED,
    minOrderUnit: v.minOrderUnit || CLEARED,
    priceAmount: v.priceAmount ?? CLEARED,
    priceCurrency: (v.priceCurrency || CLEARED) as CreateProductInput['priceCurrency'],
    priceUnit: v.priceUnit || CLEARED,
    priceBasis: v.priceBasis || CLEARED,
    priceNote: v.priceNote || CLEARED,
    shortDescription: v.shortDescription || undefined,
    description: v.description || undefined,
    imageUrl: v.imageUrl || undefined,
    sortOrder,
    badges: v.badges as CreateProductInput['badges'],
    specs: v.specs.map((s, i) => ({
      label: s.label,
      value: s.value,
      unit: s.unit || undefined,
      sortOrder: i,
    })),
    translations,
  };
}

interface CoreProps {
  control: ReturnType<typeof useForm<ProductFormValues>>['control'];
  errors: ReturnType<typeof useForm<ProductFormValues>>['formState']['errors'];
  setValue: ReturnType<typeof useForm<ProductFormValues>>['setValue'];
  getValues: ReturnType<typeof useForm<ProductFormValues>>['getValues'];
  categories: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  badges: { value: string; label: string }[];
  statusPublished: boolean;
}

function err(e?: { message?: string }) {
  return e ? { validateStatus: 'error' as const, help: e.message } : {};
}

function CoreFields({
  control,
  errors,
  setValue,
  getValues,
  categories,
  regions,
  badges,
}: CoreProps) {
  return (
    <>
      <Form.Item label="Name" required {...err(errors.name)}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              onChange={(e) => {
                field.onChange(e);
                if (!getValues('slug')) setValue('slug', slugify(e.target.value));
              }}
              placeholder="Tungsten Metal"
            />
          )}
        />
      </Form.Item>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Slug" required {...err(errors.slug)} className="flex-1">
          <Controller
            control={control}
            name="slug"
            render={({ field }) => <Input {...field} addonBefore="/products/" />}
          />
        </Form.Item>
      </Space>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Category" required {...err(errors.categoryId)} className="flex-1">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Region" required {...err(errors.regionId)} className="flex-1">
          <Controller
            control={control}
            name="regionId"
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={regions.map((r) => ({ value: r.id, label: r.name }))}
              />
            )}
          />
        </Form.Item>
      </Space>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Grade" {...err(errors.grade)} className="flex-1">
          <Controller
            control={control}
            name="grade"
            render={({ field }) => <Input {...field} placeholder="99.95%" />}
          />
        </Form.Item>
        <Form.Item label="HS code" {...err(errors.hsCode)} className="flex-1">
          <Controller
            control={control}
            name="hsCode"
            render={({ field }) => <Input {...field} placeholder="8101.99" />}
          />
        </Form.Item>
      </Space>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Standard (OʻzMSt)" {...err(errors.standard)} className="flex-1">
          <Controller
            control={control}
            name="standard"
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label="Origin" {...err(errors.origin)} className="flex-1">
          <Controller
            control={control}
            name="origin"
            render={({ field }) => <Input {...field} placeholder="Uzbekistan" />}
          />
        </Form.Item>
      </Space>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Min. order qty" {...err(errors.minOrderQty)} className="flex-1">
          <Controller
            control={control}
            name="minOrderQty"
            render={({ field }) => (
              <InputNumber {...field} value={field.value ?? undefined} min={0} className="w-full" />
            )}
          />
        </Form.Item>
        <Form.Item label="Min. order unit" {...err(errors.minOrderUnit)} className="flex-1">
          <Controller
            control={control}
            name="minOrderUnit"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                allowClear
                placeholder="kg"
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
            )}
          />
        </Form.Item>
      </Space>
      <Divider orientation="left" plain>
        Indicative pricing
      </Divider>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Price amount" {...err(errors.priceAmount)} className="flex-1">
          <Controller
            control={control}
            name="priceAmount"
            render={({ field }) => (
              <InputNumber
                {...field}
                value={field.value ?? undefined}
                min={0}
                className="w-full"
                placeholder="33500"
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Currency" {...err(errors.priceCurrency)} className="flex-1">
          <Controller
            control={control}
            name="priceCurrency"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                allowClear
                placeholder="USD"
                options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Price unit" {...err(errors.priceUnit)} className="flex-1">
          <Controller
            control={control}
            name="priceUnit"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                allowClear
                placeholder="MT"
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
            )}
          />
        </Form.Item>
      </Space>
      <Space className="w-full" size="middle" styles={{ item: { flex: 1 } }}>
        <Form.Item label="Basis (Incoterm)" {...err(errors.priceBasis)} className="flex-1">
          <Controller
            control={control}
            name="priceBasis"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value || undefined}
                allowClear
                placeholder="FCA"
                options={INCOTERMS.map((i) => ({ value: i, label: i }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Price note" {...err(errors.priceNote)} className="flex-1">
          <Controller
            control={control}
            name="priceNote"
            render={({ field }) => <Input {...field} placeholder="FCA Tashkent, min 5 MT" />}
          />
        </Form.Item>
      </Space>
      <Form.Item label="Short description" {...err(errors.shortDescription)}>
        <Controller
          control={control}
          name="shortDescription"
          render={({ field }) => <Input.TextArea {...field} rows={2} />}
        />
      </Form.Item>
      <Form.Item label="Long description" {...err(errors.description)}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => <Input.TextArea {...field} rows={4} />}
        />
      </Form.Item>
      <Form.Item label="Badges" {...err(errors.badges)}>
        <Controller
          control={control}
          name="badges"
          render={({ field }) => (
            <Select
              {...field}
              mode="multiple"
              allowClear
              options={badges}
              placeholder="Hot / New"
            />
          )}
        />
      </Form.Item>
      <Space size="large">
        <Form.Item label="Status">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                {...field}
                style={{ width: 160 }}
                options={[
                  { value: ProductStatus.DRAFT, label: 'Draft' },
                  { value: ProductStatus.PUBLISHED, label: 'Published' },
                ]}
              />
            )}
          />
        </Form.Item>
        <Form.Item label="Featured">
          <Controller
            control={control}
            name="featured"
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
          />
        </Form.Item>
      </Space>
      <Form.Item
        label="Product image"
        {...err(errors.imageUrl)}
        tooltip="Upload an image (stored via /admin/media) or paste an external image URL."
      >
        <Controller
          control={control}
          name="imageUrl"
          render={({ field }) => <ImageField value={field.value ?? ''} onChange={field.onChange} />}
        />
      </Form.Item>
    </>
  );
}

/** Upload-to-/admin/media + paste-a-URL editor bound to the `imageUrl` field. */
function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { message } = AntApp.useApp();
  const [uploading, setUploading] = useState(false);
  const preview = resolveMediaUrl(value);

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const asset = await productsApi.uploadMedia(file as File);
      onChange(asset.url);
      onSuccess?.(asset);
      message.success('Image uploaded');
    } catch (e) {
      const n = normalizeError(e);
      onError?.(new Error(n.message));
      message.error(n.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Space align="start" wrap>
        <Upload
          accept="image/*"
          showUploadList={false}
          maxCount={1}
          customRequest={customRequest}
          beforeUpload={(file) => {
            if (file.size > 5 * 1024 * 1024) {
              message.error('Image must be 5 MB or smaller');
              return Upload.LIST_IGNORE;
            }
            return true;
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            Upload image
          </Button>
        </Upload>
        {preview && (
          <Image
            src={preview}
            alt="Product image preview"
            width={64}
            height={64}
            className="rounded object-cover"
          />
        )}
      </Space>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://… or /media/… (auto-filled on upload)"
        allowClear
      />
    </div>
  );
}

function LocaleFields({
  control,
  prefix,
}: {
  control: ReturnType<typeof useForm<ProductFormValues>>['control'];
  prefix: 'ru' | 'uz';
}) {
  return (
    <>
      <Form.Item label="Name">
        <Controller
          control={control}
          name={`${prefix}.name`}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Form.Item label="Short description">
        <Controller
          control={control}
          name={`${prefix}.shortDescription`}
          render={({ field }) => <Input.TextArea {...field} rows={2} />}
        />
      </Form.Item>
      <Form.Item label="Long description">
        <Controller
          control={control}
          name={`${prefix}.description`}
          render={({ field }) => <Input.TextArea {...field} rows={4} />}
        />
      </Form.Item>
    </>
  );
}
