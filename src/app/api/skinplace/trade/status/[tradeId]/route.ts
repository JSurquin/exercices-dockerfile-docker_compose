import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { generateSkinplaceSignature } from '@/utils/skinplace-signature';

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

interface SkinplaceTradeStatusResponse {
  success: boolean;
  status?: string;
  steamtrade?: {
    tradeofferid: string;
    status: string;
    price: string;
    items_to_receive: number;
    created_at: number;
  };
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

    // Générer la signature pour l'API Skinplace
    const signature = generateSkinplaceSignature(trade.steamId, privateKey);

    // Appeler l'API Skinplace pour obtenir le statut du trade
    // Note: L'endpoint exact peut varier selon la documentation Skinplace
    const skinplaceResponse = await fetch(
      `https://api.skin.place/api/v3/instant/status/${trade.ticketId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MoonSkin/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    let skinplaceData: SkinplaceTradeStatusResponse | null = null;
    let skinplaceStatus: string | null = null;

    if (skinplaceResponse.ok) {
      skinplaceData = await skinplaceResponse.json();
      skinplaceStatus = skinplaceData?.status || skinplaceData?.steamtrade?.status || null;
      
      console.log(`📊 Statut Skinplace pour trade ${trade.id}:`, skinplaceStatus);
    } else {
      console.warn(`⚠️  Impossible de récupérer le statut Skinplace pour ${trade.id}`);
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

