import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import {
  payoutPendingApprovalWhere,
  payoutProcessingWhere,
  sepaPendingApprovalWhere,
  merchantWithdrawPendingWhere,
  submittedKycPendingWhere,
} from '@/lib/admin-pending-filters';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const [pendingPayouts, pendingApprovals, kycPending, sepaPending, merchantWithdrawPending] = await Promise.all([
      prisma.payout.count({ where: payoutProcessingWhere }),
      prisma.payout.count({ where: payoutPendingApprovalWhere }),
      prisma.user.count({ where: submittedKycPendingWhere }),
      prisma.payout.count({ where: sepaPendingApprovalWhere }),
      prisma.payout.count({ where: merchantWithdrawPendingWhere }),
    ]);

    return NextResponse.json({
      pendingPayouts,
      pendingApprovals,
      kycPending,
      sepaPending,
      merchantWithdrawPending,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des compteurs:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
