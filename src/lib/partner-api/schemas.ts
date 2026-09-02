import { z } from 'zod';
import { assertPublicHttpsWebhookUrl } from '@/lib/partner-api/webhook-url';

const partnerTradeUrlSchema = z
  .string()
  .regex(
    /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/,
    'Invalid Steam trade URL'
  );

function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

export const partnerEstimateSchema = z.object({
  asset_ids: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .refine(uniqueStrings, 'Duplicate asset_ids are not allowed'),
});

export const partnerCreateTradeSchema = z.object({
  items: z
    .array(z.object({ asset_id: z.string().min(1) }))
    .min(1)
    .max(50)
    .refine((items) => uniqueStrings(items.map((item) => item.asset_id)), 'Duplicate asset_id values are not allowed'),
  trade_url: partnerTradeUrlSchema,
});

export const partnerPayoutSchema = z.object({
  trade_id: z.string().min(1),
});

export const partnerWebhookConfigSchema = z.object({
  webhook_url: z
    .string()
    .url()
    .superRefine((url, ctx) => {
      const check = assertPublicHttpsWebhookUrl(url);
      if (!check.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.error });
      }
    }),
});

export const partnerCreateApiClientSchema = z.object({
  name: z.string().min(2).max(100),
  user_id: z.string().min(1),
  rate_limit_per_min: z.number().int().min(10).max(1000).optional(),
  scopes: z.array(z.enum(['read', 'trade', 'payout'])).min(1),
  expires_at: z.string().datetime().optional().nullable(),
});

export const partnerUpdateApiClientSchema = z.object({
  rate_limit_per_min: z.number().int().min(10).max(1000).optional(),
  scopes: z.array(z.enum(['read', 'trade', 'payout'])).min(1).optional(),
});
