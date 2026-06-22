import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import {
  computeAffiliateExtendedMetrics,
  computeAffiliateAttributedTotals,
} from '@/lib/affiliate-metrics';
import {
  computeAffiliatePendingVolumeCents,
  loadPendingSalesByUserIds,
} from '@/lib/affiliate-referral-pending';
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
    const referralUserIds = recentReferrals
      .map((r) => r.referredUser?.id)
      .filter((id): id is string => !!id);

    const [extendedMetrics, attributedTotals, pendingVolumeCents, pendingSalesByUser] =
      await Promise.all([
        computeAffiliateExtendedMetrics(stats.id),
        computeAffiliateAttributedTotals(stats.id),
        computeAffiliatePendingVolumeCents(stats.id),
        loadPendingSalesByUserIds(referralUserIds),
      ]);

    const recentReferralsWithPending = recentReferrals.map((ref) => {
      const userId = ref.referredUser?.id;
      const pendingSale = userId ? pendingSalesByUser.get(userId) ?? null : null;
      return { ...ref, pendingSale };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        totalVolumeCents: attributedTotals.totalVolumeCents,
        totalCommissionCents: attributedTotals.totalCommissionCents,
        metrics: {
          totalUncreditedCommissions,
          totalCreditedCommissions,
          totalPaidCommissions,
          totalPendingCommissions: totalUncreditedCommissions,
          pendingVolumeCents,
          conversionRate:
            stats.totalReferrals > 0
              ? (stats.referrals?.filter((r) => r.volumeCents > 0).length || 0) /
                stats.totalReferrals
              : 0,
          averageOrderValue:
            stats.totalReferrals > 0
              ? attributedTotals.totalVolumeCents / stats.totalReferrals
              : 0,
          ...extendedMetrics,
        },
        recentReferrals: recentReferralsWithPending,
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
