import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

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

    const [totalVolumeAgg, pendingVolumeAgg] = await Promise.all([
      prisma.trade.aggregate({
        where: {
          userId,
          status: { notIn: ['FAILED', 'CANCELLED'] },
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
    ]);

    const tradeTotalVolumeCents = totalVolumeAgg._sum.grossCents ?? 0;
    const totalVolumeCents = Math.max(user.totalVolumeCents, tradeTotalVolumeCents);
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
    return NextResponse.json({
      ...userPayload,
      totalVolumeCents,
      pendingVolumeCents,
      referredBy,
    });
  } catch (err) {
    console.error('[admin/users/[userId]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
