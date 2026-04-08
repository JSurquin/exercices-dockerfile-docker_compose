import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { getTransactionStatus, convertWhitepayStatus } from '@/lib/whitepay';

// =============================================================================
// GET - Récupérer le statut d'une transaction Whitepay
// =============================================================================

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const payoutId = searchParams.get('payoutId');

    if (!payoutId) {
      return NextResponse.json(
        { error: 'payoutId requis' },
        { status: 400 }
      );
    }

    // 2. Trouver le payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        paymentMethod: true,
        trade: {
          select: {
            id: true,
            ticketId: true,
            grossCents: true,
            netCents: true,
          },
        },
      },
    });

    if (!payout || payout.userId !== userId) {
      return NextResponse.json(
        { error: 'Payout introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    // 3. Si la transaction Whitepay existe, récupérer le statut en temps réel
    let whitepayData = null;
    if (payout.whitepayTransactionId) {
      try {
        const statusResponse = await getTransactionStatus(payout.whitepayTransactionId);
        const tx = statusResponse.transaction;

        // Mise à jour informative uniquement si le statut a changé.
        // Le débit de solde, trade update et XP sont gérés UNIQUEMENT par le webhook
        // pour éviter tout double débit en cas de poll concurrent.
        if (tx.status !== payout.whitepayStatus) {
          const newInternalStatus = convertWhitepayStatus(tx.status);
          await prisma.payout.updateMany({
            where: {
              id: payoutId,
              whitepayStatus: { not: tx.status },
            },
            data: {
              whitepayStatus: tx.status,
              whitepayTxHash: tx.tx_hash || payout.whitepayTxHash,
              status: newInternalStatus as never,
              ...(tx.status === 'COMPLETE' && { paidAt: new Date() }),
            },
          });
        }

        whitepayData = {
          transactionId: tx.id,
          status: tx.status,
          exchangeRate: tx.exchange_rate,
          targetValue: tx.target_value,
          targetCurrency: tx.target_currency?.ticker,
          fee: tx.fee,
          txHash: tx.tx_hash,
          confirmations: tx.confirmations,
          network: tx.network,
          address: tx.address,
          createdAt: tx.created_at,
          completedAt: tx.completed_at,
        };
      } catch (error) {
        console.error('[Whitepay Status] Error fetching from API:', error);
        // Retourner les données en cache si l'API échoue
        whitepayData = {
          transactionId: payout.whitepayTransactionId,
          status: payout.whitepayStatus,
          exchangeRate: payout.whitepayExchangeRate,
          targetValue: payout.whitepayTargetValue,
          targetCurrency: payout.whitepayTargetCurrency,
          fee: payout.whitepayFee,
          txHash: payout.whitepayTxHash,
          network: payout.whitepayNetwork,
          address: payout.whitepayAddress,
          cached: true,
        };
      }
    }

    return NextResponse.json({
      payout: {
        id: payout.id,
        status: payout.status,
        amountCents: payout.amountCents,
        processingFeeCents: payout.processingFeeCents,
        networkFeeCents: payout.networkFeeCents,
        createdAt: payout.createdAt,
        paidAt: payout.paidAt,
        trade: payout.trade,
      },
      whitepay: whitepayData,
    });
  } catch (error) {
    console.error('[Whitepay Status] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}
