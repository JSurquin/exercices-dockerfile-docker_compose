import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  calculateSepaFees,
  calculateCardFees,
  getPayoutLimits,
  centsToEur,
} from '@/lib/flexify';

// =============================================================================
// POST - Obtenir un devis pour un payout
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { method, amountCents } = body;

    // Validation
    if (!method || !['SEPA', 'CARD'].includes(method)) {
      return NextResponse.json(
        { error: 'Méthode de paiement invalide. Utilisez SEPA ou CARD.' },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    // Vérifier les limites
    const limits = getPayoutLimits(method);
    if (amountCents < limits.minCents) {
      return NextResponse.json(
        {
          error: `Montant minimum: ${centsToEur(limits.minCents)}€`,
          limits: {
            min: limits.minCents,
            max: limits.maxCents,
          },
        },
        { status: 400 }
      );
    }
    if (amountCents > limits.maxCents) {
      return NextResponse.json(
        {
          error: `Montant maximum: ${centsToEur(limits.maxCents)}€`,
          limits: {
            min: limits.minCents,
            max: limits.maxCents,
          },
        },
        { status: 400 }
      );
    }

    // Calculer les frais
    const fees = method === 'SEPA' 
      ? calculateSepaFees(amountCents) 
      : calculateCardFees(amountCents);

    const netCents = amountCents - fees.totalFeeCents;

    // Estimer le délai de livraison
    const estimatedDelivery = method === 'SEPA'
      ? '1-2 jours ouvrés' // SEPA: 1-2 jours
      : 'Instantané à 24h';  // Carte: instant à 24h

    return NextResponse.json({
      quote: {
        method,
        amountCents,
        fees: {
          processingCents: fees.processingFeeCents,
          networkCents: fees.networkFeeCents,
          totalCents: fees.totalFeeCents,
        },
        netCents,
        estimatedDelivery,
        currency: 'EUR',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      },
      limits: {
        minCents: limits.minCents,
        maxCents: limits.maxCents,
      },
    });
  } catch (error) {
    console.error('[Flexify Quote] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul du devis' },
      { status: 500 }
    );
  }
}

