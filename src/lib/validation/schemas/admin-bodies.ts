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
  amountCents: z.coerce.number(),
  reason: z.string().min(1),
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
    })
    .passthrough()
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
