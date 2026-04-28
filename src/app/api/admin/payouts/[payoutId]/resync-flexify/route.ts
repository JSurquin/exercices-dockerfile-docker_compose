import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import {
  getTransactionStatus,
  getTransactionByReference,
  convertFlexifyStatus,
  isTransactionCompleted,
  type FlexifyTransactionStatus,
} from '@/lib/flexify';

/**
 * POST - Resynchroniser le statut d'un payout Flexify avec l'API Flexify (Reporting).
 * Utile pour les payouts restés en "En attente" alors que Flexify les a déjà traités.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const context = getRequestContext(_request);
  try {
    const session = await requireAdminSessionWithDbCheck(_request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/payouts/[payoutId]/resync-flexify', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { payoutId } = await params;
    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId requis' }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { paymentMethod: true },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout non trouvé' }, { status: 404 });
    }

    const pmType = payout.paymentMethod.type;
    const isFlexify = pmType === 'FLEXIFY_CARD' || pmType === 'SEPA';
    if (!isFlexify) {
      return NextResponse.json(
        { error: 'Seuls les payouts Flexify (carte ou SEPA) peuvent être resynchronisés' },
        { status: 400 }
      );
    }

    const flexifyId = payout.flexifyPayoutId ?? undefined;
    const reference = payout.gateFiOrderId ?? undefined;
    if (!flexifyId && !reference) {
      return NextResponse.json(
        { error: 'Ce payout n\'a pas d\'ID Flexify ni de référence (impossible de resync)' },
        { status: 400 }
      );
    }

    let flexifyResponse: Awaited<ReturnType<typeof getTransactionStatus>>;
    try {
      if (flexifyId) {
        flexifyResponse = await getTransactionStatus(flexifyId);
      } else if (reference) {
        flexifyResponse = await getTransactionByReference(reference);
      } else {
        return NextResponse.json({ error: 'Données Flexify manquantes' }, { status: 400 });
      }
    } catch (err) {
      console.error('[admin/payouts/resync-flexify] Flexify API error:', err);
      return NextResponse.json(
        {
          error: 'Impossible de récupérer le statut chez Flexify',
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }

    const flexifyStatus: FlexifyTransactionStatus =
      (flexifyResponse.transaction?.status as FlexifyTransactionStatus) ??
      ((flexifyResponse as { status?: FlexifyTransactionStatus }).status) ??
      'pending';
    const internalStatus = convertFlexifyStatus(flexifyStatus);

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED',
        ...(flexifyId && !payout.flexifyPayoutId && { flexifyPayoutId: flexifyId }),
        ...(isTransactionCompleted(flexifyStatus) && { paidAt: new Date() }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_PAYOUT_RESYNC_FLEXIFY',
        details: {
          payoutId,
          targetUserId: payout.userId,
          previousStatus: payout.status,
          newStatus: internalStatus,
          flexifyStatus,
          flexifyTransactionId: flexifyId,
        },
        ipAddress: getClientIP(_request),
      },
    });

    return NextResponse.json({
      success: true,
      payoutId,
      previousStatus: payout.status,
      newStatus: internalStatus,
      flexifyStatus,
    });
  } catch (err) {
    console.error('[admin/payouts/resync-flexify]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
