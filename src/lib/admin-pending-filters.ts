import type { Prisma } from '@prisma/client';
import { KycStatus } from '@prisma/client';

/** Users who submitted a KYC dossier and are awaiting review (excludes default PENDING). */
export const submittedKycPendingWhere: Prisma.UserWhereInput = {
  kycStatus: { in: [KycStatus.KYCAID_PENDING, KycStatus.IN_PROGRESS] },
  OR: [
    { kycaidApplicantId: { not: null } },
    { kycDocuments: { some: {} } },
    { kycVerifications: { some: {} } },
  ],
};

export const payoutPendingApprovalWhere: Prisma.PayoutWhereInput = {
  status: 'PENDING_APPROVAL',
};

export const sepaPendingApprovalWhere: Prisma.PayoutWhereInput = {
  status: 'PENDING_APPROVAL',
  gateFiOrderId: { startsWith: 'MOON-SEPA-FR' },
};

export const merchantWithdrawPendingWhere: Prisma.PayoutWhereInput = {
  status: { in: ['PENDING_APPROVAL', 'PROCESSING'] },
  gateFiOrderId: { startsWith: 'MOON-MERCHANT-WD-' },
};

export const payoutProcessingWhere: Prisma.PayoutWhereInput = {
  status: {
    in: [
      'PENDING',
      'PENDING_APPROVAL',
      'FLEXIFY_PENDING',
      'FLEXIFY_PROCESSING',
      'WHITEPAY_WAITING_CONFIRMATION',
      'WHITEPAY_PENDING_WITHDRAWAL',
      'WHITEPAY_PROCESSING_WITHDRAWAL',
    ],
  },
};
