import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  calculateWhitepayFees,
  estimateNetworkFeeCents,
  getWhitepayLimits,
  isWhitepayCryptoNetworkSupported,
  isUserPayoutTickerAllowed,
  centsToEur,
  WhitepayApiError,
  formatWhitepayApiErrorMessage,
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
    const targetCurrency =
      typeof body.targetCurrency === 'string' ? body.targetCurrency.toUpperCase() : undefined;
    const network =
      typeof body.network === 'string' ? body.network.toUpperCase() : undefined;

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

    if (targetCurrency && !isUserPayoutTickerAllowed(targetCurrency)) {
      LOG('✗ USDT retiré des retraits utilisateur', { targetCurrency });
      return NextResponse.json(
        {
          error: "USDT n'est plus proposé pour les retraits. Choisissez USDC sur le réseau Polygon.",
          code: 'CRYPTO_USDT_DISABLED',
        },
        { status: 400 }
      );
    }

    if (targetCurrency && network && !isWhitepayCryptoNetworkSupported(targetCurrency, network)) {
      LOG('✗ Combinaison crypto/réseau non supportée', { targetCurrency, network });
      return NextResponse.json(
        { error: `Réseau ${network} non supporté pour ${targetCurrency}` },
        { status: 400 }
      );
    }

    let networkFeeCents = 0;
    if (targetCurrency && network) {
      try {
        networkFeeCents = await estimateNetworkFeeCents(targetCurrency, network);
      } catch (error) {
        const message =
          error instanceof WhitepayApiError
            ? formatWhitepayApiErrorMessage(error)
            : error instanceof Error
              ? error.message
              : 'Devis indisponible';
        LOG('✗ Frais Whitepay indisponibles', { targetCurrency, network, message });
        return NextResponse.json(
          { error: message, quoteUnavailable: true },
          { status: 502 }
        );
      }
    }

    const fees = calculateWhitepayFees(amount, networkFeeCents);
    const netCents = amount - fees.totalFeeCents;

    const quote = {
      method: 'CRYPTO',
      amountCents: amount,
      targetCurrency: targetCurrency ?? null,
      network: network ?? null,
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
      feeSource: 'live' as const,
      networkFeeIsEstimate: true,
    };

    LOG('✓ Devis crypto calculé', { amountCents: amount, netCents, networkFeeCents });
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
