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
  markWebhookProcessed 
} from '@/lib/webhook-idempotency';

// =============================================================================
// POST - Recevoir les webhooks Flexify
// =============================================================================

export async function POST(request: NextRequest) {
  let webhookId: string | null = null;
  
  try {
    flexifyLog('WEBHOOK_RECEIVED', { hasBody: true });
    const rawBody = await request.text();

    // SÉCURITÉ: Ne pas logger tous les headers (risque de fuite de secrets)
    // On ne log que les headers nécessaires à la signature
    const relevantHeaders = {
      authorization: request.headers.get('Authorization') || request.headers.get('Signature') || '',
      digest: request.headers.get('Digest') || '',
      date: request.headers.get('Date') || '',
      host: request.headers.get('Host') || request.headers.get('X-Forwarded-Host') || '',
      contentLength: request.headers.get('Content-Length') || '',
    };
    flexifyLog('WEBHOOK_HEADERS', { headers: relevantHeaders });

    // Flexify peut envoyer la signature dans Authorization ou dans un header Signature dédié
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

    const isDeployedEnv = isProductionApp() || process.env.VERCEL_ENV === 'preview';
    const skipVerify = process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true' && !isDeployedEnv;

    if (isDeployedEnv && process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true') {
      flexifyLog(
        'WEBHOOK_SKIP_VERIFY_BLOCKED',
        { message: 'FLEXIFY_WEBHOOK_SKIP_VERIFY interdit sur les environnements déployés' },
        'error'
      );
      return NextResponse.json(
        { error: 'Webhook verification misconfigured' },
        { status: 503 }
      );
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
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    flexifyLog(skipVerify ? 'WEBHOOK_SIGNATURE_SKIPPED' : 'WEBHOOK_SIGNATURE_VALID', {});

    const payload: FlexifyWebhookPayload = JSON.parse(rawBody);
    // "identifier" est le champ ID Flexify dans la doc (ex: "PT000000000000K")
    // "transaction_id" est l'alias interne — on normalise ici pour la suite
    const flexifyId = payload.identifier ?? payload.transaction_id;
    webhookId = flexifyId || payload.reference;
    
    // SÉCURITÉ: Vérifier l'idempotence AVANT tout traitement
    // Empêche le double débit si le webhook est rejoué
    const idempotency = await ensureWebhookIdempotency(webhookId, 'flexify_payout');
    if (!idempotency.allowed) {
      flexifyLog('WEBHOOK_ALREADY_PROCESSED', {
        webhookId,
        existingEventId: idempotency.existingEvent?.id,
        processedAt: idempotency.existingEvent?.processedAt,
      }, 'info');
      return NextResponse.json({ 
        received: true, 
        message: 'Webhook already processed (idempotency)' 
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

    // Trouver le payout : en priorité par notre référence interne (gateFiOrderId),
    // en fallback par l'ID Flexify (identifier) déjà stocké en DB
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
      // Marquer comme traité même si payout non trouvé (éviter rejouage infini)
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: 'Payout not found',
        data: { reference: payload.reference, flexifyId },
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
      return NextResponse.json({ received: true, processed: true });
    }

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

    // Logger l'événement (non-critique : ne doit pas bloquer le webhook)
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

    // SÉCURITÉ: Marquer le webhook comme traité avec succès (idempotence)
    await markWebhookProcessed(webhookId, 'flexify_payout', {
      success: true,
      data: {
        payoutId: payout.id,
        reference: payload.reference,
        newStatus,
        flexifyStatus: payload.status,
      },
    });

    flexifyLog('WEBHOOK_PROCESSED', { reference: payload.reference, newStatus });
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    flexifyLog('WEBHOOK_ERROR', { error: String(error) }, 'error');
    
    // Marquer comme échec si on a un webhookId
    if (webhookId) {
      await markWebhookProcessed(webhookId, 'flexify_payout', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }).catch(err => {
        console.error('Failed to mark webhook as failed:', err);
      });
    }
    
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

