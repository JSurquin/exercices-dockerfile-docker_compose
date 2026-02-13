import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignature,
  convertFlexifyStatus,
  isTransactionCompleted,
  isTransactionFailed,
  type FlexifyWebhookPayload,
} from '@/lib/flexify';

// =============================================================================
// POST - Recevoir les webhooks Flexify
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    
    // Récupérer les headers nécessaires pour la validation
    const authorizationHeader = request.headers.get('Authorization') || '';
    const digestHeader = request.headers.get('Digest') || '';
    const dateHeader = request.headers.get('Date') || '';
    const hostHeader = request.headers.get('Host') || '';
    const contentLengthHeader = request.headers.get('Content-Length') || '0';

    // Valider la signature selon la spec H2H
    const isValid = validateWebhookSignature(
      rawBody,
      authorizationHeader,
      digestHeader,
      dateHeader,
      hostHeader,
      contentLengthHeader
    );

    if (!isValid) {
      console.error('[Flexify Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: FlexifyWebhookPayload = JSON.parse(rawBody);

    console.log('[Flexify Webhook] Received:', {
      transactionId: payload.transaction_id,
      reference: payload.reference,
      status: payload.status,
      amount: payload.amount,
      method: payload.method,
    });

    // Trouver le payout correspondant par référence
    const payout = await prisma.payout.findFirst({
      where: { gateFiOrderId: payload.reference },
      include: {
        user: { select: { id: true, email: true } },
        trade: true,
      },
    });

    if (!payout) {
      console.warn('[Flexify Webhook] Payout not found:', payload.reference);
      // Retourner 200 pour éviter les re-tentatives
      return NextResponse.json({ received: true });
    }

    // Convertir le statut Flexify vers notre statut interne
    const newStatus = convertFlexifyStatus(payload.status);

    // Mettre à jour le payout
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: newStatus as 'PENDING' | 'VERIFICATION_REQUIRED' | 'VERIFIED' | 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED',
        txId: payload.transaction_id,
        flexifyPayoutId: payload.transaction_id,
        paymentReference: payload.reference,
        ...(isTransactionCompleted(payload.status) && { paidAt: new Date() }),
      },
    });

    // Si le payout est complété, mettre à jour le trade
    if (isTransactionCompleted(payload.status) && payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'PAID' },
      });

      // Mettre à jour le volume total de l'utilisateur
      await prisma.user.update({
        where: { id: payout.userId },
        data: {
          totalVolumeCents: {
            increment: payout.amountCents,
          },
          // Ajouter de l'XP (1 XP par euro)
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
          flexifyTransactionId: payload.transaction_id,
          oldStatus: payout.status,
          newStatus,
          amount: payload.amount,
          method: payload.method,
          sepaDetails: payload.sepa,
        },
      },
    });

    // Répondre avec 200 dans les 30 secondes (requis par Flexify)
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Flexify Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

