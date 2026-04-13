import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { skinplaceService } from '@/lib/skinplace';

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

/**
 * Mapper les statuts Skinplace/Steam vers nos statuts TradeStatus
 */
function mapSkinplaceStatusToTradeStatus(skinplaceStatus: string): TradeStatus {
  // Skinplace steamtrade.status enum: "active" | "pending" | "cancelled" | "finished"
  // "pending"  = trade en cours de création côté bot
  // "active"   = offre Steam envoyée par le bot, en attente d'acceptation par l'utilisateur
  // "finished" = l'utilisateur a accepté l'offre Steam → en trade hold 7-8 jours
  // "cancelled"= annulé (utilisateur ou bot)
  const statusMap: Record<string, TradeStatus> = {
    'pending': 'CREATED',
    'sent':    'CREATED',

    // Bot a envoyé l'offre, en attente d'acceptation utilisateur
    'active':   'ACCEPTED_BY_BOT',

    // Utilisateur a accepté → entre en trade hold Steam
    'finished': 'IN_TRADE_HOLD',

    // Annulé
    'cancelled': 'CANCELLED',
    // Échecs techniques
    'declined':  'FAILED',
    'rejected':  'FAILED',
    'expired':   'FAILED',
    'failed':    'FAILED',
    'error':     'FAILED',
  };

  return statusMap[skinplaceStatus.toLowerCase()] || 'CREATED';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
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

    const { tradeId } = await params;

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

    // Statuts terminaux : retourner directement le statut DB sans appel Skinplace
    if (trade.status === 'PAID' || trade.status === 'PAYOUT_PENDING' ||
        trade.status === 'CANCELLED' || trade.status === 'FAILED') {
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

    let skinplaceStatus: string | null = null;

    // Stratégie 1 : lookup direct par skinplaceToken via skinplaceService (Bearer auth)
    if (trade.skinplaceToken) {
      try {
        const data = await skinplaceService.getTradeStatus(trade.skinplaceToken);
        skinplaceStatus = (data as any)?.steamtrade?.status || (data as any)?.payment?.status || null;
        console.log(`📊 [strategy=token] Statut Skinplace pour trade ${trade.id}:`, skinplaceStatus);
      } catch (e) {
        console.warn(`⚠️  [strategy=token] Exception pour trade ${trade.id}:`, e);
      }
    } else {
      console.warn(`⚠️  skinplaceToken null pour trade ${trade.id}, fallback order_id (ticketId: ${trade.ticketId})`);
    }

    // Stratégie 2 : fallback via /instant/history avec order_ids (notre ticketId = order_id envoyé à Skinplace)
    if (!skinplaceStatus && trade.ticketId) {
      try {
        const historyData = await skinplaceService.getInstantHistoryByOrderIds([trade.ticketId]);
        const entry = (historyData as any)?.data?.[0];
        if (entry) {
          skinplaceStatus = entry?.steamtrade?.status || entry?.payment?.status || null;
          // Sauvegarder le token Skinplace pour éviter ce fallback aux prochains appels
          const foundToken: string | undefined = entry?.token;
          if (foundToken && !trade.skinplaceToken) {
            await prisma.trade.update({
              where: { id: trade.id },
              data: { skinplaceToken: foundToken },
            });
            console.log(`💾 skinplaceToken récupéré via history et sauvegardé pour trade ${trade.id}`);
          }
          console.log(`📊 [strategy=history] Statut Skinplace pour trade ${trade.id}:`, skinplaceStatus);
        } else {
          console.warn(`⚠️  [strategy=history] Aucune entrée pour order_id ${trade.ticketId}`);
        }
      } catch (e) {
        console.warn(`⚠️  [strategy=history] Exception pour trade ${trade.id}:`, e);
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

