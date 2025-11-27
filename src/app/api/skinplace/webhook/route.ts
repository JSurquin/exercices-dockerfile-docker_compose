import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { TradeHooks } from '@/lib/trade-hooks';

/**
 * Webhook Skinplace pour recevoir les mises à jour de statut des trades
 * 
 * Appelé par Skinplace quand le statut d'un trade change :
 * - Offre acceptée par l'utilisateur
 * - Offre refusée
 * - Offre expirée
 * - Items reçus et disponibles
 */

interface SkinplaceWebhookPayload {
  token: string;
  status: string; // 'pending', 'accepted', 'declined', 'expired', 'completed', 'failed'
  tradeofferid?: string;
  steamtrade?: {
    tradeofferid: string;
    status: string;
    price: string;
    items_to_receive: number;
  };
  order_id?: string;
  timestamp: number;
}

/**
 * Mapper les statuts Skinplace/Steam vers nos statuts TradeStatus
 */
function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  const statusMap: Record<string, TradeStatus> = {
    // Offre créée, en attente d'acceptation
    'pending': 'CREATED',
    'sent': 'CREATED',
    
    // Offre acceptée par l'utilisateur
    'accepted': 'ACCEPTED_BY_BOT',
    
    // En période de trade hold Steam (7 jours)
    'active': 'IN_TRADE_HOLD',
    'trade_hold': 'IN_TRADE_HOLD',
    
    // Items reçus, disponibles pour paiement
    'completed': 'AVAILABLE',
    'done': 'AVAILABLE',
    
    // Échecs
    'declined': 'FAILED',
    'rejected': 'FAILED',
    'expired': 'FAILED',
    'cancelled': 'FAILED',
    'failed': 'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

export async function POST(request: NextRequest) {
  try {
    const body: SkinplaceWebhookPayload = await request.json();

    console.log('📥 Webhook Skinplace reçu:', JSON.stringify(body, null, 2));

    // Validation des données
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 400 }
      );
    }

    // Trouver le trade par le token Skinplace ou order_id
    let trade = await prisma.trade.findFirst({
      where: {
        OR: [
          { ticketId: body.token },
          { id: body.order_id },
        ],
      },
      include: {
        user: true,
        items: true,
      },
    });

    if (!trade) {
      console.error('❌ Trade non trouvé pour token/order_id:', body.token, body.order_id);
      return NextResponse.json(
        { success: false, error: 'Trade non trouvé' },
        { status: 404 }
      );
    }

    // Mapper le statut Skinplace vers notre enum TradeStatus
    const newStatus = mapSkinplaceStatusToTradeStatus(body.status);
    const oldStatus = trade.status;

    console.log(`🔄 Mise à jour statut trade ${trade.id}: ${oldStatus} -> ${newStatus}`);
    console.log(`   Statut Skinplace: ${body.status}`);

    // Ne pas rétrograder un statut déjà plus avancé
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

    // Si le nouveau statut est FAILED, toujours mettre à jour
    // Sinon, ne mettre à jour que si le nouveau statut est plus avancé
    if (newStatus === 'FAILED' || newStatusIndex > oldStatusIndex) {
      // Calculer la date de disponibilité si le trade est accepté
      let availableAt = trade.availableAt;
      if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
        availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 7); // 7 jours de trade hold
      } else if (newStatus === 'AVAILABLE') {
        availableAt = new Date(); // Disponible immédiatement
      }

      // Mettre à jour le trade
      trade = await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: newStatus,
          availableAt,
          tradeAcceptedAt: newStatus === 'ACCEPTED_BY_BOT' ? new Date() : trade.tradeAcceptedAt,
          updatedAt: new Date(),
        },
        include: {
          user: true,
          items: true,
        },
      });

      // Journaliser la mise à jour
      await prisma.auditLog.create({
        data: {
          userId: trade.userId,
          action: 'TRADE_STATUS_UPDATED',
          details: {
            tradeId: trade.id,
            oldStatus,
            newStatus,
            skinplaceStatus: body.status,
            tradeOfferId: body.tradeofferid || body.steamtrade?.tradeofferid,
            source: 'webhook',
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'skinplace',
        },
      });

      // Appeler les hooks de trade selon le statut
      if (newStatus === 'ACCEPTED_BY_BOT') {
        await TradeHooks.onTradeCreated(trade.userId, trade.id);
      } else if (newStatus === 'AVAILABLE') {
        await TradeHooks.onTradeAvailable(trade.id);
      } else if (newStatus === 'FAILED') {
        // Log trade failure for debugging
        console.error(`Trade ${trade.id} failed for user ${trade.userId}`);
      }

      console.log(`✅ Trade ${trade.id} mis à jour avec succès: ${oldStatus} -> ${newStatus}`);
    } else {
      console.log(`ℹ️  Statut ignoré (non progression): ${oldStatus} -> ${newStatus}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook traité avec succès',
      trade: {
        id: trade.id,
        status: trade.status,
        updatedAt: trade.updatedAt,
      },
    });

  } catch (error) {
    console.error('❌ Erreur traitement webhook Skinplace:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

// Permettre les requêtes GET pour vérifier que le webhook est actif
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook Skinplace actif',
    timestamp: new Date().toISOString(),
  });
}

