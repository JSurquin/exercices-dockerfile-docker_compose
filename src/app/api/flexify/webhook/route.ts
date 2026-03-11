import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignature,
  convertFlexifyStatus,
  isTransactionCompleted,
  isTransactionFailed,
  flexifyLog,
  type FlexifyWebhookPayload,
} from '@/lib/flexify';
import { debitBalance } from '@/lib/balance-service';

// =============================================================================
// POST - Recevoir les webhooks Flexify
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    flexifyLog('WEBHOOK_RECEIVED', { hasBody: true });
    const rawBody = await request.text();

    // Log tous les headers reçus pour diagnostiquer les problèmes de signature
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => { allHeaders[key] = value; });
    flexifyLog('WEBHOOK_HEADERS', { headers: allHeaders });

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

    const skipVerify = process.env.FLEXIFY_WEBHOOK_SKIP_VERIFY === 'true';

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
      return NextResponse.json({ received: true });
    }
    flexifyLog('WEBHOOK_PAYOUT_FOUND', { payoutId: payout.id, reference: payload.reference });

    const newStatus = convertFlexifyStatus(payload.status);
    flexifyLog('WEBHOOK_STATUS_UPDATE', {
      reference: payload.reference,
      flexifyStatus: payload.status,
      newStatus,
    });

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: newStatus as 'PENDING' | 'PENDING_APPROVAL' | 'VERIFICATION_REQUIRED' | 'VERIFIED' | 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED',
        txId: flexifyId,
        flexifyPayoutId: flexifyId,
        paymentReference: payload.reference,
        ...(isTransactionCompleted(payload.status) && { paidAt: new Date() }),
      },
    });

    // Si le payout est complété
    if (isTransactionCompleted(payload.status)) {
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
          `Payout Flexify ${payout.id} complété`,
          { type: 'WITHDRAWAL', payoutId: payout.id }
        );
      } catch (balanceErr) {
        flexifyLog('WEBHOOK_DEBIT_BALANCE_ERROR', { payoutId: payout.id, error: String(balanceErr) }, 'error');
        // Ne pas bloquer le webhook — le payout est déjà marqué PAID côté Flexify
      }

      // Mettre à jour le volume total de l'utilisateur
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

    // Si le payout a échoué
    if (isTransactionFailed(payload.status) && payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'FAILED' },
      });
    }

    // Logger l'événement
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

    flexifyLog('WEBHOOK_PROCESSED', { reference: payload.reference, newStatus });
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    flexifyLog('WEBHOOK_ERROR', { error: String(error) }, 'error');
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

