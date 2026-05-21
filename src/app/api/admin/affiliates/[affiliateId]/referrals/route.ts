import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../../../../prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import { safeParseSearchParams } from '@/lib/validation/helpers';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

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
    if (!affiliateId) {
      return NextResponse.json({ success: false, error: 'affiliateId requis' }, { status: 400 });
    }

    const affiliate = await prisma.affiliateStats.findUnique({
      where: { id: affiliateId },
      select: { id: true, code: true },
    });
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Affilié introuvable' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, querySchema);
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const { page, limit, search } = parsedQ.data;
    const skip = (page - 1) * limit;

    const where: {
      affiliateId: string;
      referredUser?: {
        OR: Array<{ steamUsername?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' }; steamId?: { contains: string } }>;
      };
    } = { affiliateId };

    if (search?.trim()) {
      const q = search.trim();
      where.referredUser = {
        OR: [
          { steamUsername: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { steamId: { contains: q } },
        ],
      };
    }

    const [referrals, total] = await Promise.all([
      prisma.affiliateReferral.findMany({
        where,
        include: {
          referredUser: {
            select: {
              id: true,
              email: true,
              steamUsername: true,
              steamAvatar: true,
              steamId: true,
              userTag: true,
              bonusRatePercent: true,
              affiliateRewardsBlocked: true,
              xpRewardsBlocked: true,
              createdAt: true,
              totalVolumeCents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.affiliateReferral.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        affiliateCode: affiliate.code,
        referrals: referrals.map((r) => ({
          id: r.id,
          referredAt: r.createdAt,
          volumeCents: r.volumeCents,
          commissionCents: r.commissionCents,
          tradeId: r.tradeId,
          user: r.referredUser,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[admin/affiliates/referrals]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
