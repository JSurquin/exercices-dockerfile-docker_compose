import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import {
  computeAffiliateAttributedTotals,
  computeAffiliateExtendedMetrics,
} from '@/lib/affiliate-metrics';
import { computeAffiliatePendingVolumeCents } from '@/lib/affiliate-referral-pending';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const { affiliateId } = await params;
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            steamUsername: true,
            steamAvatar: true,
            createdAt: true,
            kycStatus: true,
          },
        },
        _count: {
          select: { referrals: true, commissions: true },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Affilié introuvable' }, { status: 404 });
    }

    const [attributedTotals, extendedMetrics, pendingVolumeCents] = await Promise.all([
      computeAffiliateAttributedTotals(affiliateId),
      computeAffiliateExtendedMetrics(affiliateId),
      computeAffiliatePendingVolumeCents(affiliateId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...affiliate,
        totalVolumeCents: attributedTotals.totalVolumeCents,
        totalCommissionCents: attributedTotals.totalCommissionCents,
        metrics: {
          ...extendedMetrics,
          pendingVolumeCents,
        },
      },
    });
  } catch (error) {
    console.error('[admin/affiliates/[affiliateId]]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
