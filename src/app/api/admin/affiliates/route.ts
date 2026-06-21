import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { affiliateCodeEqualsFilter, normalizeAffiliateCode } from '@/lib/affiliate-commission-logic';
import { computeAffiliateAttributedTotalsBatch } from '@/lib/affiliate-metrics';
import { prisma } from '../../../../../prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import { adminAffiliatePostSchema, adminAffiliatesListQuerySchema } from '@/lib/validation/schemas/admin-bodies';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, adminAffiliatesListQuerySchema);
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const page = parsedQ.data.page;
    const limit = parsedQ.data.limit;
    const search = parsedQ.data.search ?? '';
    const status = parsedQ.data.status ?? 'all';
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (status !== 'all') {
      where.isActive = status === 'active';
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { user: { steamUsername: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    const [affiliates, total] = await Promise.all([
      prisma.affiliateStats.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              steamUsername: true,
              steamAvatar: true,
              createdAt: true,
              kycStatus: true
            }
          },
          _count: {
            select: {
              referrals: true,
              commissions: true
            }
          }
        },
        // Les affiliés à 0 € de commission sinon en fin de liste (invisibles page 1)
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.affiliateStats.count({ where })
    ]);

    const attributedTotals = await computeAffiliateAttributedTotalsBatch(
      affiliates.map((a) => a.id)
    );

    const affiliatesWithTotals = affiliates.map((affiliate) => {
      const totals = attributedTotals.get(affiliate.id);
      return {
        ...affiliate,
        totalVolumeCents: totals?.totalVolumeCents ?? affiliate.totalVolumeCents,
        totalCommissionCents: totals?.totalCommissionCents ?? affiliate.totalCommissionCents,
      };
    });
    
    const globalStats = await prisma.affiliateStats.aggregate({
      _sum: {
        totalReferrals: true,
        totalVolumeCents: true,
        totalCommissionCents: true
      },
      _count: {
        id: true
      },
      where: { isActive: true }
    });
    
    const activeAffiliateIds = await prisma.affiliateStats.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const activeTotals = await computeAffiliateAttributedTotalsBatch(
      activeAffiliateIds.map((a) => a.id)
    );
    const globalVolume = [...activeTotals.values()].reduce(
      (sum, t) => sum + t.totalVolumeCents,
      0
    );
    const globalCommissions = [...activeTotals.values()].reduce(
      (sum, t) => sum + t.totalCommissionCents,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        affiliates: affiliatesWithTotals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        globalStats: {
          totalAffiliates: globalStats._count.id || 0,
          totalReferrals: globalStats._sum.totalReferrals || 0,
          totalVolume: globalVolume,
          totalCommissions: globalCommissions
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération affiliés admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const adminUserId = session.user.id;
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminAffiliatePostSchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, affiliateId, data } = parsed.data;
    
    switch (action) {
      case 'toggle_status':
        await prisma.affiliateStats.update({
          where: { id: affiliateId },
          data: { isActive: !data.currentStatus }
        });
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_STATUS_CHANGED',
            details: {
              affiliateId,
              newStatus: !data.currentStatus
            }
          }
        });
        break;
        
      case 'update_commission_rate':
        await prisma.affiliateStats.update({
          where: { id: affiliateId },
          data: { commissionRate: data.newRate }
        });
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_COMMISSION_RATE_CHANGED',
            details: {
              affiliateId,
              oldRate: data.oldRate,
              newRate: data.newRate
            }
          }
        });
        break;

      case 'update_code': {
        const trimmedCode = normalizeAffiliateCode((data.newCode as string) ?? '');
        if (!trimmedCode || trimmedCode.length < 3 || trimmedCode.length > 20) {
          return NextResponse.json(
            { success: false, error: 'Le code doit contenir entre 3 et 20 caractères' },
            { status: 400 }
          );
        }
        const existing = await prisma.affiliateStats.findFirst({
          where: { ...affiliateCodeEqualsFilter(trimmedCode), NOT: { id: affiliateId } },
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Ce code est déjà utilisé par un autre affilié' },
            { status: 409 }
          );
        }
        await prisma.affiliateStats.update({
          where: { id: affiliateId },
          data: { code: trimmedCode }
        });
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_CODE_CHANGED',
            details: { affiliateId, oldCode: data.oldCode, newCode: trimmedCode }
          }
        });
        break;
      }

      case 'remove_affiliate': {
        const affiliateRecord = await prisma.affiliateStats.findUnique({
          where: { id: affiliateId },
          select: { userId: true, code: true }
        });
        if (!affiliateRecord) {
          return NextResponse.json(
            { success: false, error: 'Affilié introuvable' },
            { status: 404 }
          );
        }
        await prisma.$transaction([
          prisma.affiliateStats.delete({
            where: { id: affiliateId }
          }),
          prisma.user.update({
            where: { id: affiliateRecord.userId },
            data: { role: 'USER' }
          })
        ]);
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_REMOVED',
            details: { affiliateId, targetUserId: affiliateRecord.userId, code: affiliateRecord.code }
          }
        });
        break;
      }
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Action effectuée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur action admin affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
