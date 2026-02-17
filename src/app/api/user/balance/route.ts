import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getBalance } from '@/lib/balance-service';

/**
 * GET /api/user/balance
 * Retourne le solde de l'utilisateur connecté (centimes).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const balance = await getBalance(session.user.id);
    return NextResponse.json({
      balanceCents: balance.balanceCents,
      frozenBalanceCents: balance.frozenBalanceCents,
      availableCents: balance.availableCents,
      accountFrozen: balance.accountFrozen,
    });
  } catch (error) {
    console.error('[api/user/balance]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
