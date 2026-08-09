import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { verifyMutationOrigin } from '@/lib/csrf-mutation-guard';
import {
  assertMerchantUser,
  isMerchantWithdrawReference,
  MerchantWithdrawForbiddenError,
} from '@/lib/merchant-withdraw';
import { getClientIP } from '@/lib/security/audit-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  try {
    const csrfBlock = verifyMutationOrigin(request);
    if (csrfBlock) return csrfBlock;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { payoutId } = await params;

    try {
      await assertMerchantUser(userId);
    } catch (err) {
      if (err instanceof MerchantWithdrawForbiddenError) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      throw err;
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      select: {
        id: true,
        userId: true,
        status: true,
        amountCents: true,
        gateFiOrderId: true,
        balanceFrozenAt: true,
        balanceDebitedAt: true,
      },
    });

    if (!payout || payout.userId !== userId) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (!isMerchantWithdrawReference(payout.gateFiOrderId)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'Seules les demandes en attente peuvent être annulées' },
        { status: 400 },
      );
    }

    if (payout.balanceFrozenAt && !payout.balanceDebitedAt) {
      await PayoutLifecycle.onFailed(userId, payout.id, payout.amountCents, {
        finalStatus: 'CANCELLED',
      });
    } else {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: 'CANCELLED', errorMessage: 'Annulé par l\'utilisateur' },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'MERCHANT_WITHDRAW_CANCELLED',
        details: {
          payoutId,
          amountCents: payout.amountCents,
          ipAddress: getClientIP(request),
        },
      },
    });

    return NextResponse.json({ success: true, status: 'CANCELLED' });
  } catch (error) {
    console.error('[MERCHANT_WITHDRAW] cancel error', error);
    return NextResponse.json({ error: 'Erreur lors de l\'annulation' }, { status: 500 });
  }
}
