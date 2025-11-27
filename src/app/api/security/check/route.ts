import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { securityService } from '@/lib/security-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { type, amountCents, paymentMethodId } = body;

    // Récupère l'IP du client
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    let securityCheck;

    if (type === 'trade') {
      securityCheck = await securityService.checkTradeEligibility(session.user.id, ipAddress);
    } else if (type === 'payout') {
      if (!amountCents || !paymentMethodId) {
        return NextResponse.json({ 
          error: 'Montant et méthode de paiement requis pour vérification payout' 
        }, { status: 400 });
      }

      securityCheck = await securityService.checkPayoutEligibility(
        session.user.id,
        amountCents,
        paymentMethodId,
        ipAddress
      );
    } else {
      return NextResponse.json({ error: 'Type de vérification invalide' }, { status: 400 });
    }

    // Vérifie aussi le statut de cooldown
    const cooldownStatus = await securityService.getUserCooldownStatus(session.user.id);

    return NextResponse.json({
      allowed: securityCheck.allowed && !cooldownStatus.inCooldown,
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

