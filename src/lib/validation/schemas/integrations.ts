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

const tradeItemLoose = z.object({
  asset_id: z.string(),
  market_hash_name: z.string(),
  icon_url: z.string(),
  rarity: z.string(),
  exterior: z.string(),
  is_stattrak: z.boolean(),
  is_souvenir: z.boolean(),
  price_centimes: z.coerce.number(),
});

/** Skinplace POST create-trade — aligné sur CreateTradeRequest + refine historique */
export const skinplaceCreateTradeBodySchema = z
  .object({
    steam_id: z.string().optional(),
    trade_url: z.string().optional(),
    items: z.array(tradeItemLoose).optional(),
    gross_value_centimes: z.coerce.number().optional(),
    fees: z
      .object({
        cashout_fee: z.coerce.number(),
        network_fee: z.coerce.number(),
        total_fees: z.coerce.number(),
      })
      .optional(),
    net_value_centimes: z.coerce.number().optional(),
    affiliate_promo_code: z.string().nullable().optional(),
  })
  .strip()
  .refine(
    (d) => !!(d.steam_id && d.trade_url && d.items && d.items.length > 0),
    { message: 'Données manquantes' }
  );

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

/** GateFi onramp/offramp quote */
export const gatefiQuoteBodySchema = z
  .object({
    fiatAmount: z.coerce.number().positive(),
    crypto: z.string().min(1),
    region: z.string().min(1),
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

/** Payouts SEPA FR */
export const payoutsSepaFrBodySchema = z
  .object({
    amountCents: z.coerce.number(),
    iban: z.string(),
    bic: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .strip();

/** Flexify quote — corps polymorphe (validation métier inchangée après parse) */
export const flexifyQuoteBodySchema = z.record(z.string(), z.unknown());

/** GateFi buy/sell — corps polymorphe */
export const gatefiOrderBodySchema = z.record(z.string(), z.unknown());

/** Steam POST create-trade — corps distinct du flux Skinplace */
const steamTradeItemSchema = z.object({
  asset_id: z.string(),
  icon_url: z.string(),
  rarity: z.string(),
  class_id: z.string(),
  instance_id: z.string(),
  market_hash_name: z.string(),
  estimated_price: z.coerce.number(),
});

export const steamCreateTradeBodySchema = z
  .object({
    steam_id: z.string(),
    trade_url: z.string(),
    items: z.array(steamTradeItemSchema).min(1),
    gross_value: z.coerce.number(),
    fees: z.object({
      cashout_fee: z.coerce.number(),
      network_fee: z.coerce.number(),
      total_fees: z.coerce.number(),
    }),
    net_value: z.coerce.number(),
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
