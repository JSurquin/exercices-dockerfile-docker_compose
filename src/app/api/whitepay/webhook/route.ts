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
import {
  buildWebhookAuditBase,
  extractWhitepayWebhookMeta,
  logIntegrationWebhookCall,
  type WhitepayWebhookMeta,
} from '@/lib/integration-webhook-audit';

// =============================================================================
// POST - Webhook Whitepay (general webhooks : withdrawals & conversion_withdrawals)
// =============================================================================

async function auditWhitepayCall(
  request: NextRequest,
  baseAudit: ReturnType<typeof buildWebhookAuditBase>,
  meta: WhitepayWebhookMeta,
  details: {
    outcome: Parameters<typeof logIntegrationWebhookCall>[2]['outcome'];
    httpStatus: number;
    webhookId?: string;
    payoutId?: string;
    internalStatus?: string;
    errorMessage?: string;
    tokenConfigured?: boolean;
    duplicateProcessedAt?: string;
  },
  userId?: string
) {
  await logIntegrationWebhookCall(
    'whitepay',
    request,
    {
      ...baseAudit,
      ...meta,
      ...details,
    },
    userId
  );
}

async function findPayoutForWhitepayTransaction(tx: WhitepayWebhookPayload['transaction']) {
  const byTransactionId = await prisma.payout.findFirst({
    where: { whitepayTransactionId: tx.id },
    include: {
      user: { select: { id: true, email: true } },
      trade: true,
    },
  });
  if (byTransactionId) return byTransactionId;

  const externalId = tx.external_id;
  if (!externalId) return null;

  return prisma.payout.findFirst({
    where: {
      OR: [
        { gateFiOrderId: externalId },
        { paymentReference: externalId },
        { id: externalId },
      ],
    },
    include: {
      user: { select: { id: true, email: true } },
      trade: true,
    },
  });
}

export async function POST(request: NextRequest) {
  let webhookId: string | null = null;
  let eventMeta: WhitepayWebhookMeta = {};

  const rawBody = await request.text();
  const signature = request.headers.get('Signature') || '';
  const baseAudit = buildWebhookAuditBase(request, rawBody, signature.length > 0);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Whitepay Webhook] Invalid JSON body');
    await auditWhitepayCall(request, baseAudit, {}, { outcome: 'invalid_json', httpStatus: 400 });
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  eventMeta = extractWhitepayWebhookMeta(payload);

  const signatureValid =
    validateWebhookSignature(payload, signature) ||
    validateWebhookSignatureRaw(rawBody, signature);

  if (!signatureValid) {
    const token = process.env.WHITEPAY_WEBHOOK_TOKEN_WITHDRAWAL ?? process.env.WHITEPAY_WEBHOOK_TOKEN ?? '';
    console.error('[Whitepay Webhook] Invalid signature', {
      signatureHeader: signature ? signature.slice(0, 16) + '...' : '(empty)',
      tokenConfigured: !!token,
      rawBodyLength: rawBody.length,
    });
    await auditWhitepayCall(request, baseAudit, eventMeta, {
      outcome: 'invalid_signature',
      httpStatus: 401,
      tokenConfigured: !!token,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log('[Whitepay Webhook] Callback received:', eventMeta);

  try {
    if (isWhitepayTopUpEvent(payload)) {
      await auditWhitepayCall(request, baseAudit, eventMeta, {
        outcome: 'ignored',
        httpStatus: 200,
      });
      return NextResponse.json({ received: true, type: 'non_withdrawal' });
    }

    if (!isWhitepayWithdrawalEvent(payload)) {
      await auditWhitepayCall(request, baseAudit, eventMeta, {
        outcome: 'unknown_event',
        httpStatus: 200,
      });
      return NextResponse.json({ received: true });
    }

    const { transaction: tx, event_type } = payload as WhitepayWebhookPayload;
    eventMeta = {
      eventType: event_type,
      transactionId: tx.id,
      externalId: tx.external_id,
      whitepayStatus: tx.status,
      txHash: tx.tx_hash,
    };
    webhookId = `wp_${tx.id}_${tx.status}`;

    const idempotency = await ensureWebhookIdempotency(webhookId, 'whitepay_withdrawal');
    if (!idempotency.allowed) {
      await auditWhitepayCall(request, baseAudit, eventMeta, {
        outcome: 'duplicate',
        httpStatus: 200,
        webhookId,
        duplicateProcessedAt: idempotency.existingEvent?.processedAt?.toISOString(),
      });
      return NextResponse.json({ received: true, message: 'Webhook already processed (idempotency)' });
    }

    const payout = await findPayoutForWhitepayTransaction(tx);

    if (!payout) {
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: 'Payout not found',
        data: { transactionId: tx.id, externalId: tx.external_id },
      });
      await auditWhitepayCall(request, baseAudit, eventMeta, {
        outcome: 'payout_not_found',
        httpStatus: 200,
        webhookId,
      });
      return NextResponse.json({ received: true });
    }

    const newInternalStatus = convertWhitepayStatus(tx.status);

    const updated = await prisma.payout.updateMany({
      where: {
        id: payout.id,
        whitepayStatus: { notIn: ['COMPLETE', 'DECLINED'] },
      },
      data: {
        status: newInternalStatus as never,
        whitepayStatus: tx.status,
        whitepayTransactionId: payout.whitepayTransactionId ?? tx.id,
        whitepayTxHash: tx.tx_hash || payout.whitepayTxHash,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        txId: tx.tx_hash || payout.txId,
        ...(isTransactionComplete(tx.status) && { paidAt: new Date() }),
      },
    });

    if (updated.count === 0) {
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: true,
        data: { payoutId: payout.id, skipped: true, reason: 'already_final' },
      });
      await auditWhitepayCall(
        request,
        baseAudit,
        eventMeta,
        {
          outcome: 'skipped',
          httpStatus: 200,
          webhookId,
          payoutId: payout.id,
          internalStatus: newInternalStatus,
        },
        payout.userId
      );
      return NextResponse.json({ received: true, processed: true });
    }

    try {
      if (isTransactionComplete(tx.status)) {
        await PayoutLifecycle.onCompleted(
          payout.userId,
          payout.id,
          payout.amountCents,
          {
            tradeId: payout.tradeId,
            reason: `Payout Whitepay ${payout.id} complété (webhook)`,
            finalStatus: newInternalStatus,
            paidAt: new Date(),
          }
        );
      }

      if (isTransactionFailed(tx.status)) {
        await PayoutLifecycle.onFailed(payout.userId, payout.id, payout.amountCents, {
          tradeId: payout.tradeId,
          finalStatus: newInternalStatus,
        });
      }
    } catch (lifecycleErr) {
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
        data: { payoutId: payout.id, txStatus: tx.status },
      });
      await auditWhitepayCall(
        request,
        baseAudit,
        eventMeta,
        {
          outcome: 'error',
          httpStatus: 500,
          webhookId,
          payoutId: payout.id,
          internalStatus: newInternalStatus,
          errorMessage: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
        },
        payout.userId
      );
      return NextResponse.json({ error: 'Lifecycle error' }, { status: 500 });
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: payout.userId,
          action: `WHITEPAY_WEBHOOK_${tx.status}`,
          details: {
            payoutId: payout.id,
            whitepayTransactionId: tx.id,
            externalId: tx.external_id,
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

    await auditWhitepayCall(
      request,
      baseAudit,
      eventMeta,
      {
        outcome: 'processed',
        httpStatus: 200,
        webhookId,
        payoutId: payout.id,
        internalStatus: newInternalStatus,
      },
      payout.userId
    );

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Whitepay Webhook] Error:', error);
    if (webhookId) {
      await markWebhookProcessed(webhookId, 'whitepay_withdrawal', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }).catch((err) => console.error('[Whitepay Webhook] Failed to mark webhook as failed:', err));
    }
    await auditWhitepayCall(request, baseAudit, eventMeta, {
      outcome: 'error',
      httpStatus: 500,
      webhookId: webhookId ?? undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
