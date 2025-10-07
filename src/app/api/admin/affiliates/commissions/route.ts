import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/prisma';

export async function GET(request: NextRequest) {
  try {
    // TODO: Vérifier les permissions admin
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'PENDING';
    const affiliateId = searchParams.get('affiliateId');
    
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
        statusTotals: statusTotals.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.id,
            total: item._sum.amountCents || 0
          };
          return acc;
        }, {} as Record<string, { count: number; total: number }>)
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
    // TODO: Vérifier les permissions admin
    
    const { action, commissionIds, payoutData } = await request.json();
    
    switch (action) {
      case 'approve':
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: commissionIds },
            status: 'PENDING'
          },
          data: { status: 'APPROVED' }
        });
        
        // Log de l'audit
        await prisma.auditLog.create({
          data: {
            userId: 'admin', // TODO: ID admin réel
            action: 'AFFILIATE_COMMISSIONS_APPROVED',
            details: {
              commissionIds,
              count: commissionIds.length
            }
          }
        });
        break;
        
      case 'reject':
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: commissionIds },
            status: 'PENDING'
          },
          data: { status: 'CANCELLED' }
        });
        
        await prisma.auditLog.create({
          data: {
            userId: 'admin',
            action: 'AFFILIATE_COMMISSIONS_REJECTED',
            details: {
              commissionIds,
              count: commissionIds.length
            }
          }
        });
        break;
        
      case 'create_payout':
        // Créer un payout pour les commissions approuvées
        const totalAmount = await prisma.affiliateCommission.aggregate({
          where: {
            id: { in: commissionIds },
            status: 'APPROVED'
          },
          _sum: { amountCents: true }
        });
        
        const payout = await prisma.payout.create({
          data: {
            userId: payoutData.affiliateUserId,
            amountCents: totalAmount._sum.amountCents || 0,
            paymentMethodId: payoutData.paymentMethodId,
            status: 'PENDING'
          }
        });
        
        // Marquer les commissions comme payées
        await prisma.affiliateCommission.updateMany({
          where: {
            id: { in: commissionIds },
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
            userId: 'admin',
            action: 'AFFILIATE_PAYOUT_CREATED',
            details: {
              payoutId: payout.id,
              commissionIds,
              amount: totalAmount._sum.amountCents
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
    console.error('Erreur action commissions admin:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}