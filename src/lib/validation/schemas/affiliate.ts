import { z } from 'zod';

export const affiliateApplyPostSchema = z
  .object({
    motivation: z.string().min(1, 'Données requises manquantes'),
    socialLinks: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export const affiliateLinkPostSchema = z
  .object({
    path: z.string().optional(),
  })
  .strip();

export const affiliateCommissionsQuerySchema = z
  .object({
    status: z.string().optional(),
  })
  .strip()
  .transform((d) => ({
    status: d.status && d.status.length > 0 ? d.status : 'PENDING',
  }));

export const affiliateCommissionsPostSchema = z
  .object({
    action: z.string().min(1, 'Paramètres requis manquants'),
    commissionIds: z.array(z.string()).optional(),
  })
  .strip();

export const affiliateGiveawayRequestPostSchema = z
  .object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    winnerCount: z.coerce.number().int().min(1),
    costCents: z.coerce.number().int().min(1),
    adminMessage: z.string().max(2000).optional().nullable(),
  })
  .strip();
