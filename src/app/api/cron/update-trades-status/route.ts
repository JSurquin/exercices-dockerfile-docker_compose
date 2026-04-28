import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';
import { requireCronSecret } from '@/lib/cron-auth';

/**
 * Cron job pour mettre à jour les statuts des trades en attente
 * 
 * Fréquence recommandée: toutes les 5-10 minutes
 * 
 * Vérifie les trades avec les statuts:
 * - CREATED (en attente d'acceptation)
 * - ACCEPTED_BY_BOT (accepté, peut être en trade hold)
 * - IN_TRADE_HOLD (en période de hold de 7 jours)
 * 
 * Pour chaque trade, interroge l'API Skinplace pour obtenir le statut réel
 * et met à jour la base de données si nécessaire.
 */

interface SkinplaceTradeStatusResponse {
  success: boolean;
  status?: string;
  steamtrade?: {
    tradeofferid: string;
    status: string;
    price: string;
    items_to_receive: number;
  };
  error?: string;
}

/**
 * Mapper les statuts Skinplace/Steam vers nos statuts TradeStatus
 */
function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    'pending': 'CREATED',
    'sent': 'CREATED',
    'created': 'CREATED',
    'accepted': 'ACCEPTED_BY_BOT',
    'active': 'IN_TRADE_HOLD',
    'trade_hold': 'IN_TRADE_HOLD',
    'completed': 'AVAILABLE',
    'done': 'AVAILABLE',
    'declined': 'FAILED',
    'rejected': 'FAILED',
    'expired': 'FAILED',
    'cancelled': 'FAILED',
    'failed': 'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

/**
 * Mettre à jour le statut d'un trade depuis Skinplace
 */
async function updateTradeStatus(trade: {
  id: string;
  userId: string;
  steamId: string;
  ticketId: string;
  status: TradeStatus;
  availableAt: Date | null;
  tradeAcceptedAt: Date | null;
}) {
  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

  if (!privateKey || !publicKey) {
    console.warn('⚠️  Clés API Skinplace manquantes, impossible de vérifier le trade', trade.id);
    return { updated: false, reason: 'missing_api_keys' };
  }

  try {
    // Appeler l'API Skinplace pour obtenir le statut
    const response = await fetch(
      `https://api.skin.place/api/v3/instant/status/${trade.ticketId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MoonSkin/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn(`⚠️  Erreur API Skinplace pour trade ${trade.id}: ${response.status}`);
      return { updated: false, reason: 'api_error', status: response.status };
    }

    const data: SkinplaceTradeStatusResponse = await response.json();
    const skinplaceStatus = data.status || data.steamtrade?.status;

    if (!skinplaceStatus) {
      console.warn(`⚠️  Pas de statut dans la réponse Skinplace pour trade ${trade.id}`);
      return { updated: false, reason: 'no_status' };
    }

    // Mapper vers notre enum
    const newStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);
    const oldStatus = trade.status;

    // Ordre de progression
    const statusOrder: TradeStatus[] = [
      'CREATED',
      'ACCEPTED_BY_BOT',
      'IN_TRADE_HOLD',
      'AVAILABLE',
      'PAYOUT_PENDING',
      'PAID',
    ];

    const oldStatusIndex = statusOrder.indexOf(oldStatus);
    const newStatusIndex = statusOrder.indexOf(newStatus);

    // Ne mettre à jour que si le statut progresse ou devient FAILED
    if (newStatus === oldStatus) {
      return { updated: false, reason: 'same_status' };
    }

    if (newStatus !== 'FAILED' && newStatusIndex <= oldStatusIndex) {
      return { updated: false, reason: 'no_progression' };
    }

    // Calculer les dates
    let availableAt = trade.availableAt;
    let tradeAcceptedAt = trade.tradeAcceptedAt;

    if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
      availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 7);
      tradeAcceptedAt = new Date();
    } else if (newStatus === 'AVAILABLE') {
      availableAt = new Date();
    }

    // Mettre à jour en base de données
    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        status: newStatus,
        availableAt,
        tradeAcceptedAt,
        updatedAt: new Date(),
      },
    });

    // Journaliser
    await prisma.auditLog.create({
      data: {
        userId: trade.userId,
        action: 'TRADE_STATUS_UPDATED',
        details: {
          tradeId: trade.id,
          oldStatus,
          newStatus,
          skinplaceStatus,
          source: 'cron_job',
        },
        ipAddress: 'cron',
      },
    });

    console.log(`✅ Trade ${trade.id} mis à jour: ${oldStatus} -> ${newStatus} (Skinplace: ${skinplaceStatus})`);

    return { 
      updated: true, 
      oldStatus, 
      newStatus, 
      skinplaceStatus 
    };

  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du trade ${trade.id}:`, error);
    return { 
      updated: false, 
      reason: 'error', 
      error: error instanceof Error ? error.message : 'unknown' 
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json(
        { success: false, error: cron.message },
        { status: cron.status }
      );
    }

    console.log('🔄 Démarrage du cron job de mise à jour des trades...');

    // Récupérer tous les trades en attente de mise à jour
    // (pas encore payés et pas échoués)
    const trades = await prisma.trade.findMany({
      where: {
        status: {
          in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'],
        },
        // Optionnel: ne vérifier que les trades récents (< 30 jours)
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        userId: true,
        steamId: true,
        ticketId: true,
        status: true,
        availableAt: true,
        tradeAcceptedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      // Limiter le nombre de trades à vérifier par exécution
      take: 50,
    });

    console.log(`📊 ${trades.length} trades à vérifier`);

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun trade à mettre à jour',
        stats: {
          total: 0,
          updated: 0,
          unchanged: 0,
          errors: 0,
        },
      });
    }

    // Traiter les trades
    const results = await Promise.allSettled(
      trades.map(trade => updateTradeStatus(trade))
    );

    // Compiler les statistiques
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    const details = results.map((result, index) => {
      const trade = trades[index];
      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value.updated) {
          updated++;
          return {
            tradeId: trade.id,
            status: 'updated',
            oldStatus: value.oldStatus,
            newStatus: value.newStatus,
            skinplaceStatus: value.skinplaceStatus,
          };
        } else {
          unchanged++;
          return {
            tradeId: trade.id,
            status: 'unchanged',
            reason: value.reason,
          };
        }
      } else {
        errors++;
        return {
          tradeId: trade.id,
          status: 'error',
          error: result.reason,
        };
      }
    });

    console.log(`✅ Cron job terminé: ${updated} mis à jour, ${unchanged} inchangés, ${errors} erreurs`);

    return NextResponse.json({
      success: true,
      message: 'Mise à jour des trades terminée',
      stats: {
        total: trades.length,
        updated,
        unchanged,
        errors,
      },
      details: details.filter(d => d.status === 'updated' || d.status === 'error'), // Ne retourner que les changements importants
    });

  } catch (error) {
    console.error('❌ Erreur cron job mise à jour trades:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

// Permettre aussi POST pour compatibilité avec certains services de cron
export async function POST(request: NextRequest) {
  return GET(request);
}

