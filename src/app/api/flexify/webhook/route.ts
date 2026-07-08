import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { isProductionApp } from '@/lib/env-production';
import {
  validateWebhookSignature,
  convertFlexifyStatus,
  isTransactionCompleted,
  isTransactionFailed,
  flexifyLog,
  type FlexifyWebhookPayload,
} from '@/lib/flexify';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import {
  ensureWebhookIdempotency,
  markWebhookProcessed,
} from '@/lib/webhook-idempotency';
import { logIntegrationWebhookCall } from '@/lib/integration-webhook-audit';

// =============================================================================
// POST - Recevoir les webhooks Flexify
// =============================================================================

function extractFlexifyMeta(payload: unknown): {
  reference?: string;
  transactionId?: string;
  flexifyStatus?: string;
  eventType?: string;
} {
  if (!payload || typeof payload !== 'object') return {};
  const pl = payload as Record<string, unknown>;
  const reference = typeof pl.reference === 'string' ? pl.reference : undefined;
  const transactionId =
    typeof pl.identifier === 'string'
      ? pl.identifier
      : typeof pl.transaction_id === 'string'
        ? pl.transaction_id
        : undefined;
  const flexifyStatus = typeof pl.status === 'string' ? pl.status : undefined;
  const eventType = typeof pl.type === 'string' ? pl.type : undefined;
  return { reference, transactionId, flexifyStatus, eventType };
}

export async function POST(request: NextRequest) {
  let webhookId: string | null = null;
  const baseAudit = {
    signaturePresent: false,
    bodyLength: 0,
  };

  try {
    flexifyLog('WEBHOOK_RECEIVED', { hasBody: true });
    const rawBody = await request.text();
    baseAudit.bodyLength = rawBody.length;

    // SÉCURITÉ: Ne pas logger tous les headers (risque de fuite de secrets)
    const relevantHeaders = {
      authorization: request.headers.get('Authorization') || request.headers.get('Signature') || '',
      digest: request.headers.get('Digest') || '',
      date: request.headers.get('Date') || '',
      host: request.headers.get('Host') || request.headers.get('X-Forwarded-Host') || '',
      contentLength: request.headers.get('Content-Length') || '',
    };
    flexifyLog('WEBHOOK_HEADERS', { headers: relevantHeaders });

    const authorizationHeader =
      request.headers.get('Authorization') ||
      request.headers.get('Signature') ||
      request.headers.get('X-Signature') ||
      '';
    baseAudit.signaturePresent = authorizationHeader.length > 0;

    const digestHeader = request.headers.get('Digest') || '';
    const dateHeader = request.headers.get('Date') || '';
    const hostHeader =
      request.headers.get('Host') ||
      request.headers.get('X-Forwarded-Host') ||
      '';
    const contentLengthHeader = request.headers.get('Content-Length') || String(Buffer.byteLength(rawBody, 'utf8'));

    const isDeployedEnv = isProductionApp() || process.env.VERCEL_ENV === 'preview';
    const skipVerify = process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true' && !isDeployedEnv;

    if (isDeployedEnv && process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true') {
      flexifyLog(
        'WEBHOOK_SKIP_VERIFY_IGNORED_ON_DEPLOYED',
        { message: 'FLEXIFY_WEBHOOK_SKIP_VERIFY=true ignoré sur environnement déployé — vérification signature forcée. Supprimer cette variable d\'env sur le serveur.' },
        'error'
      );
    }

    if (!skipVerify && dateHeader) {
      const webhookDate = new Date(dateHeader).getTime();
      if (Number.isNaN(webhookDate) || Math.abs(Date.now() - webhookDate) > 5 * 60 * 1000) {
        flexifyLog('WEBHOOK_STALE_DATE', { dateHeader }, 'error');
        await logIntegrationWebhookCall('flexify', request, {
          ...baseAudit,
          outcome: 'stale_date',
          httpStatus: 401,
          errorMessage: `Stale or invalid Date header: ${dateHeader}`,
        });
        return NextResponse.json({ error: 'Webhook expired or invalid date' }, { status: 401 });
      }
    }

    const isValid = skipVerify || validateWebhookSignature(
      rawBody,
      authorizationHeader,
      digestHeader,
      dateHeader,
      hostHeader,
      contentLengthHeader
    );

    if (!isValid) {
      flexifyLog('WEBHOOK_SIGNATURE_INVALID', {
        authorizationHeader: authorizationHeader.slice(0, 60),
        digestHeader,
        dateHeader,
        hostHeader,
      }, 'error');
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        outcome: 'invalid_signature',
        httpStatus: 401,
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    flexifyLog(skipVerify ? 'WEBHOOK_SIGNATURE_SKIPPED' : 'WEBHOOK_SIGNATURE_VALID', {});

    let payload: FlexifyWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        outcome: 'invalid_json',
        httpStatus: 400,
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventMeta = extractFlexifyMeta(payload);
    const flexifyId = payload.identifier ?? payload.transaction_id;
    webhookId = flexifyId || payload.reference;

    const idempotency = await ensureWebhookIdempotency(webhookId, 'flexify_payout');
    if (!idempotency.allowed) {
      flexifyLog('WEBHOOK_ALREADY_PROCESSED', {
        webhookId,
        existingEventId: idempotency.existingEvent?.id,
        processedAt: idempotency.existingEvent?.processedAt,
      }, 'info');
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        ...eventMeta,
        outcome: 'duplicate',
        httpStatus: 200,
      });
      return NextResponse.json({
        received: true,
        message: 'Webhook already processed (idempotency)',
      });
    }

    flexifyLog('WEBHOOK_PAYLOAD', {
      flexifyId,
      reference: payload.reference,
      status: payload.status,
      amount: payload.amount,
      method: payload.method,
      type: payload.type,
    });

    let payout = await prisma.payout.findFirst({
      where: { gateFiOrderId: payload.reference },
      include: {
        user: { select: { id: true, email: true } },
        trade: true,
      },
    });
    if (!payout && flexifyId) {
      payout = await prisma.payout.findFirst({
        where: { flexifyPayoutId: flexifyId },
        include: {
          user: { select: { id: true, email: true } },
          trade: true,
        },
      });
    }

    if (!payout) {
      flexifyLog('WEBHOOK_PAYOUT_NOT_FOUND', { reference: payload.reference, flexifyId }, 'warn');
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: 'Payout not found',
        data: { reference: payload.reference, flexifyId },
      });
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        ...eventMeta,
        outcome: 'payout_not_found',
        httpStatus: 200,
      });
      return NextResponse.json({ received: true });
    }
    flexifyLog('WEBHOOK_PAYOUT_FOUND', { payoutId: payout.id, reference: payload.reference });

    const newStatus = convertFlexifyStatus(payload.status);
    flexifyLog('WEBHOOK_STATUS_UPDATE', {
      reference: payload.reference,
      flexifyStatus: payload.status,
      newStatus,
    });

    const statusUpdate = await prisma.payout.updateMany({
      where: {
        id: payout.id,
        status: { notIn: ['PAID', 'FAILED'] },
      },
      data: {
        status: newStatus as 'PENDING' | 'PENDING_APPROVAL' | 'VERIFICATION_REQUIRED' | 'VERIFIED' | 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED',
        txId: flexifyId,
        flexifyPayoutId: flexifyId,
        paymentReference: payload.reference,
        ...(isTransactionCompleted(payload.status) && { paidAt: new Date() }),
      },
    });

    if (statusUpdate.count === 0) {
      flexifyLog('WEBHOOK_ALREADY_FINAL', { payoutId: payout.id, currentStatus: payout.status, incomingStatus: payload.status }, 'info');
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: true,
        data: { payoutId: payout.id, skipped: true, reason: 'already_final' },
      });
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        ...eventMeta,
        payoutId: payout.id,
        outcome: 'skipped',
        httpStatus: 200,
      }, payout.userId);
      return NextResponse.json({ received: true, processed: true });
    }

    try {
      if (isTransactionCompleted(payload.status)) {
        const { debited } = await PayoutLifecycle.onCompleted(
          payout.userId, payout.id, payout.amountCents,
          {
            tradeId: payout.tradeId,
            reason: `Payout Flexify ${payout.id} complété (webhook)`,
            finalStatus: newStatus,
            paidAt: new Date(),
          },
        );
        if (!debited) {
          flexifyLog('WEBHOOK_DEBIT_ALREADY_DONE', { payoutId: payout.id }, 'info');
        }
      }

      if (isTransactionFailed(payload.status)) {
        await PayoutLifecycle.onFailed(payout.userId, payout.id, payout.amountCents, {
          tradeId: payout.tradeId,
          finalStatus: newStatus,
        });
      }
    } catch (lifecycleErr) {
      flexifyLog('WEBHOOK_LIFECYCLE_ERROR', {
        payoutId: payout.id,
        status: payload.status,
        error: String(lifecycleErr),
      }, 'error');
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
        data: { payoutId: payout.id, flexifyStatus: payload.status },
      });
      await logIntegrationWebhookCall('flexify', request, {
        ...baseAudit,
        ...eventMeta,
        payoutId: payout.id,
        outcome: 'error',
        httpStatus: 500,
        errorMessage: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
      }, payout.userId);
      return NextResponse.json({ error: 'Lifecycle error' }, { status: 500 });
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: payout.userId,
          action: `FLEXIFY_WEBHOOK_${payload.status.toUpperCase()}`,
          details: {
            payoutId: payout.id,
            reference: payload.reference,
            flexifyTransactionId: flexifyId,
            oldStatus: payout.status,
            newStatus,
            amount: payload.amount,
            method: payload.method,
            errorCode: payload.error_code,
            errorReason: payload.error_reason,
            sepaDetails: payload.sepa,
          },
        },
      });
    } catch (auditErr) {
      console.error(`[Flexify Webhook] auditLog.create failed for payout ${payout.id}:`, auditErr);
    }

    await markWebhookProcessed(webhookId, 'flexify_payout', {
      success: true,
      data: {
        payoutId: payout.id,
        reference: payload.reference,
        newStatus,
        flexifyStatus: payload.status,
      },
    });

    await logIntegrationWebhookCall('flexify', request, {
      ...baseAudit,
      ...eventMeta,
      payoutId: payout.id,
      outcome: 'processed',
      httpStatus: 200,
    }, payout.userId);

    flexifyLog('WEBHOOK_PROCESSED', { reference: payload.reference, newStatus });
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    flexifyLog('WEBHOOK_ERROR', { error: String(error) }, 'error');

    if (webhookId) {
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }).catch((err) => {
        console.error('Failed to mark webhook as failed:', err);
      });
    }

    await logIntegrationWebhookCall('flexify', request, {
      ...baseAudit,
      outcome: 'error',
      httpStatus: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
