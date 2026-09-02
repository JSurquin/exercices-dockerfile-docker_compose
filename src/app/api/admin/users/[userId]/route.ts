import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { CREDITED_TRADE_STATUSES } from '@/lib/trade-volume';
import { getActiveApiClientForUser, toOwnerApiClientView } from '@/lib/partner-api/key-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users/[userId]', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        steamId: true,
        steamUsername: true,
        kycStatus: true,
        kycaidApplicantId: true,
        level: true,
        xp: true,
        tickets: true,
        totalVolumeCents: true,
        pendingBalanceCents: true,
        balanceCents: true,
        frozenBalanceCents: true,
        accountFrozen: true,
        banned: true,
        banReason: true,
        banExpires: true,
        lastLoginIp: true,
        lastLoginAt: true,
        bonusRatePercent: true,
        userTag: true,
        instantCreditEnabled: true,
        developerProgramEnabled: true,
        affiliateRewardsBlocked: true,
        xpRewardsBlocked: true,
        referredByAffiliateId: true,
        createdAt: true,
        role: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const [totalVolumeAgg, pendingVolumeAgg, apiClient] = await Promise.all([
      prisma.trade.aggregate({
        where: {
          userId,
          status: { in: CREDITED_TRADE_STATUSES },
        },
        _sum: { grossCents: true },
      }),
      prisma.trade.aggregate({
        where: {
          userId,
          status: { in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'] },
        },
        _sum: { grossCents: true },
      }),
      getActiveApiClientForUser(userId),
    ]);

    const tradeTotalVolumeCents = totalVolumeAgg._sum.grossCents ?? 0;
    const totalVolumeCents = tradeTotalVolumeCents;
    const pendingVolumeCents = pendingVolumeAgg._sum.grossCents ?? 0;

    let referredBy: {
      affiliateId: string;
      code: string;
      steamUsername: string | null;
    } | null = null;
    if (user.referredByAffiliateId) {
      const affiliate = await prisma.affiliateStats.findUnique({
        where: { id: user.referredByAffiliateId },
        select: {
          id: true,
          code: true,
          user: { select: { steamUsername: true } },
        },
      });
      if (affiliate) {
        referredBy = {
          affiliateId: affiliate.id,
          code: affiliate.code,
          steamUsername: affiliate.user.steamUsername,
        };
      }
    }

    const { referredByAffiliateId: _refId, totalVolumeCents: _storedVolume, ...userPayload } = user;

    const affiliateHistory = await prisma.userAffiliateHistory.findMany({
      where: { userId },
      include: {
        affiliate: {
          select: {
            code: true,
            user: { select: { steamUsername: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({
      ...userPayload,
      totalVolumeCents,
      pendingVolumeCents,
      referredBy,
      affiliateHistory: affiliateHistory.map((h) => ({
        id: h.id,
        affiliateId: h.affiliateId,
        affiliateCode: h.affiliateCode,
        affiliateName: h.affiliate.user.steamUsername,
        startedAt: h.startedAt,
        endedAt: h.endedAt,
        isActive: h.isActive,
      })),
      apiClient: apiClient ? toOwnerApiClientView(apiClient) : null,
    });
  } catch (err) {
    console.error('[admin/users/[userId]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
