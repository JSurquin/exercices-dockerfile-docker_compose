import { z } from 'zod';

export const homePopupStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

export const homePopupBodySchema = z.object({
  titleFr: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  titleCn: z.string().max(200).optional().nullable(),
  messageFr: z.string().min(1).max(5000),
  messageEn: z.string().min(1).max(5000),
  messageCn: z.string().max(5000).optional().nullable(),
  ctaUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
  ctaLabelFr: z.string().max(120).optional().nullable(),
  ctaLabelEn: z.string().max(120).optional().nullable(),
  ctaLabelCn: z.string().max(120).optional().nullable(),
  status: homePopupStatusSchema.optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const homePopupPatchSchema = homePopupBodySchema.partial();

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
