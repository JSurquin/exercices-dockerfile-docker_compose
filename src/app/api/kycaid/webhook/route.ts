import { NextRequest, NextResponse } from 'next/server';
import {
  processWebhook,
  type KycaidWebhookPayload,
} from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';

// =============================================================================
// POST - Recevoir les webhooks KYCAID
//
// KYCAID ne signe PAS ses callbacks avec un HMAC/X-Signature.
// La sécurité repose sur :
//  1. Le callback_url n'est connu que de KYCAID (configuré via l'API ou le dashboard).
//  2. On vérifie que l'applicant_id du payload correspond à un utilisateur en base.
//  3. On valide la structure du payload avant traitement.
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    let payload: KycaidWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logger.error('[KYCAID Webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validation basique du payload
    if (!payload.type || !payload.applicant_id) {
      logger.error('[KYCAID Webhook] Missing required fields (type, applicant_id)');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Vérifier que l'applicant_id correspond à un utilisateur connu
    const knownUser = await prisma.user.findFirst({
      where: { kycaidApplicantId: payload.applicant_id },
      select: { id: true },
    });

    if (!knownUser && !payload.external_applicant_id) {
      logger.warn('[KYCAID Webhook] Unknown applicant_id');
      return NextResponse.json({ error: 'Unknown applicant' }, { status: 404 });
    }

    logger.info(`[KYCAID Webhook] Received: type=${payload.type}, status=${payload.status}`);

    await processWebhook(payload);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    logger.error('[KYCAID Webhook] Error', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}

