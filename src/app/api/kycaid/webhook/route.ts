import { NextRequest, NextResponse } from 'next/server';
import {
  validateWebhookSignature,
  processWebhook,
  type KycaidWebhookPayload,
} from '@/lib/kycaid';
import { isProductionApp } from '@/lib/env-production';

// =============================================================================
// POST - Recevoir les webhooks KYCAID (auth par X-Signature + secret, pas de session)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Signature') ||
      request.headers.get('x-signature') ||
      '';

    const webhookSecret = process.env.KYCAID_WEBHOOK_SECRET;
    const isPlaceholderSecret =
      !webhookSecret || webhookSecret === 'your-kycaid-webhook-secret';

    // SÉCURITÉ: Bloquer le webhook si le secret n'est pas configuré, même hors prod
    if (isPlaceholderSecret) {
      console.error(
        '[KYCAID Webhook] KYCAID_WEBHOOK_SECRET requis (production et développement).'
      );
      console.error(
        '[KYCAID Webhook] Le webhook est BLOQUÉ pour éviter les failles de sécurité.'
      );
      console.error(
        '[KYCAID Webhook] Configurez KYCAID_WEBHOOK_SECRET depuis le dashboard KYCAID.'
      );
      return NextResponse.json(
        { error: 'Webhook not configured (secret required)' },
        { status: 503 }
      );
    }
    
    // Vérifier la signature
    if (!validateWebhookSignature(rawBody, signature)) {
      console.error(
        '[KYCAID Webhook] Invalid signature — check KYCAID_WEBHOOK_SECRET in .env'
      );
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
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

