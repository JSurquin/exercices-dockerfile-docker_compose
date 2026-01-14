import { NextRequest, NextResponse } from 'next/server';
import {
  validateWebhookSignature,
  processWebhook,
  type KycaidWebhookPayload,
} from '@/lib/kycaid';

// =============================================================================
// POST - Recevoir les webhooks KYCAID
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature') || 
                      request.headers.get('x-signature') || '';

    // Valider la signature si configurée
    if (process.env.KYCAID_WEBHOOK_SECRET) {
      if (!validateWebhookSignature(rawBody, signature)) {
        console.error('[KYCAID Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: KycaidWebhookPayload = JSON.parse(rawBody);

    console.log('[KYCAID Webhook] Received:', {
      type: payload.type,
      applicantId: payload.applicant_id,
      verificationId: payload.verification_id,
      status: payload.status,
      verified: payload.verified,
    });

    // Traiter le webhook
    await processWebhook(payload);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[KYCAID Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

