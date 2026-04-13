import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '../../../../../prisma/prisma';
import { DEFAULT_PAGE_SIZE } from '@/lib/admin-constants';

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
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
        orderBy: { totalCommissionCents: 'desc' },
        skip,
        take: limit
      }),
      prisma.affiliateStats.count({ where })
    ]);
    
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
    
    return NextResponse.json({
      success: true,
      data: {
        affiliates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        globalStats: {
          totalAffiliates: globalStats._count.id || 0,
          totalReferrals: globalStats._sum.totalReferrals || 0,
          totalVolume: globalStats._sum.totalVolumeCents || 0,
          totalCommissions: globalStats._sum.totalCommissionCents || 0
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
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const adminUserId = session.user.id;
    const { action, affiliateId, data } = await request.json();
    
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
