import { NextRequest, NextResponse } from 'next/server';
import { getOffRampConfiguration } from '@/lib/gatefi-offramp';
import { getOnRampConfiguration } from '@/lib/gatefi-onramp';

/**
 * GET /api/gatefi/configuration
 * Récupère les configurations OffRamp et OnRamp
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'offramp' | 'onramp' | 'all'

    if (type === 'offramp') {
      const config = await getOffRampConfiguration();
      return NextResponse.json(config);
    }

    if (type === 'onramp') {
      const config = await getOnRampConfiguration();
      return NextResponse.json(config);
    }

    // Par défaut, retourner les deux
    const [offrampConfig, onrampConfig] = await Promise.all([
      getOffRampConfiguration(),
      getOnRampConfiguration(),
    ]);

    return NextResponse.json({
      offramp: offrampConfig,
      onramp: onrampConfig,
    });
  } catch (error) {
    console.error('[GateFi Configuration] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

