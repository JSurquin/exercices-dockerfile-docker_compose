import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getOffRampQuote, type OffRampQuoteParams } from '@/lib/gatefi-offramp';

/**
 * POST /api/gatefi/offramp/quote
 * Obtient un devis pour un paiement SEPA
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

    const body = await request.json();
    const { fiatAmount, crypto, region } = body;

    // Validation
    if (!fiatAmount || !crypto || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: fiatAmount, crypto, region' },
        { status: 400 }
      );
    }

    if (typeof fiatAmount !== 'number' || fiatAmount <= 0) {
      return NextResponse.json(
        { error: 'fiatAmount must be a positive number (in cents)' },
        { status: 400 }
      );
    }

    // Obtenir le devis
    const params: OffRampQuoteParams = {
      fiatAmount,
      crypto,
      region,
    };

    const quote = await getOffRampQuote(params);

    return NextResponse.json({
      success: true,
      quote,
      requestedAmount: fiatAmount,
      crypto,
      region,
    });
  } catch (error) {
    console.error('[GateFi OffRamp Quote] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get quote',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

