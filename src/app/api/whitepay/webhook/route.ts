import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignature,
  convertWhitepayStatus,
  isTransactionComplete,
  isTransactionFailed,
  isWhitepayWithdrawalEvent,
  isWhitepayTopUpEvent,
  type WhitepayWebhookPayload,
} from '@/lib/whitepay';

// =============================================================================
// POST - Webhook Whitepay (une seule URL pour deposits ET withdrawals)
// =============================================================================
// Whitepay peut envoyer :
// 1) Withdrawals (payouts) : event withdrawal.status_changed + transaction → on met à jour le Payout.
// 2) Top-up (deposits) : "Final Amount Received" (transaction_received_total, received_currency) →
//    le compte merchant est crédité côté Whitepay ; on log et on répond 200.
// Répondre toujours 200 pour les événements reconnus pour éviter les retries.
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature') || '';
    const timestamp = request.headers.get('X-Timestamp') || '';

    if (!validateWebhookSignature(rawBody, signature, timestamp)) {
      console.error('[Whitepay Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('[Whitepay Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // ————— Événement Top-Up (deposit) : Final Amount Received —————
    if (isWhitepayTopUpEvent(payload)) {
      console.log('[Whitepay Webhook] Top-up / deposit received:', {
        transaction_received_total: payload.transaction_received_total,
        received_currency: payload.received_currency,
        event: (payload as Record<string, unknown>).event,
      });
      return NextResponse.json({ received: true, type: 'top_up' });
    }

    // ————— Événement Withdrawal (payout) : mise à jour de statut —————
    if (!isWhitepayWithdrawalEvent(payload)) {
      console.warn('[Whitepay Webhook] Unknown event shape, acknowledging:', {
        keys: Object.keys(payload as object),
        event: (payload as Record<string, unknown>).event,
      });
      return NextResponse.json({ received: true });
    }

    const { transaction: tx } = payload as WhitepayWebhookPayload;

    console.log('[Whitepay Webhook] Withdrawal update:', {
      event: (payload as WhitepayWebhookPayload).event,
      transactionId: tx.id,
      status: tx.status,
      txHash: tx.tx_hash,
    });

    const payout = await prisma.payout.findFirst({
      where: { whitepayTransactionId: tx.id },
      include: {
        user: { select: { id: true, email: true } },
        trade: true,
      },
    });

    if (!payout) {
      console.warn('[Whitepay Webhook] Payout not found for transaction:', tx.id);
      // Retourner 200 pour éviter les re-tentatives
      return NextResponse.json({ received: true });
    }

    // 3. Convertir le statut Whitepay vers notre statut interne
    const newInternalStatus = convertWhitepayStatus(tx.status);

    // 4. Mettre à jour le payout
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: newInternalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'WHITEPAY_WAITING_CONFIRMATION' | 'WHITEPAY_PENDING_WITHDRAWAL' | 'WHITEPAY_PROCESSING_WITHDRAWAL' | 'WHITEPAY_COMPLETE' | 'WHITEPAY_DECLINED',
        whitepayStatus: tx.status,
        whitepayTxHash: tx.tx_hash || payout.whitepayTxHash,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        txId: tx.tx_hash || payout.txId,
        ...(isTransactionComplete(tx.status) && { paidAt: new Date() }),
      },
    });

    // 5. Si la transaction est complète, mettre à jour le trade et les stats
    if (isTransactionComplete(tx.status) && payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'PAID' },
      });

      // Mettre à jour le volume et XP de l'utilisateur
      await prisma.user.update({
        where: { id: payout.userId },
        data: {
          totalVolumeCents: {
            increment: payout.amountCents,
          },
          xp: {
            increment: Math.floor(payout.amountCents / 100),
          },
        },
      });
    }

    // 6. Si la transaction a échoué, marquer le trade
    if (isTransactionFailed(tx.status) && payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'FAILED' },
      });
    }

    // 7. Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId: payout.userId,
        action: `WHITEPAY_WEBHOOK_${tx.status}`,
        details: {
          payoutId: payout.id,
          whitepayTransactionId: tx.id,
          oldStatus: payout.whitepayStatus,
          newStatus: tx.status,
          internalStatus: newInternalStatus,
          txHash: tx.tx_hash,
          confirmations: tx.confirmations,
          exchangeRate: tx.exchange_rate,
          targetValue: tx.target_value,
          fee: tx.fee,
        },
      },
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Whitepay Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
