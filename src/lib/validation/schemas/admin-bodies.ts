import { z } from 'zod';

export const adminModeratorPromoteSchema = z.object({
  userId: z.string().min(1, 'ID utilisateur requis'),
});

export const adminModeratorInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const adminBalanceUserReasonSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1),
});

export const adminBalanceAdjustSchema = z.object({
  userId: z.string().min(1),
  amountCents: z.coerce.number().int().min(-1_000_000_00).max(1_000_000_00), // ±1 000 000 €
  reason: z.string().min(1).max(500),
});

export const adminAffiliatePostSchema = z.object({
  action: z.enum(['toggle_status', 'update_commission_rate', 'update_code', 'remove_affiliate']),
  affiliateId: z.string().min(1),
  data: z.any().optional().default({}),
});

export const adminAffiliateApplicationPostSchema = z.object({
  action: z.enum(['approve', 'reject']),
  applicationId: z.string().min(1),
  data: z
    .object({
      rejectionReason: z.string().optional(),
      commissionRate: z.coerce.number().optional(),
      code: z.string().optional(),
    })
    .strip()
    .optional(),
});

export const adminAffiliateCommissionsPostSchema = z
  .object({
    action: z.string().min(1),
    commissionIds: z.array(z.string()).optional(),
    payoutData: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export const adminAffiliateRecalculateSchema = z.object({
  action: z.string().min(1),
  affiliateId: z.string().optional(),
  tradeId: z.string().optional(),
});

export const adminAffiliateCreateBodySchema = z
  .object({
    email: z.string().email(),
    name: z.string().optional(),
    code: z.string().optional(),
    commissionRate: z.coerce.number().optional(),
    sendEmail: z.boolean().optional(),
  })
  .strip();

export const adminPayoutAutoApprovePutSchema = z
  .object({
    enabled: z.boolean().optional(),
    thresholdCents: z.coerce.number().optional(),
  })
  .strip();

export const adminPointsPostSchema = z.record(z.string(), z.unknown());

export const adminPromoteAffiliateBodySchema = z
  .object({
    commissionRate: z.coerce.number().optional(),
    code: z.string().optional(),
  })
  .strip();

export const adminGiveawaysSettingsPutSchema = z.object({ enabled: z.boolean() }).strip();

export const adminKycApplicantResetBodySchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dob: z.string().optional(),
    residenceCountry: z.string().optional(),
  })
  .strip();

export const adminLegalPageTranslateRequestSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    content: z.string().min(1),
    sourceLang: z.enum(['fr', 'en', 'cn']),
    targetLang: z.enum(['fr', 'en', 'cn']),
  })
  .strip();

export const adminSepaRequestBodySchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    reason: z.string().optional(),
    reference: z.string().optional(),
  })
  .strip();

export const adminPayoutCancelBodySchema = z
  .object({
    reason: z.string().optional(),
  })
  .strip();

export const adminWithdrawalLimitPutSchema = z
  .object({
    monthlyLimitCents: z.union([z.number(), z.null()]).optional(),
  })
  .strip();

export const adminUserCreateSchema = z
  .object({
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'MODERATOR', 'AFFILIATE']).optional(),
    sendEmail: z.boolean().optional(),
  })
  .strip();

export const adminNotificationCreateSchema = z.record(z.string(), z.unknown());

export const adminPreferencesBodySchema = z.record(z.string(), z.unknown());

export const adminUpdateNotificationsSchema = z.record(z.string(), z.unknown());

export const adminLegalPagePostSchema = z.record(z.string(), z.unknown());

export const adminLegalPagePatchSchema = z.record(z.string(), z.unknown());

export const adminBalanceUnfreezeSchema = z.object({
  userId: z.string().min(1),
});

/** GET /api/admin/affiliates */
export const adminAffiliatesListQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(200)),
    search: z.string().max(500).optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
  })
  .strip();

/** GET /api/admin/affiliate-applications */
export const adminAffiliateApplicationsListQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(200)),
    status: z.string().max(32).optional(),
  })
  .strip();

/** GET /api/admin/affiliate-giveaway-requests */
export const adminAffiliateGiveawayRequestsListQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(200)),
    status: z.enum(['all', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  })
  .strip();

export const adminAffiliateGiveawayRequestPostSchema = z.object({
  action: z.enum(['approve', 'reject']),
  requestId: z.string().min(1),
  data: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(2000).optional(),
      prize: z.string().min(1).max(500).optional(),
      prizeImageUrl: z.string().url().optional().nullable(),
      steamMarketHashName: z.string().max(500).optional().nullable(),
      rewardValueCents: z.coerce.number().int().min(0).optional(),
      ticketPrice: z.coerce.number().int().min(1).optional(),
      maxTickets: z.coerce.number().int().min(1).optional(),
      rejectionReason: z.string().max(1000).optional(),
    })
    .strip()
    .optional(),
});

/** GET /api/admin/affiliates/commissions */
export const adminAffiliateCommissionsListQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(200)),
    status: z.string().max(32).optional(),
    affiliateId: z.string().max(128).optional(),
  })
  .strip();

const recurringFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

export const giveawaySeriesCreateBodySchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    prize: z.string().min(1),
    prizeImageUrl: z.string().nullable().optional(),
    steamMarketHashName: z.string().nullable().optional(),
    ticketPrice: z.coerce.number().int().positive(),
    maxTickets: z.coerce.number().int().positive(),
    durationMinutes: z.coerce.number().int().positive(),
    frequency: recurringFrequencySchema,
    winnerCount: z.coerce.number().int().positive().optional(),
    maxEntriesPerUser: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
    rewardValueCents: z.coerce.number().int().min(0).optional(),
    isPrivate: z.boolean().optional(),
    requiredAffiliateCode: z.string().nullable().optional(),
    startDate: z.union([z.string(), z.number()]).optional(),
    endDate: z.union([z.string(), z.number(), z.null()]).optional(),
    enabled: z.boolean().optional(),
  })
  .strip();

export const giveawaySeriesPatchBodySchema = z
  .object({
    action: z.enum(['pause', 'resume', 'disable', 'restart', 'spawn']).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    prize: z.string().min(1).optional(),
    prizeImageUrl: z.string().nullable().optional(),
    steamMarketHashName: z.string().nullable().optional(),
    ticketPrice: z.coerce.number().int().positive().optional(),
    maxTickets: z.coerce.number().int().positive().optional(),
    durationMinutes: z.coerce.number().int().positive().optional(),
    frequency: recurringFrequencySchema.optional(),
    winnerCount: z.coerce.number().int().positive().optional(),
    maxEntriesPerUser: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
    rewardValueCents: z.coerce.number().int().min(0).optional(),
    isPrivate: z.boolean().optional(),
    requiredAffiliateCode: z.string().nullable().optional(),
    startDate: z.union([z.string(), z.number()]).optional(),
    endDate: z.union([z.string(), z.number(), z.null()]).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']).optional(),
    syncActiveInstance: z.boolean().optional(),
  })
  .strip();
