import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { skinplaceService } from '@/lib/skinplace';
import { resolveMoonSkinTradeStatusFromSkinplaceApi } from '@/lib/skinplace-trade-status-resolve';
import { TradeHooks } from '@/lib/trade-hooks';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/lib/require-session-user';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const session = await requireUserSession(request);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const adminSession = await requireAdminSessionWithDbCheck(request);

    const { tradeId } = await params;
    logger.info(`[STATUS] GET trade status request for tradeId=${tradeId}`);

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true, items: true },
    });

    if (!trade) {
      logger.warn(`[STATUS] Trade not found: tradeId=${tradeId}`);
      return NextResponse.json(
        { success: false, error: 'Trade non trouvé' },
        { status: 404 }
      );
    }

    if (trade.userId !== session.user.id && !adminSession) {
      logger.warn(`[STATUS] Access denied for trade ${tradeId}`);
      return NextResponse.json(
        { success: false, error: 'Acces non autorisé' },
        { status: 403 }
      );
    }

    logger.info(`[STATUS] Trade found: id=${trade.id} status=${trade.status}`);

    // Si le trade est AVAILABLE mais que le solde n'a jamais été crédité,
    // on rattrape le crédit sans re-appeler Skinplace.
    if (trade.status === 'AVAILABLE' && !trade.balanceCreditedAt) {
      logger.info(`[STATUS] Trade ${trade.id} AVAILABLE but balanceCreditedAt=null — catching up credit`);
      let balanceCredited = false;
      try {
        await TradeHooks.onTradeAvailable(trade.id);
        balanceCredited = true;
      } catch (hookError) {
        console.error(`[STATUS] TradeHooks.onTradeAvailable error for trade ${trade.id}:`, hookError);
      }
      return NextResponse.json({
        success: true,
        trade: {
          id: trade.id,
          status: trade.status,
          updatedAt: trade.updatedAt,
          availableAt: trade.availableAt,
          balanceCredited,
          message: balanceCredited
            ? 'Solde crédité (rattrapage)'
            : 'Erreur lors du rattrapage du crédit',
        },
      });
    }

    // Statuts terminaux : retourner directement le statut DB sans appel Skinplace
    if (
      trade.status === 'PAID' ||
      trade.status === 'PAYOUT_PENDING' ||
      trade.status === 'CANCELLED' ||
      trade.status === 'FAILED' ||
      trade.status === 'AVAILABLE'
    ) {
      logger.info(`[STATUS] Terminal status "${trade.status}" — skipping Skinplace call`);
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

    let skinplacePayload: unknown = null;

    // Stratégie 1 : lookup direct par skinplaceToken via skinplaceService (Bearer auth)
    if (trade.skinplaceToken) {
      logger.info(`[STATUS] Strategy 1 — fetching trade by token`);
      try {
        skinplacePayload = await skinplaceService.getTradeStatus(trade.skinplaceToken);
        logger.debug(`[STATUS] [strategy=token] Payload received`);
      } catch (e) {
        logger.warn(`[STATUS] [strategy=token] Exception occurred`);
      }
    } else {
      logger.warn(`[STATUS] skinplaceToken NULL for trade ${trade.id} — falling back to history`);
    }

    // Stratégie 2 : fallback via /instant/history avec order_ids (notre ticketId = order_id envoyé à Skinplace)
    if (!skinplacePayload && trade.ticketId) {
      logger.info(`[STATUS] Strategy 2 — fetching via instant history`);
      try {
        const historyData = await skinplaceService.getInstantHistoryByOrderIds([trade.ticketId]);
        const entry = (historyData as { data?: unknown[] })?.data?.[0];
        if (entry) {
          skinplacePayload = entry;
          const foundToken: string | undefined = (entry as { token?: string }).token;
          if (foundToken && !trade.skinplaceToken) {
            await prisma.trade.update({
              where: { id: trade.id },
              data: { skinplaceToken: foundToken },
            });
            logger.info(`[STATUS] skinplaceToken recovered via history and saved`);
          }
          logger.debug(`[STATUS] [strategy=history] Entry found`);
        } else {
          logger.warn(`[STATUS] [strategy=history] No entry found for trade ${trade.id}`);
        }
      } catch (e) {
        logger.warn(`[STATUS] [strategy=history] Exception occurred`);
      }
    }

    if (!skinplacePayload) {
      console.error(`[STATUS] Both strategies failed for trade ${trade.id} — no Skinplace data available`);
    }

    const resolved = skinplacePayload
      ? resolveMoonSkinTradeStatusFromSkinplaceApi(skinplacePayload)
      : null;
    const newStatus = resolved?.status ?? null;
    const skinplaceDebug = resolved?.debug ?? null;

    logger.info(`[STATUS] Resolution: payload=${skinplacePayload ? 'OK' : 'NULL'} newStatus=${newStatus ?? 'NULL'}`);

    if (newStatus && skinplaceDebug) {
      const oldStatus = trade.status;

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

      logger.info(`[STATUS] Progression: "${oldStatus}"(${oldStatusIndex}) -> "${newStatus}"(${newStatusIndex})`);

      if (newStatus === 'FAILED' || newStatus === 'CANCELLED' || newStatusIndex > oldStatusIndex) {
        let availableAt = trade.availableAt;
        if (newStatus === 'ACCEPTED_BY_BOT' && !availableAt) {
          availableAt = new Date();
          availableAt.setDate(availableAt.getDate() + 7);
        } else if (newStatus === 'AVAILABLE') {
          availableAt = new Date();
        }

        const updatedTrade = await prisma.trade.update({
          where: { id: trade.id },
          data: {
            status: newStatus,
            availableAt,
            tradeAcceptedAt: newStatus === 'ACCEPTED_BY_BOT' ? new Date() : trade.tradeAcceptedAt,
            updatedAt: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: trade.userId,
            action: 'TRADE_STATUS_UPDATED',
            details: {
              tradeId: trade.id,
              oldStatus,
              newStatus,
              skinplaceDebug,
              source: 'polling_check',
            },
            ipAddress:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown',
          },
        });

        logger.info(`[STATUS] Trade ${trade.id} updated: ${oldStatus} -> ${newStatus}`);

        // Déclencher les hooks de balance (même logique que le webhook IPN)
        let balanceCredited = false;
        try {
          await TradeHooks.applyStatusProgressionHooks(trade.userId, trade.id, oldStatus, newStatus);
          if (newStatus === 'AVAILABLE') {
            balanceCredited = true;
          }
        } catch (hookError) {
          console.error(`[STATUS] TradeHooks error for trade ${trade.id}:`, hookError);
          balanceCredited = false;
        }

        const detailMsg = `Source: ${skinplaceDebug.effectiveSource} (steamtrade=${skinplaceDebug.steamtradeStatus ?? '?'}, payment=${skinplaceDebug.paymentStatus ?? '?'})`;

        return NextResponse.json({
          success: true,
          trade: {
            id: updatedTrade.id,
            status: updatedTrade.status,
            oldStatus,
            updatedAt: updatedTrade.updatedAt,
            availableAt: updatedTrade.availableAt,
            skinplaceStatus: skinplaceDebug.effectiveSource,
            skinplaceDebug,
            balanceCredited,
            message: balanceCredited
              ? `Statut mis a jour — fonds libérés et solde crédité`
              : `Statut mis a jour — ${detailMsg}`,
          },
        });
      }

      // Résolu côté API externe mais pas d'évolution autorisée
      logger.info(`[STATUS] No progression allowed: local="${oldStatus}" skinplace="${newStatus}"`);
      const noMoveMsg = `Statut inchangé — local: ${trade.status}, distant: ${newStatus} (${skinplaceDebug.effectiveSource})`;
      return NextResponse.json({
        success: true,
        trade: {
          id: trade.id,
          status: trade.status,
          updatedAt: trade.updatedAt,
          availableAt: trade.availableAt,
          skinplaceStatus: skinplaceDebug.effectiveSource,
          skinplaceDebug,
          message: noMoveMsg,
        },
      });
    }

    // Pas de payload exploitable
    console.error(`[STATUS] Returning local status for trade ${trade.id} — check SKINPLACE_API_KEY config`);
    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        status: trade.status,
        updatedAt: trade.updatedAt,
        availableAt: trade.availableAt,
        skinplaceStatus: null,
        skinplaceDebug: null,
        message:
          'Statut externe non disponible. Statut local conservé.',
      },
    });

  } catch (error) {
    console.error('[STATUS] Erreur vérification statut trade:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de la vérification du statut' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      },
      { status: 500 }
    );
  }
}
