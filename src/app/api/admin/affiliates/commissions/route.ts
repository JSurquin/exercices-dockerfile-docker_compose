import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import { AffiliateService } from '@/lib/affiliate-service';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  adminAffiliateCommissionsListQuerySchema,
  adminAffiliateCommissionsPostSchema,
} from '@/lib/validation/schemas/admin-bodies';

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, adminAffiliateCommissionsListQuerySchema, {
      errorStyle: 'successFalse',
    });
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const page = parsedQ.data.page;
    const limit = parsedQ.data.limit;
    const status = parsedQ.data.status || 'PENDING';
    const affiliateId = parsedQ.data.affiliateId;
    
    const skip = (page - 1) * limit;
    
    // Construire les filtres
    const where: any = { status };
    
    if (affiliateId) {
      where.affiliateId = affiliateId;
    }
    
    // Récupérer les commissions
    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  id: true,
                  steamUsername: true,
                  steamAvatar: true,
                  email: true
                }
              }
            }
          },
          referral: {
            include: {
              referredUser: {
                select: {
                  id: true,
                  steamUsername: true,
                  steamAvatar: true
                }
              },
              trade: {
                select: {
                  id: true,
                  grossCents: true,
                  createdAt: true
                }
              }
            }
          },
          payout: {
            select: {
              id: true,
              status: true,
              paidAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.affiliateCommission.count({ where })
    ]);
    
    // Calculer les totaux par statut
    const statusTotals = await prisma.affiliateCommission.groupBy({
      by: ['status'],
      _sum: {
        amountCents: true
      },
      _count: {
        id: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statusTotals: statusTotals.reduce((acc: Record<string, { count: number; total: number }>, item: any) => {
          acc[item.status] = {
            count: item._count.id,
            total: item._sum.amountCents || 0
          };
          return acc;
        }, {})
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération commissions admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    const adminUserId = adminSession.user.id;

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminAffiliateCommissionsPostSchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, commissionIds } = parsed.data;
    const ids = commissionIds ?? [];

    switch (action) {
      case 'reject':
      case 'cancel':
        for (const commissionId of ids) {
          await AffiliateService.cancelCommissionById(commissionId);
        }

        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_COMMISSIONS_REJECTED',
            details: {
              commissionIds: ids,
              count: ids.length,
            },
          },
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
    console.error('Erreur action commissions admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}