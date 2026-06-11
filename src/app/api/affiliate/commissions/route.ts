import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseSearchParams } from '@/lib/validation/helpers';
import { affiliateCommissionsQuerySchema } from '@/lib/validation/schemas/affiliate';

export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const q = safeParseSearchParams(searchParams, affiliateCommissionsQuerySchema, {
      errorStyle: 'affiliate',
    });
    if (!q.ok) {
      return q.response;
    }
    const { status } = q.data;

    const affiliate = await AffiliateService.getAffiliateStats(userId);

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }

    const commissions =
      affiliate.commissions?.filter((c) => {
        if (status === 'PENDING') {
          return c.status === 'PENDING' && !c.balanceCreditedAt;
        }
        return c.status === status;
      }) || [];

    return NextResponse.json({
      success: true,
      data: {
        commissions,
        totalAmount: commissions.reduce((sum, c) => sum + c.amountCents, 0),
        count: commissions.length,
      },
    });
  } catch (error) {
    console.error('Erreur récupération commissions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
