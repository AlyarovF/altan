import { z } from 'zod';
import { ProductStatus } from '@altan/shared';

/**
 * Product form schema (RHF + zod). Mirrors CreateProductDto/UpdateProductDto from
 * the backend contract. ALTAN-specific rules from plan step 15:
 *  - HS code must be 6–10 digits (optionally dot-separated) when present.
 *  - Published products must carry a grade and a standard.
 */
const hsCodeRe = /^\d{4,10}(\.\d{1,4})*$/;

export const specSchema = z.object({
  label: z.string().min(1, 'Label required').max(120),
  value: z.string().min(1, 'Value required').max(200),
  unit: z.string().max(40).optional().or(z.literal('')),
});

export const localeFieldsSchema = z.object({
  name: z.string().max(200).optional().or(z.literal('')),
  shortDescription: z.string().max(500).optional().or(z.literal('')),
  description: z.string().max(8000).optional().or(z.literal('')),
});

export const productFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
    categoryId: z.string().min(1, 'Category is required'),
    regionId: z.string().min(1, 'Region is required'),
    status: z.nativeEnum(ProductStatus),
    featured: z.boolean(),
    grade: z.string().max(120).optional().or(z.literal('')),
    hsCode: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || hsCodeRe.test(v), 'Invalid HS code (e.g. 8101.99)'),
    standard: z.string().max(120).optional().or(z.literal('')),
    origin: z.string().max(120).optional().or(z.literal('')),
    minOrderQty: z.number().positive('Must be > 0').optional().nullable(),
    minOrderUnit: z.string().max(40).optional().or(z.literal('')),
    shortDescription: z.string().max(500).optional().or(z.literal('')),
    description: z.string().max(8000).optional().or(z.literal('')),
    imageUrl: z
      .string()
      .max(2048)
      .refine(
        (v) => !v || /^https?:\/\//i.test(v) || v.startsWith('/'),
        'Must be a full URL or an uploaded /media path',
      )
      .optional()
      .or(z.literal('')),
    badges: z.array(z.string()),
    specs: z.array(specSchema),
    ru: localeFieldsSchema,
    uz: localeFieldsSchema,
  })
  .superRefine((val, ctx) => {
    if (val.status === ProductStatus.PUBLISHED) {
      if (!val.grade) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['grade'],
          message: 'Grade is required to publish',
        });
      }
      if (!val.standard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['standard'],
          message: 'Standard is required to publish',
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
