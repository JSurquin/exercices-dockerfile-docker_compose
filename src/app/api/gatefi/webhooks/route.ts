import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/gatefi';
import { processSumsubWebhook, validateSumsubWebhookSignature } from '@/lib/gatefi-kyc';
import { prisma } from '~/prisma/prisma';

/**
 * POST /api/gatefi/webhooks
 * Reçoit les webhooks de GateFi et Sumsub
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature') || '';
    const webhookType = request.headers.get('x-webhook-type') || 'gatefi';
    
    const bodyText = await request.text();
    
    // Valider la signature selon le type de webhook
    let isValid = false;
    
    if (webhookType === 'sumsub') {
      isValid = validateSumsubWebhookSignature(bodyText, signature);
    } else {
      isValid = validateWebhookSignature(bodyText, signature);
    }
    
    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(bodyText);

    // Traiter selon le type de webhook
    if (webhookType === 'sumsub') {
      // Webhook Sumsub pour KYC
      await processSumsubWebhook(payload);
      
      return NextResponse.json({ success: true, message: 'KYC webhook processed' });
    } else {
      // Webhook GateFi pour les paiements
      await processGateFiWebhook(payload);
      
      return NextResponse.json({ success: true, message: 'Payment webhook processed' });
    }
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Traite un webhook GateFi
 */
async function processGateFiWebhook(payload: any): Promise<void> {
  const { orderCustomId, status, orderType, txHash } = payload;

  if (!orderCustomId) {
    console.error('[GateFi Webhook] No orderCustomId provided');
    return;
  }

  // Trouver le payout correspondant
  const payout = await prisma.payout.findFirst({
    where: { gateFiOrderId: orderCustomId },
  });

  if (!payout) {
    console.error('[GateFi Webhook] Payout not found:', orderCustomId);
    return;
  }

  // Mettre à jour le statut selon le webhook
  let newStatus: string = payout.status;
  let paidAt: Date | undefined;

  if (status === 'COMPLETED') {
    newStatus = 'PAID';
    paidAt = new Date();
  } else if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELED') {
    newStatus = 'FAILED';
  } else if (status === 'PROCESSING') {
    newStatus = 'PROCESSING';
  }

  // Mettre à jour le payout
  await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: newStatus as any,
      ...(txHash && { txId: txHash, paymentReference: txHash }),
      ...(paidAt && { paidAt }),
      updatedAt: new Date(),
    },
  });

  console.log('[GateFi Webhook] Payout updated:', {
    payoutId: payout.id,
    orderCustomId,
    oldStatus: payout.status,
    newStatus,
    orderType,
  });
}

