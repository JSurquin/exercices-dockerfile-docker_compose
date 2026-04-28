import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getOnRampQuote, type OnRampQuoteParams } from '@/lib/gatefi-onramp';
import { safeParseJson } from '@/lib/validation/helpers';
import { gatefiQuoteBodySchema } from '@/lib/validation/schemas/integrations';

/**
 * POST /api/gatefi/onramp/quote
 * Obtient un devis pour un paiement crypto
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, gatefiQuoteBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { fiatAmount, crypto, region } = parsed.data;

    // Obtenir le devis
    const params: OnRampQuoteParams = {
      fiatAmount,
      crypto,
      region,
    };

    const quote = await getOnRampQuote(params);

    return NextResponse.json({
      success: true,
      quote,
      requestedAmount: fiatAmount,
      crypto,
      region,
    });
  } catch (error) {
    console.error('[GateFi OnRamp Quote] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

