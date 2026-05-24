import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeHooks } from '@/lib/trade-hooks';
import { AffiliateService } from '@/lib/affiliate-service';
import { requireCronSecret } from '@/lib/cron-auth';

/**
 * POST /api/cron/process-trades
 * Cron job pour traiter les trades qui ont terminé leur période de hold
 * À exécuter toutes les heures ou toutes les 6 heures
 */
export async function POST(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json(
        { error: cron.message },
        { status: cron.status }
      );
    }

    console.log('[Cron] Starting trade processing...');

    // Récupérer tous les trades en IN_TRADE_HOLD dont la période est terminée
    const tradesReadyForPayout = await prisma.trade.findMany({
      where: {
        status: 'IN_TRADE_HOLD',
        availableAt: {
          lte: new Date() // Date disponible <= maintenant
        }
      },
      include: {
        user: true,
        items: true
      }
    });

    console.log(`[Cron] Found ${tradesReadyForPayout.length} trades ready for payout`);

    let processedCount = 0;
    let errorCount = 0;

    // Traiter chaque trade
    for (const trade of tradesReadyForPayout) {
      try {
        console.log(`[Cron] Processing trade ${trade.id}...`);

        // Mettre à jour le statut du trade
        await prisma.trade.update({
          where: { id: trade.id },
          data: { status: 'AVAILABLE' }
        });

        // Déclencher le hook qui créera le payout
        await TradeHooks.onTradeStatusChanged(
          trade.id,
          'IN_TRADE_HOLD',
          'AVAILABLE'
        );

        processedCount++;
        console.log(`[Cron] Successfully processed trade ${trade.id}`);
      } catch (error) {
        errorCount++;
        console.error(`[Cron] Error processing trade ${trade.id}:`, error);
        
        // Log de l'erreur
        await prisma.auditLog.create({
          data: {
            userId: 'system',
            action: 'CRON_ERROR',
            details: {
              tradeId: trade.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              step: 'process_trade'
            }
          }
        }).catch(err => console.error('Failed to log error:', err));
      }
    }

    // Également vérifier les payouts en PROCESSING pour mettre à jour leur statut via GateFi
    const processingPayouts = await prisma.payout.findMany({
      where: {
        status: 'PROCESSING',
        gateFiOrderId: {
          not: null
        }
      },
      include: {
        paymentMethod: true
      },
      take: 50 // Limiter pour éviter de surcharger l'API
    });

    console.log(`[Cron] Found ${processingPayouts.length} payouts to check status`);

    for (const payout of processingPayouts) {
      try {
        // Ici on pourrait appeler l'API GateFi pour vérifier le statut
        // Mais c'est mieux de laisser les webhooks faire ce travail
        // On pourrait juste loguer ou faire une vérification périodique
        console.log(`[Cron] Payout ${payout.id} is still processing`);
      } catch (error) {
        console.error(`[Cron] Error checking payout ${payout.id}:`, error);
      }
    }

    const response = {
      success: true,
      message: 'Trade processing completed',
      stats: {
        tradesFound: tradesReadyForPayout.length,
        processed: processedCount,
        errors: errorCount,
        payoutsChecked: processingPayouts.length
      },
      timestamp: new Date().toISOString()
    };

    console.log('[Cron] Trade processing completed:', response);

    // Rattrapage : commissions affilié pour trades validés sans attribution
    const tradesMissingCommission = await prisma.trade.findMany({
      where: {
        status: { in: ['AVAILABLE', 'PAYOUT_PENDING', 'PAID'] },
        affiliateCommissionProcessedAt: null,
        OR: [
          { affiliatePromoCode: { not: null } },
          { user: { referredByAffiliateId: { not: null } } },
        ],
      },
      select: { id: true },
      take: 50,
    });

    let commissionsProcessed = 0;
    for (const { id } of tradesMissingCommission) {
      try {
        await AffiliateService.calculateCommissionForTrade(id);
        commissionsProcessed++;
      } catch (err) {
        console.error(`[Cron] Affiliate commission catchup failed for trade ${id}:`, err);
      }
    }

    return NextResponse.json({
      ...response,
      stats: {
        ...response.stats,
        affiliateCommissionsCatchup: commissionsProcessed,
      },
    });
  } catch (error) {
    console.error('[Cron] Fatal error in trade processing:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-trades
 * Endpoint de test (désactiver en production)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  // En développement, permettre un GET pour tester
  return POST(request);
}

