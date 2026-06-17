import { z } from 'zod';
import { GiveawayStatus } from '@prisma/client';

/** Skinplace POST /api/skinplace/purchase */
export const skinplacePurchaseBodySchema = z
  .object({
    items: z.array(z.string()).min(1).max(50),
    payment_method: z.enum(['balance', 'stripe', 'crypto']),
    trade_token: z.string().optional(),
  })
  .strip();

/** Skinplace POST inventory/multiple */
export const skinplaceInventoryMultipleSchema = z
  .object({
    steam_ids: z.array(z.string()).min(1).max(10),
  })
  .strip();

/** Skinplace POST hold/withdraw */
export const skinplaceHoldWithdrawSchema = z
  .object({
    order_id: z.string().min(1, 'order_id est requis'),
  })
  .strip();

/** Skinplace POST trade (instant) */
export const skinplaceTradeInstantSchema = z
  .object({
    steam_id: z.string().min(1),
    trade_url: z.string().min(1),
    items: z.array(z.string()).min(1),
  })
  .strip();

const tradeItemMinimal = z.object({
  asset_id: z.string().min(1),
});

/** Skinplace POST create-trade — payload minimal, prix recalculés server-side */
export const skinplaceCreateTradeBodySchema = z
  .object({
    steam_id: z.string().min(1),
    trade_url: z.string().min(1),
    items: z.array(tradeItemMinimal).min(1).max(50),
    affiliate_promo_code: z.string().nullable().optional(),
  })
  .strip();

/** Skinplace webhook POST fallback — corps fusionné en query */
export const skinplaceWebhookPostBodySchema = z.record(z.string(), z.unknown());

/** Whitepay refresh / confirm — identifiants payout */
export const whitepayPayoutTransactionBodySchema = z
  .object({
    payoutId: z.string().min(1),
    transactionId: z.string().min(1),
  })
  .strip();

/** Whitepay quote / refresh — montant flexible */
export const whitepayAmountBodySchema = z
  .object({
    amountCents: z.union([z.number(), z.string()]).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
  })
  .strip()
  .refine((b) => b.amountCents != null || b.amount != null, {
    message: 'Montant invalide',
  });

/** Whitepay payout-request */
export const whitepayPayoutRequestBodySchema = z
  .object({
    amountCents: z.union([z.number(), z.string()]).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    tradeId: z.string().optional(),
    targetCurrency: z.string().optional(),
    network: z.string().optional(),
    walletAddress: z.string().optional(),
    memo: z.union([z.string(), z.null()]).optional(),
    travelRule: z.unknown().optional(),
    paymentMethodId: z.string().optional(),
  })
  .strip();

/** Flexify payout POST — corps polymorphe */
export const flexifyPayoutBodySchema = z.record(z.string(), z.unknown());

/** KYC address */
export const kycaidAddressBodySchema = z
  .object({
    country: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    streetName: z.string().min(1),
    buildingNumber: z.string().min(1),
    unitNumber: z.string().optional(),
  })
  .strip();

/** KYC initiate */
export const kycaidInitiateBodySchema = z
  .object({
    address: kycaidAddressBodySchema.optional(),
  })
  .strip();

const normalizeOptionalBic = (val: unknown) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.replace(/\s/g, '').toUpperCase();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeIban = (val: unknown) => {
  if (typeof val !== 'string') return val;
  return val.replace(/\s/g, '').toUpperCase();
};

/** Payouts SEPA FR */
export const payoutsSepaFrBodySchema = z
  .object({
    amountCents: z.union([z.number(), z.string()]),
    iban: z.preprocess(
      normalizeIban,
      z
        .string()
        .min(15)
        .max(34)
        .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Format IBAN invalide'),
    ),
    bic: z.preprocess(
      normalizeOptionalBic,
      z
        .string()
        .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Format BIC invalide')
        .optional(),
    ),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  })
  .strip();

/** Flexify quote — corps polymorphe (validation métier inchangée après parse) */
export const flexifyQuoteBodySchema = z.record(z.string(), z.unknown());

/** Steam POST create-trade — payload minimal, prix recalculés server-side */
export const steamCreateTradeBodySchema = z
  .object({
    steam_id: z.string().min(1),
    trade_url: z.string().min(1),
    items: z.array(z.object({ asset_id: z.string().min(1) })).min(1).max(50),
    affiliate_promo_code: z.string().nullable().optional(),
  })
  .strip();

/** Giveaway admin POST */
export const giveawayCreateBodySchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    prize: z.string().min(1),
    prizeImageUrl: z.string().nullable().optional(),
    steamMarketHashName: z.string().nullable().optional(),
    ticketPrice: z.union([z.number(), z.string()]).optional(),
    maxTickets: z.coerce.number().int().positive(),
    /** ISO ou timestamp ms — `new Date(endDate)` côté handler */
    endDate: z.union([z.string(), z.number()]),
    rewardValueCents: z.coerce.number().optional(),
    durationType: z.string().optional(),
    winnerCount: z.coerce.number().optional(),
    maxEntriesPerUser: z
      .union([z.coerce.number(), z.null()])
      .optional(),
    isPrivate: z.boolean().optional(),
    requiredAffiliateCode: z.string().nullable().optional(),
  })
  .strip();

/** Giveaway participate */
export const giveawayParticipateBodySchema = z
  .object({
    entriesToBuy: z.union([z.number(), z.string()]).optional(),
    ticketsUsed: z.union([z.number(), z.string()]).optional(),
  })
  .strip();

/** Giveaway PATCH admin */
export const giveawayPatchBodySchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    prize: z.string().optional(),
    prizeImageUrl: z.string().nullable().optional(),
    steamMarketHashName: z.string().nullable().optional(),
    ticketPrice: z.union([z.number(), z.string()]).optional(),
    maxTickets: z.coerce.number().int().positive().optional(),
    endDate: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    durationType: z.string().optional(),
    maxEntriesPerUser: z.union([z.coerce.number(), z.null()]).optional(),
    rewardValueCents: z.coerce.number().optional(),
    winnerCount: z.coerce.number().optional(),
    isPrivate: z.boolean().optional(),
    requiredAffiliateCode: z.string().nullable().optional(),
  })
  .strip();

/** GET /api/giveaways — liste publique */
export const giveawaysPublicListQuerySchema = z
  .object({
    status: z.nativeEnum(GiveawayStatus).optional(),
    ref: z.string().max(200).optional(),
  })
  .strip();
