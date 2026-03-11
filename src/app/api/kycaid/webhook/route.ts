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

    const webhookSecret = process.env.KYCAID_WEBHOOK_SECRET;
    const isPlaceholderSecret = !webhookSecret || webhookSecret === 'your-kycaid-webhook-secret';

    if (!isPlaceholderSecret) {
      // Valider la signature uniquement si un vrai secret est configuré
      if (!validateWebhookSignature(rawBody, signature)) {
        console.error('[KYCAID Webhook] Invalid signature — check KYCAID_WEBHOOK_SECRET in .env');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[KYCAID Webhook] ⚠️  Signature validation skipped — KYCAID_WEBHOOK_SECRET not configured. Set the real secret from the KYCAID dashboard.');
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

