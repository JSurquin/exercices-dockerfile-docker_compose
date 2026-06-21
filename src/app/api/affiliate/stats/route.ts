import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { computeAffiliateExtendedMetrics } from '@/lib/affiliate-metrics';
import { requireUserSession } from '@/lib/require-session-user';

export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;

    const stats = await AffiliateService.getAffiliateStats(userId);

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }

    const totalUncreditedCommissions =
      stats.commissions?.reduce((sum, commission) => {
        return commission.status === 'PENDING' && !commission.balanceCreditedAt
          ? sum + commission.amountCents
          : sum;
      }, 0) || 0;

    const totalCreditedCommissions =
      stats.commissions?.reduce((sum, commission) => {
        return commission.status === 'CREDITED' ? sum + commission.amountCents : sum;
      }, 0) || 0;

    const totalPaidCommissions =
      stats.commissions?.reduce((sum, commission) => {
        return commission.status === 'PAID' ? sum + commission.amountCents : sum;
      }, 0) || 0;

    const recentReferrals = stats.referrals?.slice(0, 10) || [];
    const extendedMetrics = await computeAffiliateExtendedMetrics(stats.id);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        metrics: {
          totalUncreditedCommissions,
          totalCreditedCommissions,
          totalPaidCommissions,
          totalPendingCommissions: totalUncreditedCommissions,
          conversionRate:
            stats.totalReferrals > 0
              ? (stats.referrals?.filter((r) => r.volumeCents > 0).length || 0) /
                stats.totalReferrals
              : 0,
          averageOrderValue:
            stats.totalReferrals > 0
              ? stats.totalVolumeCents / stats.totalReferrals
              : 0,
          ...extendedMetrics,
        },
        recentReferrals,
      },
    });
  } catch (error) {
    console.error('Erreur récupération stats affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
