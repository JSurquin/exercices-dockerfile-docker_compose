import { z } from 'zod';

const normalizeIban = (val: unknown) => {
  if (typeof val !== 'string') return val;
  return val.replace(/\s/g, '').toUpperCase();
};

const normalizeBic = (val: unknown) => {
  if (typeof val !== 'string') return val;
  return val.replace(/\s/g, '').toUpperCase();
};

export const merchantWithdrawBankBodySchema = z
  .object({
    subtype: z.literal('bank'),
    amountCents: z.union([z.number(), z.string()]),
    accountHolder: z.string().min(1).max(200),
    iban: z.preprocess(
      normalizeIban,
      z
        .string()
        .min(15)
        .max(34)
        .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Format IBAN invalide'),
    ),
    bic: z.preprocess(
      normalizeBic,
      z.string().regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Format BIC invalide'),
    ),
    country: z.string().length(2).regex(/^[A-Z]{2}$/i, 'Code pays invalide'),
  })
  .strip();

export const merchantWithdrawCryptoBodySchema = z
  .object({
    subtype: z.literal('crypto'),
    amountCents: z.union([z.number(), z.string()]),
    asset: z.string().min(1).max(20),
    network: z.string().min(1).max(30),
    address: z.string().min(10).max(256),
    memo: z.string().max(128).optional(),
  })
  .strip();

export const merchantWithdrawBodySchema = z.discriminatedUnion('subtype', [
  merchantWithdrawBankBodySchema,
  merchantWithdrawCryptoBodySchema,
]);

export const adminMerchantWithdrawBodySchema = z
  .object({
    action: z.enum(['process', 'approve', 'reject']),
    reference: z.string().optional(),
    reason: z.string().optional(),
    internalNote: z.string().max(1000).optional(),
  })
  .strip();
