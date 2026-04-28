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
