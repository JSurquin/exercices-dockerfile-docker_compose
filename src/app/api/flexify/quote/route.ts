import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  calculateSepaFees,
  calculateCardFees,
  getPayoutLimits,
  centsToEur,
} from '@/lib/flexify';

const LOG = (msg: string, data?: object) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PAYOUT QUOTE FLEXIFY] ${msg}`, data ?? '');
  }
};

// =============================================================================
// POST - Devis pour un payout SEPA ou Carte (Flexify uniquement)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    LOG('→ Début requête');
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      LOG('✗ Non authentifié');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    LOG('✓ Session OK', { userId: session.user.id });

    const body = await request.json();
    const rawMethod = body.method;
    const amountCents = body.amountCents ?? body.amount;
    const method = typeof rawMethod === 'string' ? rawMethod.toUpperCase() : rawMethod;

    LOG('Body reçu', { method, amountCents, bodyKeys: Object.keys(body) });

    if (!method || !['SEPA', 'CARD'].includes(method)) {
      LOG('✗ Méthode invalide (Flexify = SEPA ou CARD uniquement)', { method });
      return NextResponse.json(
        { error: 'Méthode invalide. Pour Flexify utilisez SEPA ou CARD. Pour la crypto, utilisez /api/whitepay/quote.' },
        { status: 400 }
      );
    }

    if (amountCents == null || Number(amountCents) <= 0) {
      LOG('✗ Montant invalide', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const amount = Number(amountCents);
    const limits = getPayoutLimits((method === 'SEPA' ? 'sepa' : 'card') as 'sepa' | 'card');

    if (amount < limits.minCents) {
      LOG('✗ Montant trop bas', { amount, min: limits.minCents });
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (amount > limits.maxCents) {
      LOG('✗ Montant trop élevé', { amount, max: limits.maxCents });
      return NextResponse.json(
        { error: `Montant maximum: ${centsToEur(limits.maxCents)}€` },
        { status: 400 }
      );
    }

    const fees = method === 'SEPA' ? calculateSepaFees(amount) : calculateCardFees(amount);
    const totalFeeCents = fees.totalFeeCents;
    const netCents = amount - totalFeeCents;
    const estimatedDelivery = method === 'SEPA' ? '1-2 jours ouvrés' : 'Instantané à 24h';

    const quote = {
      method,
      amountCents: amount,
      fees: {
        processingCents: fees.processingFeeCents,
        networkCents: fees.networkFeeCents,
        totalCents: totalFeeCents,
      },
      netCents,
      estimatedDelivery,
      currency: 'EUR',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      quoteId: `fx-quote-${Date.now()}-${session.user.id.slice(0, 8)}`,
    };

    LOG('✓ Devis Flexify calculé', { method, amountCents: amount, netCents });
    return NextResponse.json({
      quote,
      limits: {
        minCents: limits.minCents,
        maxCents: limits.maxCents,
      },
    });
  } catch (error) {
    console.error('[PAYOUT QUOTE FLEXIFY] Erreur', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du calcul du devis' },
      { status: 500 }
    );
  }
}

