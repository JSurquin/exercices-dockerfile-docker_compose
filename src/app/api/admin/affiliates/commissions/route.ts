import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
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
    const { action, commissionIds, payoutData } = parsed.data;
    const ids = commissionIds ?? [];

    switch (action) {
      case 'approve':
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: ids },
            status: 'PENDING'
          },
          data: { status: 'APPROVED' }
        });
        
        // Log de l'audit
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_COMMISSIONS_APPROVED',
            details: {
              commissionIds: ids,
              count: ids.length
            }
          }
        });
        break;
        
      case 'reject':
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: ids },
            status: 'PENDING'
          },
          data: { status: 'CANCELLED' }
        });
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_COMMISSIONS_REJECTED',
            details: {
              commissionIds: ids,
              count: ids.length
            }
          }
        });
        break;
        
      case 'create_payout': {
        const payoutPayload = payoutData as {
          affiliateUserId?: string;
          paymentMethodId?: string;
        };
        if (!payoutPayload.affiliateUserId || !payoutPayload.paymentMethodId) {
          return NextResponse.json({ error: 'affiliateUserId et paymentMethodId requis' }, { status: 400 });
        }
        const totalAmount = await prisma.affiliateCommission.aggregate({
          where: {
            id: { in: ids },
            status: 'APPROVED'
          },
          _sum: { amountCents: true }
        });
        
        const payoutAmountCents = totalAmount._sum.amountCents || 0;
        if (payoutAmountCents <= 0) {
          return NextResponse.json({ error: 'Aucun montant à payer' }, { status: 400 });
        }

        const payout = await prisma.payout.create({
          data: {
            userId: payoutPayload.affiliateUserId,
            amountCents: payoutAmountCents,
            paymentMethodId: payoutPayload.paymentMethodId,
            status: 'PENDING'
          }
        });
        await PayoutLifecycle.onCreated(payoutPayload.affiliateUserId, payout.id, payoutAmountCents);

        // Marquer les commissions comme payées
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: ids },
            status: 'APPROVED'
          },
          data: {
            status: 'PAID',
            payoutId: payout.id,
            paidAt: new Date()
          }
        });
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_PAYOUT_CREATED',
            details: {
              payoutId: payout.id,
              commissionIds: ids,
              amount: totalAmount._sum.amountCents
            }
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
    console.error('Erreur action commissions admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}