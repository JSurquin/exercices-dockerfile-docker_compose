import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  calculateSepaFees,
  calculateCardFees,
  getPayoutLimits,
  centsToEur,
  flexifyLog,
} from '@/lib/flexify';
import { safeParseJson } from '@/lib/validation/helpers';
import { flexifyQuoteBodySchema } from '@/lib/validation/schemas/integrations';

const LOG = (step: string, data?: object) => {
  flexifyLog(`QUOTE_API_${step}`, (data ?? {}) as Record<string, unknown>);
};

// =============================================================================
// POST - Devis pour un payout SEPA ou Carte (Flexify uniquement)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    LOG('START', {});
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      LOG('AUTH_FAIL', {});
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    LOG('SESSION_OK', { userId: session.user.id });

    const raw = await request.json();
    const parsed = safeParseJson(raw, flexifyQuoteBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data as Record<string, any>;
    const rawMethod = body.method;
    const amountCents = body.amountCents ?? body.amount;
    const method =
      typeof rawMethod === 'string'
        ? rawMethod.toUpperCase()
        : String(rawMethod ?? '').toUpperCase();

    LOG('BODY_RECEIVED', { method, amountCents, bodyKeys: Object.keys(body) });

    if (!method || !['SEPA', 'CARD'].includes(method)) {
      LOG('METHOD_INVALID', { method });
      return NextResponse.json(
        { error: 'Méthode invalide. Pour Flexify utilisez SEPA ou CARD. Pour la crypto, utilisez /api/whitepay/quote.' },
        { status: 400 }
      );
    }

    if (amountCents == null || Number(amountCents) <= 0) {
      LOG('AMOUNT_INVALID', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const amount = Number(amountCents);
    const limits = getPayoutLimits((method === 'SEPA' ? 'sepa' : 'card') as 'sepa' | 'card');

    if (amount < limits.minCents) {
      LOG('AMOUNT_TOO_LOW', { amount, min: limits.minCents });
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (amount > limits.maxCents) {
      LOG('AMOUNT_TOO_HIGH', { amount, max: limits.maxCents });
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

    LOG('QUOTE_CALCULATED', { method, amountCents: amount, netCents });
    return NextResponse.json({
      quote,
      limits: {
        minCents: limits.minCents,
        maxCents: limits.maxCents,
      },
    });
  } catch (error) {
    flexifyLog('QUOTE_API_ERROR', { error: String(error) }, 'error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du calcul du devis' },
      { status: 500 }
    );
  }
}

