import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';

/**
 * Endpoint pour récupérer et mettre à jour le statut d'un trade depuis Skinplace
 * 
 * GET /api/skinplace/trade/status/[tradeId]
 * 
 * Permet de :
 * - Vérifier le statut actuel d'un trade
 * - Synchroniser le statut avec Skinplace/Steam
 * - Mettre à jour la base de données
 */

// Interfaces gardées pour référence mais on parse dynamiquement
interface SkinplaceTradeStatusResponse {
  success?: boolean;
  status?: string;
  steamtrade?: { status?: string; [key: string]: unknown };
  payment?: { status?: string; [key: string]: unknown };
  data?: Array<{ steamtrade?: { status?: string }; payment?: { status?: string } }>;
  error?: string;
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
    'finished': 'AVAILABLE',
    'done': 'AVAILABLE',
    
    // Annulé
    'cancelled': 'CANCELLED',
    // Échecs techniques
    'declined': 'FAILED',
    'rejected': 'FAILED',
    'expired': 'FAILED',
    'failed': 'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { tradeId } = params;

    // Récupérer le trade depuis la base de données
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!trade) {
      return NextResponse.json(
        { success: false, error: 'Trade non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut accéder à ce trade
    if (trade.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Si le trade est déjà payé ou en cours de paiement, ne pas vérifier Skinplace
    if (trade.status === 'PAID' || trade.status === 'PAYOUT_PENDING') {
      return NextResponse.json({
        success: true,
        trade: {
          id: trade.id,
          status: trade.status,
          updatedAt: trade.updatedAt,
          availableAt: trade.availableAt,
          message: 'Trade déjà traité, statut local utilisé',
        },
      });
    }

    // Récupérer les clés API
    const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
    const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;

    if (!privateKey || !publicKey) {
      console.error('Clés API Skinplace manquantes');
      // Retourner le statut local si pas de clés API
      return NextResponse.json({
        success: true,
        trade: {
          id: trade.id,
          status: trade.status,
          updatedAt: trade.updatedAt,
          availableAt: trade.availableAt,
          message: 'Configuration API manquante, statut local utilisé',
        },
      });
    }

    let skinplaceStatus: string | null = null;

    // Stratégie 1 : GET /api/v3/instant/payment/trade/{skinplaceToken}
    // C'est l'endpoint officiel — nécessite le token Skinplace retourné à la création
    if (trade.skinplaceToken) {
      const res = await fetch(
        `https://api.skin.place/api/v3/instant/payment/trade/${trade.skinplaceToken}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${privateKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MoonSkin/1.0',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        skinplaceStatus = data?.steamtrade?.status || data?.payment?.status || null;
        console.log(`📊 [strategy1] Statut Skinplace pour trade ${trade.id}:`, skinplaceStatus, data);
      } else {
        console.warn(`⚠️  [strategy1] Échec GET payment/trade/${trade.skinplaceToken}: ${res.status}`);
      }
    }

    // Stratégie 2 (fallback) : POST /api/v3/instant/history avec order_ids
    // Utilise notre order_id (ticketId) pour retrouver le trade dans l'historique
    if (!skinplaceStatus) {
      const res = await fetch('https://api.skin.place/api/v3/instant/history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${privateKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'MoonSkin/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ order_ids: [trade.ticketId], limit: 1 }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        const entry = data?.data?.[0];
        skinplaceStatus = entry?.steamtrade?.status || entry?.payment?.status || null;
        console.log(`📊 [strategy2] Statut Skinplace pour trade ${trade.id}:`, skinplaceStatus, entry);
      } else {
        console.warn(`⚠️  [strategy2] Échec instant/history: ${res.status}`);
      }
    }

    // Si on a un statut de Skinplace, mettre à jour le trade
    if (skinplaceStatus) {
      const newStatus = mapSkinplaceStatusToTradeStatus(skinplaceStatus);
      const oldStatus = trade.status;

      // Ordre de progression des statuts
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

      // Mettre à jour uniquement si le statut progresse ou devient FAILED/CANCELLED
      if (newStatus === 'FAILED' || newStatus === 'CANCELLED' || newStatusIndex > oldStatusIndex) {
        // Calculer la date de disponibilité
        let availableAt = trade.availableAt;
        if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
          availableAt = new Date();
          availableAt.setDate(availableAt.getDate() + 7);
        } else if (newStatus === 'AVAILABLE') {
          availableAt = new Date();
        }

        // Mettre à jour le trade
        const updatedTrade = await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status: newStatus,
            availableAt,
            tradeAcceptedAt: newStatus === 'ACCEPTED_BY_BOT' ? new Date() : trade.tradeAcceptedAt,
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
              source: 'manual_check',
            },
            ipAddress: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
          },
        });

        console.log(`✅ Trade ${trade.id} mis à jour: ${oldStatus} -> ${newStatus}`);

        return NextResponse.json({
          success: true,
          trade: {
            id: updatedTrade.id,
            status: updatedTrade.status,
            oldStatus,
            updatedAt: updatedTrade.updatedAt,
            availableAt: updatedTrade.availableAt,
            skinplaceStatus,
            message: 'Statut mis à jour depuis Skinplace',
          },
        });
      }
    }

    // Retourner le statut actuel si pas de mise à jour
    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        status: trade.status,
        updatedAt: trade.updatedAt,
        availableAt: trade.availableAt,
        skinplaceStatus,
        message: skinplaceStatus 
          ? 'Statut inchangé'
          : 'Statut Skinplace non disponible, statut local utilisé',
      },
    });

  } catch (error) {
    console.error('❌ Erreur vérification statut trade:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de la vérification du statut' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

