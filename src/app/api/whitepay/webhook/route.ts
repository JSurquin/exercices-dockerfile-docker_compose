import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignature,
  validateWebhookSignatureRaw,
  convertWhitepayStatus,
  isTransactionComplete,
  isTransactionFailed,
  isWhitepayWithdrawalEvent,
  isWhitepayTopUpEvent,
  type WhitepayWebhookPayload,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import {
  ensureWebhookIdempotency,
  markWebhookProcessed,
} from '@/lib/webhook-idempotency';

// =============================================================================
// POST - Webhook Whitepay (general webhooks : withdrawals & conversion_withdrawals)
// =============================================================================
// Header de signature : "Signature" (HMAC-SHA256 du body re-sérialisé, slashes échappés)
// event_type : "withdrawal::completed" | "withdrawal::declined"
//            | "conversion_withdrawal::completed" | "conversion_withdrawal::declined"
//            | "order::*" | "transaction::*" | "rollback::*" → ignorés
// =============================================================================

export async function POST(request: NextRequest) {
  let webhookId: string | null = null;

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

  // Whitepay signe : HMAC-SHA256(JSON.stringify(req.body).replace(/\//g, "\\/"), secret)
  // On tente 2 stratégies pour couvrir les différences de sérialisation :
  //   1. body re-sérialisé (comportement attendu par la doc)
  //   2. rawBody tel que reçu (cas où Whitepay signe le corps brut sans re-sérialisation)
  const signatureValid =
    validateWebhookSignature(payload, signature) ||
    validateWebhookSignatureRaw(rawBody, signature);

  if (!signatureValid) {
    const token = process.env.WHITEPAY_WEBHOOK_TOKEN_WITHDRAWAL ?? process.env.WHITEPAY_WEBHOOK_TOKEN ?? '';
    console.error('[Whitepay Webhook] Invalid signature', {
      signatureHeader: signature ? signature.slice(0, 16) + '...' : '(empty)',
      tokenConfigured: !!token,
      tokenPrefix: token ? token.slice(0, 8) + '...' : '(empty)',
      rawBodyLength: rawBody.length,
    });
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

    webhookId = `wp_${tx.id}_${tx.status}`;

    console.log('[Whitepay Webhook] Withdrawal update:', {
      event_type,
      transactionId: tx.id,
      status: tx.status,
      txHash: tx.tx_hash,
      webhookId,
    });

    // Idempotence : empêche le double traitement si Whitepay rejoue le webhook
    const idempotency = await ensureWebhookIdempotency(webhookId, 'whitepay_withdrawal');
    if (!idempotency.allowed) {
      console.log('[Whitepay Webhook] Already processed (idempotency):', {
        webhookId,
        processedAt: idempotency.existingEvent?.processedAt,
      });
      return NextResponse.json({ received: true, message: 'Webhook already processed (idempotency)' });
    }

    // Récupérer le payout pour avoir les données nécessaires aux actions suivantes
    const payout = await prisma.payout.findFirst({
      where: { whitepayTransactionId: tx.id },
      include: {
        user: { select: { id: true, email: true } },
        trade: true,
      },
    });

    if (!payout) {
      console.warn('[Whitepay Webhook] Payout not found for transaction:', tx.id);
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: 'Payout not found',
        data: { transactionId: tx.id },
      });
      return NextResponse.json({ received: true });
    }

    // Convertir le statut Whitepay vers notre statut interne
    const newInternalStatus = convertWhitepayStatus(tx.status);

    // Idempotence atomique sur le payout : on tente l'update uniquement si le payout n'est pas déjà final
    const updated = await prisma.payout.updateMany({
      where: {
        id: payout.id,
        whitepayStatus: { notIn: ['COMPLETE', 'DECLINED'] },
      },
      data: {
        status: newInternalStatus as never,
        whitepayStatus: tx.status,
        whitepayTxHash: tx.tx_hash || payout.whitepayTxHash,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        txId: tx.tx_hash || payout.txId,
        ...(isTransactionComplete(tx.status) && { paidAt: new Date() }),
      },
    });

    if (updated.count === 0) {
      console.log('[Whitepay Webhook] Already in final state, skipping:', {
        payoutId: payout.id,
        incomingStatus: tx.status,
      });
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: true,
        data: { payoutId: payout.id, skipped: true, reason: 'already_final' },
      });
      return NextResponse.json({ received: true, processed: true });
    }

    try {
      if (isTransactionComplete(tx.status)) {
        const { debited } = await PayoutLifecycle.onCompleted(
          payout.userId, payout.id, payout.amountCents,
          {
            tradeId: payout.tradeId,
            reason: `Payout Whitepay ${payout.id} complété (webhook)`,
            finalStatus: newInternalStatus,
            paidAt: new Date(),
          },
        );
        if (!debited) {
          console.warn(`[Whitepay Webhook] Debit already done or failed for payout ${payout.id}`);
        }
      }

      if (isTransactionFailed(tx.status)) {
        await PayoutLifecycle.onFailed(payout.userId, payout.id, payout.amountCents, {
          tradeId: payout.tradeId,
          finalStatus: newInternalStatus,
        });
      }
    } catch (lifecycleErr) {
      console.error(`[Whitepay Webhook] PayoutLifecycle error for payout ${payout.id}:`, lifecycleErr);
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
        data: { payoutId: payout.id, txStatus: tx.status },
      });
      return NextResponse.json({ error: 'Lifecycle error' }, { status: 500 });
    }

    // Logger l'événement (non-critique : ne doit pas bloquer le webhook)
    try {
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
    } catch (auditErr) {
      console.error(`[Whitepay Webhook] auditLog.create failed for payout ${payout.id}:`, auditErr);
    }

    await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
      success: true,
      data: {
        payoutId: payout.id,
        transactionId: tx.id,
        newStatus: newInternalStatus,
        whitepayStatus: tx.status,
      },
    });

    console.log('[Whitepay Webhook] Processed successfully:', {
      payoutId: payout.id,
      newStatus: newInternalStatus,
      txHash: tx.tx_hash,
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Whitepay Webhook] Error:', error);
    if (webhookId) {
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }).catch((err) => console.error('[Whitepay Webhook] Failed to mark webhook as failed:', err));
    }
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
