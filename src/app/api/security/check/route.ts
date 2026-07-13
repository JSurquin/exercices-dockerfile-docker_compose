import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { securityService } from '@/lib/security-service';
import { logger } from '@/lib/logger';
import { safeParseJson } from '@/lib/validation/helpers';
import { securityCheckPostSchema } from '@/lib/validation/schemas/chat-api';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }
    const parsed = safeParseJson(raw, securityCheckPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    // Récupère l'IP du client
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    let securityCheck;

    if (body.type === 'trade') {
      securityCheck = await securityService.checkTradeEligibility(session.user.id, ipAddress);
    } else {
      securityCheck = await securityService.checkPayoutEligibility(
        session.user.id,
        body.amountCents,
        body.paymentMethodId,
        ipAddress
      );
    }

    // Vérifie aussi le statut de cooldown
    const cooldownStatus = await securityService.getUserCooldownStatus(session.user.id);

    return NextResponse.json({
      allowed: (securityCheck.allowed || !!securityCheck.requiresManualVerification) && !cooldownStatus.inCooldown,
      requiresManualVerification: securityCheck.requiresManualVerification ?? false,
      reason: securityCheck.reason || cooldownStatus.reason,
      cooldownUntil: securityCheck.cooldownUntil || cooldownStatus.endsAt,
      currentUsage: securityCheck.currentUsage,
      limits: {
        maxTradesPerDay: 5,
        maxPayoutsPerDay: 3,
        maxPayoutAmountPerDay: 5000, // En euros pour l'affichage
      },
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification de sécurité', { error });
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

