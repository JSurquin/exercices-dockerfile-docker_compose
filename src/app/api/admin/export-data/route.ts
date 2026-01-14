import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pdfGenerator, AdminReportData } from '@/lib/pdf-generator';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // TODO: Ajouter la vérification d'authentification admin
    // const session = await getServerSession(authOptions);
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    logger.info('Début de génération de l\'export PDF des données');

    // Récupération des données depuis la base
    const [
      users,
      trades,
      payouts,
      affiliates,
      commissions,
      kycDocuments
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          kycStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Trades
      prisma.trade.findMany({
        include: {
          user: {
            select: {
              steamUsername: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limiter pour optimiser
      }),

      // Paiements
      prisma.payout.findMany({
        include: {
          user: {
            select: {
              steamUsername: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      // Affiliés
      prisma.affiliateStats.findMany({
        include: {
          user: {
            select: {
              steamUsername: true
            }
          },
          _count: {
            select: {
              referrals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Commissions
      prisma.affiliateCommission.findMany({
        include: {
          affiliate: {
            include: {
              user: {
                select: {
                  steamUsername: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      // Documents KYC
      prisma.kycDocument.findMany({
        include: {
          user: {
            select: {
              steamUsername: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' },
        take: 100
      })
    ]);

    // Calcul des statistiques
    const stats = {
      totalUsers: users.length,
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum: number, trade: any) => sum + (trade.grossCents || 0), 0),
      totalCommissions: commissions.reduce((sum: number, commission: any) => sum + commission.amountCents, 0),
      activeAffiliates: affiliates.filter((a: any) => a.isActive).length,
      pendingKYC: users.filter((u: any) => u.kycStatus === 'PENDING').length
    };

    // Calcul des analytics
    const analytics = {
      volumeByDay: await getVolumeByDay(),
      tradesByStatus: await getTradesByStatus(),
      usersByRole: await getUsersByRole()
    };

    // Formatage des données pour le PDF
    const reportData: AdminReportData = {
      stats,
      trades: trades.map((trade: any) => ({
        id: trade.id,
        userId: trade.userId,
        username: trade.user.steamUsername,
        status: trade.status,
        grossCents: trade.grossCents || 0,
        netCents: trade.netCents || 0,
        createdAt: trade.createdAt.toISOString(),
        availableAt: trade.availableAt?.toISOString()
      })),
      users: users.map((user: any) => ({
        id: user.id,
        username: user.steamUsername,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.updatedAt?.toISOString()
      })),
      payouts: payouts.map((payout: any) => ({
        id: payout.id,
        userId: payout.userId,
        username: payout.user.steamUsername,
        method: payout.paymentMethod?.type,
        amountCents: payout.amountCents,
        status: payout.status,
        createdAt: payout.createdAt.toISOString(),
        processedAt: payout.paidAt?.toISOString()
      })),
      affiliates: affiliates.map((affiliate: any) => ({
        id: affiliate.id,
        username: affiliate.user.steamUsername,
        code: affiliate.code,
        totalReferrals: affiliate._count.referrals,
        totalCommissionCents: affiliate.totalCommissionCents,
        status: affiliate.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: affiliate.createdAt.toISOString()
      })),
      commissions: commissions.map((commission: any) => ({
        id: commission.id,
        affiliateUsername: commission.affiliate.user.steamUsername,
        amountCents: commission.amountCents,
        status: commission.status,
        referralId: commission.referralId,
        createdAt: commission.createdAt.toISOString()
      })),
      kyc: kycDocuments.map((kyc: any) => ({
        id: kyc.id,
        userId: kyc.userId,
        username: kyc.user.steamUsername,
        status: kyc.status,
        submittedAt: kyc.uploadedAt.toISOString(),
        reviewedAt: kyc.reviewedAt?.toISOString()
      })),
      analytics
    };

    // Génération du PDF
    const pdfBuffer = await pdfGenerator.generateDataExportPDF(reportData);

    logger.info('Export PDF des données généré avec succès', {
      size: pdfBuffer.length,
      stats
    });

    // Retour du PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="moonskin-export-donnees-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération de l\'export PDF', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires pour les analytics
async function getVolumeByDay() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trades = await prisma.trade.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      },
      status: {
        in: ['PAID', 'AVAILABLE', 'PAYOUT_PENDING']
      }
    },
    select: {
      createdAt: true,
      grossCents: true
    }
  });

  // Grouper par jour
  const volumeByDay: { [key: string]: number } = {};
  trades.forEach(trade => {
    const date = trade.createdAt.toISOString().split('T')[0];
    volumeByDay[date] = (volumeByDay[date] || 0) + (trade.grossCents || 0);
  });

  return Object.entries(volumeByDay).map(([date, volume]) => ({
    date,
    volume
  })).sort((a, b) => a.date.localeCompare(b.date));
}

async function getTradesByStatus() {
  const trades = await prisma.trade.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  return trades.map(trade => ({
    status: trade.status,
    count: trade._count.id
  }));
}

async function getUsersByRole() {
  const users = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      id: true
    }
  });

  return users.map(user => ({
    role: user.role,
    count: user._count.id
  }));
}
