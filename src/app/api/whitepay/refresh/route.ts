import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { refreshWithdrawal } from '@/lib/whitepay';
import { safeParseJson } from '@/lib/validation/helpers';
import { whitepayPayoutTransactionBodySchema } from '@/lib/validation/schemas/integrations';

// =============================================================================
// POST - Rafraîchir le taux d'un retrait Whitepay expiré
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
        { error: 'Seuls les payouts en attente de confirmation peuvent être rafraîchis' },
        { status: 400 }
      );
    }

    // 4. Appeler Whitepay pour rafraîchir le taux
    const refreshResponse = await refreshWithdrawal(transactionId);
    const tx = refreshResponse.transaction;

    // 5. Mettre à jour le payout avec le nouveau taux
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        whitepayEstimatedAt: new Date(tx.estimated_at),
      },
    });

    // 6. Logger
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WHITEPAY_RATE_REFRESHED',
        details: {
          payoutId: payout.id,
          whitepayTransactionId: tx.id,
          oldRate: payout.whitepayExchangeRate,
          newRate: tx.exchange_rate,
          oldTargetValue: payout.whitepayTargetValue,
          newTargetValue: tx.target_value,
        },
      },
    });

    return NextResponse.json({
      success: true,
      whitepay: {
        transactionId: tx.id,
        exchangeRate: tx.exchange_rate,
        targetValue: tx.target_value,
        fee: tx.fee,
        estimatedAt: tx.estimated_at,
        /** Nouveau délai de 30 secondes */
        expiresAt: new Date(new Date(tx.estimated_at).getTime() + 30_000).toISOString(),
      },
    });
  } catch (error) {
    console.error('[Whitepay Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du rafraîchissement du taux' },
      { status: 500 }
    );
  }
}
