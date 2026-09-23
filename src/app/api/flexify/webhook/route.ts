import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { isProductionApp } from '@/lib/env-production';
import {
  validateWebhookSignature,
  convertFlexifyStatus,
  isTransactionCompleted,
  isTransactionFailed,
  flexifyLog,
  buildFlexifyWebhookIdempotencyKey,
  type FlexifyWebhookPayload,
} from '@/lib/flexify';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import {
  ensureWebhookIdempotency,
  markWebhookProcessed,
} from '@/lib/webhook-idempotency';
import {
  buildWebhookAuditBase,
  extractFlexifyWebhookMeta,
  logIntegrationWebhookCall,
  type FlexifyWebhookMeta,
} from '@/lib/integration-webhook-audit';

async function auditFlexifyCall(
  request: NextRequest,
  baseAudit: ReturnType<typeof buildWebhookAuditBase>,
  meta: FlexifyWebhookMeta,
  details: {
    outcome: Parameters<typeof logIntegrationWebhookCall>[2]['outcome'];
    httpStatus: number;
    webhookId?: string;
    payoutId?: string;
    internalStatus?: string;
    errorMessage?: string;
    digestPresent?: boolean;
    dateHeaderPresent?: boolean;
    duplicateProcessedAt?: string;
  },
  userId?: string
) {
  await logIntegrationWebhookCall(
    'flexify',
    request,
    {
      ...baseAudit,
      ...meta,
      ...details,
    },
    userId
  );
}

export async function POST(request: NextRequest) {
  let webhookId: string | null = null;
  let flexifyMeta: FlexifyWebhookMeta = {};

  const rawBody = await request.text();
  const authorizationHeader =
    request.headers.get('Authorization') ||
    request.headers.get('Signature') ||
    request.headers.get('X-Signature') ||
    '';
  const digestHeader = request.headers.get('Digest') || '';
  const dateHeader = request.headers.get('Date') || '';
  const hostHeader =
    request.headers.get('Host') ||
    request.headers.get('X-Forwarded-Host') ||
    '';
  const contentLengthHeader = request.headers.get('Content-Length') || String(Buffer.byteLength(rawBody, 'utf8'));
  const baseAudit = buildWebhookAuditBase(request, rawBody, authorizationHeader.length > 0);

  try {
    flexifyLog('WEBHOOK_RECEIVED', { hasBody: true, bodyLength: rawBody.length });

    const isDeployedEnv = isProductionApp() || process.env.VERCEL_ENV === 'preview';
    const skipVerify = process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true' && !isDeployedEnv;

    if (isDeployedEnv && process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true') {
      flexifyLog(
        'WEBHOOK_SKIP_VERIFY_IGNORED_ON_DEPLOYED',
        { message: 'FLEXIFY_WEBHOOK_SKIP_VERIFY=true ignoré sur environnement déployé — vérification signature forcée.' },
        'error'
      );
    }

    if (!skipVerify && dateHeader) {
      const webhookDate = new Date(dateHeader).getTime();
      if (Number.isNaN(webhookDate) || Math.abs(Date.now() - webhookDate) > 5 * 60 * 1000) {
        await auditFlexifyCall(request, baseAudit, flexifyMeta, {
          outcome: 'stale_date',
          httpStatus: 401,
          digestPresent: digestHeader.length > 0,
          dateHeaderPresent: true,
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
      await auditFlexifyCall(request, baseAudit, flexifyMeta, {
        outcome: 'invalid_signature',
        httpStatus: 401,
        digestPresent: digestHeader.length > 0,
        dateHeaderPresent: dateHeader.length > 0,
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: FlexifyWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      await auditFlexifyCall(request, baseAudit, flexifyMeta, {
        outcome: 'invalid_json',
        httpStatus: 400,
      });
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    flexifyMeta = extractFlexifyWebhookMeta(payload);
    const flexifyId = payload.identifier ?? payload.transaction_id;
    webhookId = buildFlexifyWebhookIdempotencyKey(flexifyId, payload.reference, payload.status);

    const idempotency = await ensureWebhookIdempotency(webhookId, 'flexify_payout');
    if (!idempotency.allowed) {
      await auditFlexifyCall(request, baseAudit, flexifyMeta, {
        outcome: 'duplicate',
        httpStatus: 200,
        webhookId,
        duplicateProcessedAt: idempotency.existingEvent?.processedAt?.toISOString(),
      });
      return NextResponse.json({
        received: true,
        message: 'Webhook already processed (idempotency)',
      });
    }

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
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: 'Payout not found',
        data: { reference: payload.reference, flexifyId },
      });
      await auditFlexifyCall(request, baseAudit, flexifyMeta, {
        outcome: 'payout_not_found',
        httpStatus: 200,
        webhookId,
      });
      return NextResponse.json({ received: true });
    }

    const newStatus = convertFlexifyStatus(payload.status);
    const alreadyPaid = payout.status === 'PAID' || payout.status === 'FLEXIFY_PAID';

    // Jamais rétrograder un payout déjà payé (webhook « failed » tardif / Revolut).
    if (alreadyPaid && !isTransactionCompleted(payload.status)) {
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: true,
        data: { payoutId: payout.id, skipped: true, reason: 'already_paid' },
      });
      await auditFlexifyCall(
        request,
        baseAudit,
        flexifyMeta,
        {
          outcome: 'skipped',
          httpStatus: 200,
          webhookId,
          payoutId: payout.id,
          internalStatus: payout.status,
        },
        payout.userId
      );
      return NextResponse.json({ received: true, processed: true });
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        txId: flexifyId,
        flexifyPayoutId: flexifyId,
        paymentReference: payload.reference,
      },
    });

    try {
      if (isTransactionCompleted(payload.status)) {
        const wasFailed = payout.status === 'FAILED' || payout.status === 'FLEXIFY_FAILED';
        if (wasFailed) {
          await PayoutLifecycle.correctFailedToPaid(
            payout.userId,
            payout.id,
            payout.amountCents,
            {
              tradeId: payout.tradeId,
              reason: `Payout Flexify ${payout.id} corrigé FAILED→PAID (webhook success)`,
            },
          );
        } else {
          await PayoutLifecycle.onCompleted(
            payout.userId,
            payout.id,
            payout.amountCents,
            {
              tradeId: payout.tradeId,
              reason: `Payout Flexify ${payout.id} complété (webhook)`,
              finalStatus: newStatus,
              paidAt: new Date(),
            }
          );
        }
      } else if (isTransactionFailed(payload.status)) {
        // Ne pas rembourser tout de suite : Revolut/émetteur peut afficher un échec
        // puis créditer. Le solde reste gelé jusqu'à confirmation (24h) via reconcile.
        if (!alreadyPaid) {
          await prisma.payout.updateMany({
            where: { id: payout.id, status: { notIn: ['PAID', 'FLEXIFY_PAID'] } },
            data: {
              errorMessage:
                payload.error_reason
                || (payload.error_code != null ? `Flexify error ${payload.error_code}` : undefined)
                || `Flexify ${payload.status} — confirmation pending`,
            },
          });
        }
      } else {
        await prisma.payout.updateMany({
          where: {
            id: payout.id,
            status: { notIn: ['PAID', 'FAILED', 'FLEXIFY_PAID', 'FLEXIFY_FAILED'] },
          },
          data: {
            status: newStatus as 'PENDING' | 'PENDING_APPROVAL' | 'VERIFICATION_REQUIRED' | 'VERIFIED' | 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED',
          },
        });
      }
    } catch (lifecycleErr) {
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr),
        data: { payoutId: payout.id, flexifyStatus: payload.status },
      });
      await auditFlexifyCall(
        request,
        baseAudit,
        flexifyMeta,
        {
          outcome: 'error',
          httpStatus: 500,
          webhookId,
          payoutId: payout.id,
          internalStatus: newStatus,
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

    await auditFlexifyCall(
      request,
      baseAudit,
      flexifyMeta,
      {
        outcome: 'processed',
        httpStatus: 200,
        webhookId,
        payoutId: payout.id,
        internalStatus: newStatus,
      },
      payout.userId
    );

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

    await auditFlexifyCall(request, baseAudit, flexifyMeta, {
      outcome: 'error',
      httpStatus: 500,
      webhookId: webhookId ?? undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
