import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  calculateWhitepayFees,
  getWhitepayLimits,
  centsToEur,
} from '@/lib/whitepay';
import { safeParseJson } from '@/lib/validation/helpers';
import { whitepayAmountBodySchema } from '@/lib/validation/schemas/integrations';

const LOG = (msg: string, data?: object) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PAYOUT QUOTE WHITEPAY] ${msg}`, data ?? '');
  }
};

// =============================================================================
// POST - Devis pour un retrait crypto (Whitepay uniquement)
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

    const raw = await request.json();
    const parsed = safeParseJson(raw, whitepayAmountBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;
    const amountCents = body.amountCents ?? body.amount;

    if (amountCents == null || Number(amountCents) <= 0) {
      LOG('✗ Montant invalide', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const amount = Number(amountCents);
    const limits = getWhitepayLimits();

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

    const fees = calculateWhitepayFees(amount);
    const netCents = amount - fees.totalFeeCents;

    const quote = {
      method: 'CRYPTO',
      amountCents: amount,
      fees: {
        processingCents: fees.processingFeeCents,
        networkCents: fees.networkFeeCents,
        totalCents: fees.totalFeeCents,
      },
      netCents,
      estimatedDelivery: 'Quelques minutes à 1h',
      currency: 'EUR',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      quoteId: `wp-quote-${Date.now()}-${session.user.id.slice(0, 8)}`,
    };

    LOG('✓ Devis crypto calculé', { amountCents: amount, netCents });
    return NextResponse.json({
      quote,
      limits: {
        minCents: limits.minCents,
        maxCents: limits.maxCents,
      },
    });
  } catch (error) {
    console.error('[PAYOUT QUOTE WHITEPAY] Erreur', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du calcul du devis crypto' },
      { status: 500 }
    );
  }
}
