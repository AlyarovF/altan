import { z } from 'zod';
import { ChangeDirection, Outlook, ProductStatus } from '@altan/shared';

const localeNews = z.object({
  title: z.string().max(200).optional().or(z.literal('')),
  summary: z.string().max(2000).optional().or(z.literal('')),
  body: z.string().max(20000).optional().or(z.literal('')),
});

export const newsFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
  commodity: z.string().min(1, 'Commodity is required').max(120),
  publishedAt: z.string().optional().nullable(),
  priceLabel: z.string().max(120).optional().or(z.literal('')),
  changeLabel: z.string().max(120).optional().or(z.literal('')),
  changeDirection: z.nativeEnum(ChangeDirection),
  outlook: z.nativeEnum(Outlook),
  summary: z.string().max(2000).optional().or(z.literal('')),
  body: z.string().max(20000).optional().or(z.literal('')),
  status: z.nativeEnum(ProductStatus),
  ru: localeNews,
  uz: localeNews,
});

export type NewsFormValues = z.infer<typeof newsFormSchema>;
