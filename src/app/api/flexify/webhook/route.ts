import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  validateWebhookSignature,
  convertFlexifyStatus,
  isPayoutCompleted,
  isPayoutFailed,
  type FlexifyWebhookPayload,
} from '@/lib/flexify';

// =============================================================================
// POST - Recevoir les webhooks Flexify
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature') || '';
    const timestamp = request.headers.get('X-Timestamp') || '';

    // Valider la signature
    if (!validateWebhookSignature(rawBody, signature, timestamp)) {
      console.error('[Flexify Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: FlexifyWebhookPayload = JSON.parse(rawBody);

    console.log('[Flexify Webhook] Received:', {
      eventType: payload.eventType,
      payoutId: payload.payoutId,
      orderId: payload.orderId,
      status: payload.status,
    });

    // Trouver le payout correspondant
    const payout = await prisma.payout.findFirst({
      where: { gateFiOrderId: payload.orderId },
      include: {
        user: { select: { id: true, email: true } },
        trade: true,
      },
    });

    if (!payout) {
      console.warn('[Flexify Webhook] Payout not found:', payload.orderId);
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
        txId: payload.transactionId,
        paymentReference: payload.payoutId,
        ...(isPayoutCompleted(payload.status) && { paidAt: new Date() }),
      },
    });

    // Si le payout est complété, mettre à jour le trade
    if (isPayoutCompleted(payload.status) && payout.tradeId) {
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
    if (isPayoutFailed(payload.status) && payout.tradeId) {
      await prisma.trade.update({
        where: { id: payout.tradeId },
        data: { status: 'FAILED' },
      });
    }

    // Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId: payout.userId,
        action: `PAYOUT_${payload.eventType.toUpperCase().replace('.', '_')}`,
        details: {
          payoutId: payout.id,
          orderId: payload.orderId,
          flexifyId: payload.payoutId,
          oldStatus: payout.status,
          newStatus,
          transactionId: payload.transactionId,
          errorMessage: payload.errorMessage,
          fees: payload.fees,
        },
      },
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Flexify Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

