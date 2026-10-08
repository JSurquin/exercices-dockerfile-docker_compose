import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  confirmWithdrawal,
  isRateValid,
  convertWhitepayStatus,
} from '@/lib/whitepay';
import { safeParseJson } from '@/lib/validation/helpers';
import { whitepayPayoutTransactionBodySchema } from '@/lib/validation/schemas/integrations';
import { jsonWithAskReview } from '@/lib/review-prompt';

// =============================================================================
// POST - Confirmer un retrait Whitepay (dans les 30 secondes)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const raw = await request.json();
    const parsed = safeParseJson(raw, whitepayPayoutTransactionBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { payoutId, transactionId } = parsed.data;

    // 2. Trouver le payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout || payout.userId !== userId) {
      return NextResponse.json(
        { error: 'Payout introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    if (payout.whitepayTransactionId !== transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID ne correspond pas' },
        { status: 400 }
      );
    }

    // 3. Vérifier que le payout est en attente de confirmation
    if (payout.status !== 'WHITEPAY_WAITING_CONFIRMATION') {
      return NextResponse.json(
        { error: 'Ce payout n\'est pas en attente de confirmation', currentStatus: payout.status },
        { status: 400 }
      );
    }

    // 4. Vérifier si le taux est encore valide (< 30 secondes)
    const rateStillValid = payout.whitepayEstimatedAt
      ? isRateValid(payout.whitepayEstimatedAt.toISOString())
      : false;

    // 5. Confirmer via Whitepay (avec auto-refresh si expiré)
    const confirmResponse = await confirmWithdrawal(transactionId, true);
    const tx = confirmResponse.transaction;

    // 6. Mettre à jour le payout en base
    const newStatus = convertWhitepayStatus(tx.status);

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: newStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'WHITEPAY_WAITING_CONFIRMATION' | 'WHITEPAY_PENDING_WITHDRAWAL' | 'WHITEPAY_PROCESSING_WITHDRAWAL' | 'WHITEPAY_COMPLETE' | 'WHITEPAY_DECLINED',
        whitepayStatus: tx.status,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        whitepayConfirmedAt: new Date(),
      },
    });

    // 7. Mettre à jour le trade si associé
    if (payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'PAYOUT_PENDING' },
      });
    }

    // 8. Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WHITEPAY_WITHDRAWAL_CONFIRMED',
        details: {
          payoutId: payout.id,
          whitepayTransactionId: tx.id,
          rateWasRefreshed: !rateStillValid,
          newStatus: tx.status,
          exchangeRate: tx.exchange_rate,
          targetValue: tx.target_value,
        },
      },
    });

    return jsonWithAskReview(userId, { type: 'withdrawal', amount: payout.amountCents }, {
      success: true,
      payout: {
        id: payout.id,
        status: newStatus,
      },
      whitepay: {
        transactionId: tx.id,
        status: tx.status,
        exchangeRate: tx.exchange_rate,
        targetValue: tx.target_value,
        fee: tx.fee,
        rateWasRefreshed: !rateStillValid,
      },
    });
  } catch (error) {
    console.error('[Whitepay Confirm] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la confirmation du retrait' },
      { status: 500 }
    );
  }
}
