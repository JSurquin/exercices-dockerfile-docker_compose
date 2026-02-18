import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignatureByEvent,
  validateWebhookSignatureWithEitherToken,
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
// 1) Withdrawals (payouts) : event withdrawal.status_changed → on met à jour le Payout.
// 2) Top-up (deposits) : "Final Amount Received" = WhitePay nous notifie que notre
//    compte merchant a été alimenté (on a envoyé de l'USDC sur leur wallet).
//    On ne crédite aucun user : notre système c'est du payout (solde = ventes skins).
//    On log pour audit et on répond 200. Ne jamais ignorer le callback.
// =============================================================================

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('X-Whitepay-Signature') ||
    request.headers.get('X-Signature') ||
    '';

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Whitepay Webhook] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Vérifier la signature avec le token correspondant au type d'événement
  const isDeposit = isWhitepayTopUpEvent(payload);
  const isWithdrawal = isWhitepayWithdrawalEvent(payload);
  const signatureValid = isDeposit
    ? validateWebhookSignatureByEvent(rawBody, signature, true)
    : isWithdrawal
      ? validateWebhookSignatureByEvent(rawBody, signature, false)
      : validateWebhookSignatureWithEitherToken(rawBody, signature);

  if (!signatureValid) {
    console.error('[Whitepay Webhook] Invalid signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // ————— Audit : loguer tous les callbacks (même doublons) —————
  const pl = payload as Record<string, unknown>;
  console.log('[Whitepay Webhook] Callback received:', {
    event: pl.event,
    keys: Object.keys(pl),
    transactionId: pl.transaction && typeof pl.transaction === 'object' && (pl.transaction as Record<string, unknown>).id,
  });

  try {
    // ————— Top-up : notification que notre compte merchant WhitePay a été alimenté —————
    // Pas de crédit user : le solde chez nous vient des ventes skins ; WhitePay sert au payout.
    if (isWhitepayTopUpEvent(payload)) {
      const p = payload as Record<string, unknown>;
      console.log('[Whitepay Webhook] Merchant top-up received (audit only):', {
        transaction_received_total: p.transaction_received_total,
        received_currency: p.received_currency,
        event: p.event,
      });
      return NextResponse.json({ received: true, type: 'top_up' });
    }

    // ————— Withdrawal (payout) : mise à jour de statut —————
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
