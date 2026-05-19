import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const [pendingPayouts, kycPending] = await Promise.all([
      prisma.payout.count({
        where: {
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
        },
      }),
      prisma.user.count({
        where: {
          kycStatus: { in: ['PENDING', 'KYCAID_PENDING', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return NextResponse.json({ pendingPayouts, kycPending });
  } catch (error) {
    console.error('Erreur lors de la récupération des compteurs:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
