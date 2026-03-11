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
import { debitBalance } from '@/lib/balance-service';

// =============================================================================
// POST - Webhook Whitepay (general webhooks : withdrawals & conversion_withdrawals)
// =============================================================================
// Header de signature : "Signature" (HMAC-SHA256 du body re-sérialisé, slashes échappés)
// event_type : "withdrawal::completed" | "withdrawal::declined"
//            | "conversion_withdrawal::completed" | "conversion_withdrawal::declined"
//            | "order::*" | "transaction::*" | "rollback::*" → ignorés
// =============================================================================

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  // Le header s'appelle "Signature" selon la doc officielle Whitepay
  const signature = request.headers.get('Signature') || '';

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Whitepay Webhook] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Valider la signature : HMAC-SHA256(JSON.stringify(body).replace(/\//g, "\\/"), token)
  const signatureValid = validateWebhookSignature(payload, signature);

  if (!signatureValid) {
    console.error('[Whitepay Webhook] Invalid signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  const pl = payload as Record<string, unknown>;
  console.log('[Whitepay Webhook] Callback received:', {
    event_type: pl.event_type,
    keys: Object.keys(pl),
    transactionId: pl.transaction && typeof pl.transaction === 'object' && (pl.transaction as Record<string, unknown>).id,
  });

  try {
    // ————— Events non-withdrawal (orders, transactions, rollbacks) → on log et on ignore —————
    if (isWhitepayTopUpEvent(payload)) {
      console.log('[Whitepay Webhook] Non-withdrawal event (audit only):', {
        event_type: payload.event_type,
      });
      return NextResponse.json({ received: true, type: 'non_withdrawal' });
    }

    // ————— Withdrawal / Conversion_withdrawal : mise à jour du payout —————
    if (!isWhitepayWithdrawalEvent(payload)) {
      console.warn('[Whitepay Webhook] Unknown event shape, acknowledging:', {
        keys: Object.keys(payload as object),
        event_type: (payload as Record<string, unknown>).event_type,
      });
      return NextResponse.json({ received: true });
    }

    const { transaction: tx, event_type } = payload as WhitepayWebhookPayload;

    console.log('[Whitepay Webhook] Withdrawal update:', {
      event_type,
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

    // 5. Si la transaction est complète, mettre à jour le trade, débiter le solde et les stats
    if (isTransactionComplete(tx.status)) {
      // Mettre à jour le trade uniquement s'il y en a un associé
      if (payout.tradeId) {
        await prisma.trade.update({
          where: { id: payout.tradeId },
          data: { status: 'PAID' },
        });
      }

      // Débiter le solde utilisateur dans tous les cas (avec ou sans tradeId)
      try {
        await debitBalance(
          payout.userId,
          payout.amountCents,
          `Payout Whitepay ${payout.id} complété`,
          { type: 'WITHDRAWAL', payoutId: payout.id }
        );
      } catch (balanceErr) {
        console.error('[Whitepay Webhook] debitBalance error:', balanceErr, { payoutId: payout.id });
        // Ne pas bloquer le webhook — le payout est déjà confirmé côté Whitepay
      }

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
