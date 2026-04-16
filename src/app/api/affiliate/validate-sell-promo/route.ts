import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { AffiliateService } from '@/lib/affiliate-service';

/**
 * Vérifie qu’un code saisi sur /sell correspond à un affilié actif
 * (même code que le lien affilié).
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ valid: false, error: 'unauthorized' }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
  if (!code) {
    return NextResponse.json({ valid: false, error: 'empty' });
  }

  const result = await AffiliateService.validateAffiliateSellPromoCode(session.user.id, code);
  if (!result.ok) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  return NextResponse.json({ valid: true, code: result.code });
}
