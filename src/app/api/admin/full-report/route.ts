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

    logger.info('Début de génération du rapport complet PDF');

    // Récupération complète des données avec plus de détails
    const [
      users,
      trades,
      payouts,
      affiliates,
      commissions,
      kycDocuments,
      giveaways,
      skinplaceMetrics
    ] = await Promise.all([
      // Utilisateurs avec plus de détails
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          kycStatus: true,
          createdAt: true,
          xp: true,
          tickets: true,
          _count: {
            select: {
              trades: true,
              payouts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Tous les trades pour analyse complète
      prisma.trade.findMany({
        include: {
          user: {
            select: {
              steamUsername: true,
              email: true
            }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Tous les paiements
      prisma.payout.findMany({
        include: {
          user: {
            select: {
              steamUsername: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Affiliés avec statistiques détaillées
      prisma.affiliateStats.findMany({
        include: {
          user: {
            select: {
              steamUsername: true,
              email: true,
              createdAt: true
            }
          },
          referrals: {
            include: {
              referredUser: {
                select: {
                  steamUsername: true,
                  createdAt: true
                }
              }
            }
          },
          commissions: {
            select: {
              amountCents: true,
              status: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              referrals: true,
              commissions: true
            }
          }
        },
        orderBy: { totalCommissionCents: 'desc' }
      }),

      // Toutes les commissions
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
          },
          referral: {
            select: {
              id: true,
              volumeCents: true,
              commissionCents: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Documents KYC
      prisma.kycDocument.findMany({
        include: {
          user: {
            select: {
              steamUsername: true,
              email: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      }),

      // Giveaways pour analyse de gamification
      prisma.giveaway.findMany({
        include: {
          entries: {
            include: {
              user: {
                select: {
                  steamUsername: true
                }
              }
            }
          },
          _count: {
            select: {
              entries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Métriques Skinplace (si disponibles)
      [] as any[] // Pas de table skinplaceMetric dans le schéma
    ]);

    // Calcul des statistiques avancées
    const totalVolume = trades.reduce((sum: number, trade: any) => sum + (trade.grossCents || 0), 0);
    const totalCommissions = commissions.reduce((sum: number, commission: any) => sum + commission.amountCents, 0);
    const activeAffiliates = affiliates.filter((a: any) => a.isActive).length;
    const pendingKYC = users.filter((u: any) => u.kycStatus === 'PENDING').length;

    const stats = {
      totalUsers: users.length,
      totalTrades: trades.length,
      totalVolume,
      totalCommissions,
      activeAffiliates,
      pendingKYC
    };

    // Analytics avancées
    const analytics = {
      volumeByDay: await getDetailedVolumeByDay(),
      tradesByStatus: await getDetailedTradesByStatus(),
      usersByRole: await getDetailedUsersByRole(),
      conversionMetrics: await getConversionMetrics(),
      affiliatePerformance: await getAffiliatePerformance(),
      kycMetrics: await getKYCMetrics()
    };

    // Formatage des données pour le rapport complet
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

    // Génération du rapport complet PDF
    const pdfBuffer = await pdfGenerator.generateFullReportPDF(reportData);

    logger.info('Rapport complet PDF généré avec succès', {
      size: pdfBuffer.length,
      stats,
      pages: Math.ceil(pdfBuffer.length / 50000) // Estimation du nombre de pages
    });

    // Retour du PDF
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cashtrade-rapport-complet-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du rapport complet PDF', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport PDF' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires pour les analytics avancées
async function getDetailedVolumeByDay() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trades = await prisma.trade.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    select: {
      createdAt: true,
      grossCents: true,
      status: true
    }
  });

  // Grouper par jour avec plus de détails
  const volumeByDay: { [key: string]: number } = {};
  trades.forEach(trade => {
    const date = trade.createdAt.toISOString().split('T')[0];
    if (trade.status !== 'FAILED') {
      volumeByDay[date] = (volumeByDay[date] || 0) + (trade.grossCents || 0);
    }
  });

  return Object.entries(volumeByDay).map(([date, volume]) => ({
    date,
    volume
  })).sort((a, b) => a.date.localeCompare(b.date));
}

async function getDetailedTradesByStatus() {
  const trades = await prisma.trade.groupBy({
    by: ['status'],
    _count: {
      id: true
    },
    _sum: {
      grossCents: true
    }
  });

  return trades.map((trade: any) => ({
    status: trade.status,
    count: trade._count?.id || 0,
    totalVolume: trade._sum?.grossCents || 0
  }));
}

async function getDetailedUsersByRole() {
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

async function getConversionMetrics() {
  const totalUsers = await prisma.user.count();
  const usersWithTrades = await prisma.user.count({
    where: {
      trades: {
        some: {}
      }
    }
  });

  const usersWithPayouts = await prisma.user.count({
    where: {
      payouts: {
        some: {}
      }
    }
  });

  return {
    totalUsers,
    usersWithTrades,
    usersWithPayouts,
    tradeConversionRate: totalUsers > 0 ? (usersWithTrades / totalUsers) * 100 : 0,
    payoutConversionRate: totalUsers > 0 ? (usersWithPayouts / totalUsers) * 100 : 0
  };
}

async function getAffiliatePerformance() {
  const affiliates = await prisma.affiliateStats.findMany({
    include: {
      _count: {
        select: {
          referrals: true,
          commissions: true
        }
      }
    }
  });

  return {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter((a: any) => a.isActive).length,
    averageReferrals: affiliates.length > 0 ? 
      affiliates.reduce((sum: number, a: any) => sum + a._count.referrals, 0) / affiliates.length : 0,
    topPerformers: affiliates
      .sort((a: any, b: any) => b.totalCommissionCents - a.totalCommissionCents)
      .slice(0, 5)
      .map((a: any) => ({
        code: a.code,
        referrals: a._count.referrals,
        commissions: a.totalCommissionCents
      }))
  };
}

async function getKYCMetrics() {
  const kycStats = await prisma.user.groupBy({
    by: ['kycStatus'],
    _count: {
      id: true
    }
  });

  const avgProcessingTime = await prisma.kycDocument.findMany({
    where: {
      status: 'VERIFIED',
      reviewedAt: {
        not: null
      }
    },
    select: {
      uploadedAt: true,
      reviewedAt: true
    }
  });

  const processingTimes = avgProcessingTime
    .filter(doc => doc.reviewedAt)
    .map((doc: any) => {
      const submitted = new Date(doc.uploadedAt);
      const reviewed = new Date(doc.reviewedAt!);
      return reviewed.getTime() - submitted.getTime();
    });

  const averageProcessingTime = processingTimes.length > 0 ?
    processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length : 0;

  return {
    statusBreakdown: kycStats.map(stat => ({
      status: stat.kycStatus,
      count: stat._count.id
    })),
    averageProcessingTimeHours: Math.round(averageProcessingTime / (1000 * 60 * 60))
  };
}
