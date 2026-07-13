import { z } from 'zod';

export const partnerEstimateSchema = z.object({
  asset_ids: z.array(z.string().min(1)).min(1).max(50),
});

export const partnerCreateTradeSchema = z.object({
  items: z.array(z.object({ asset_id: z.string().min(1) })).min(1).max(50),
  trade_url: z
    .string()
    .regex(
      /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/,
      'URL de trade Steam invalide'
    ),
});

export const partnerPayoutSchema = z.object({
  trade_id: z.string().min(1),
});

export const partnerWebhookConfigSchema = z.object({
  webhook_url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'L\'URL webhook doit être en HTTPS'),
});

export const partnerCreateApiClientSchema = z.object({
  name: z.string().min(2).max(100),
  user_id: z.string().min(1),
  rate_limit_per_min: z.number().int().min(10).max(1000).optional(),
  scopes: z.array(z.enum(['read', 'trade', 'payout'])).optional(),
  expires_at: z.string().datetime().optional().nullable(),
});
