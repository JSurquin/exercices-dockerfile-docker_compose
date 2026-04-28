import { NextRequest, NextResponse } from 'next/server';
import { getOffRampConfiguration } from '@/lib/gatefi-offramp';
import { getOnRampConfiguration } from '@/lib/gatefi-onramp';
import { auth } from '~/lib/auth';

/**
 * GET /api/gatefi/configuration
 * Récupère les configurations OffRamp et OnRamp (côté GateFi, authentifiées clé partenaire).
 * Ici on exige un utilisateur connecté pour ne pas exposer le détail partenaire au monde entier.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

