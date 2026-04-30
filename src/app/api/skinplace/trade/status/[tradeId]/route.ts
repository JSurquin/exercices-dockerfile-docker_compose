import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { skinplaceService } from '@/lib/skinplace';
import { resolveMoonSkinTradeStatusFromSkinplaceApi } from '@/lib/skinplace-trade-status-resolve';
import { TradeHooks } from '@/lib/trade-hooks';

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
    console.log(`[STATUS] --> GET /api/skinplace/trade/status/${tradeId} par user=${session.user.id}`);

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true, items: true },
    });

    if (!trade) {
      console.warn(`[STATUS] Trade introuvable en DB: tradeId="${tradeId}"`);
      return NextResponse.json(
        { success: false, error: 'Trade non trouvé' },
        { status: 404 }
      );
    }

    if (trade.userId !== session.user.id && session.user.role !== 'ADMIN') {
      console.warn(`[STATUS] Acces refuse: trade.userId="${trade.userId}" != session.user.id="${session.user.id}"`);
      return NextResponse.json(
        { success: false, error: 'Acces non autorisé' },
        { status: 403 }
      );
    }

    console.log(`[STATUS] Trade trouvé: id="${trade.id}" status="${trade.status}" skinplaceToken="${trade.skinplaceToken ?? 'NULL'}" ticketId="${trade.ticketId ?? 'NULL'}"`);

    // Si le trade est AVAILABLE mais que le solde n'a jamais été crédité,
    // on rattrape le crédit sans re-appeler Skinplace.
    if (trade.status === 'AVAILABLE' && !trade.balanceCreditedAt) {
      console.log(`[STATUS] Trade ${trade.id} déjà AVAILABLE mais balanceCreditedAt=null — rattrapage crédit`);
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
      console.log(`[STATUS] Statut terminal "${trade.status}" — pas d'appel Skinplace`);
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
      console.log(`[STATUS] Stratégie 1 — GET /api/v3/instant/payment/trade/${trade.skinplaceToken}`);
      try {
        skinplacePayload = await skinplaceService.getTradeStatus(trade.skinplaceToken);
        console.log(`[STATUS] [strategy=token] Payload reçu:`, JSON.stringify(skinplacePayload, null, 2));
      } catch (e) {
        console.warn(`[STATUS] [strategy=token] Exception:`, e);
      }
    } else {
      console.warn(`[STATUS] skinplaceToken NULL pour trade ${trade.id} — fallback sur ticketId/order_id="${trade.ticketId}"`);
    }

    // Stratégie 2 : fallback via /instant/history avec order_ids (notre ticketId = order_id envoyé à Skinplace)
    if (!skinplacePayload && trade.ticketId) {
      console.log(`[STATUS] Stratégie 2 — POST /api/v3/instant/history avec order_ids=["${trade.ticketId}"]`);
      try {
        const historyData = await skinplaceService.getInstantHistoryByOrderIds([trade.ticketId]);
        console.log(`[STATUS] [strategy=history] Réponse brute:`, JSON.stringify(historyData, null, 2));
        const entry = (historyData as { data?: unknown[] })?.data?.[0];
        if (entry) {
          skinplacePayload = entry;
          const foundToken: string | undefined = (entry as { token?: string }).token;
          if (foundToken && !trade.skinplaceToken) {
            await prisma.trade.update({
              where: { id: trade.id },
              data: { skinplaceToken: foundToken },
            });
            console.log(`[STATUS] skinplaceToken "${foundToken}" récupéré via history et sauvegardé`);
          }
          console.log(`[STATUS] [strategy=history] Entrée trouvée:`, JSON.stringify(entry, null, 2));
        } else {
          console.warn(`[STATUS] [strategy=history] Aucune entrée pour order_id="${trade.ticketId}" — data brut:`, (historyData as any)?.data);
        }
      } catch (e) {
        console.warn(`[STATUS] [strategy=history] Exception:`, e);
      }
    }

    if (!skinplacePayload) {
      console.error(`[STATUS] Les deux stratégies ont échoué pour trade ${trade.id} — aucune donnée Skinplace disponible`);
    }

    const resolved = skinplacePayload
      ? resolveMoonSkinTradeStatusFromSkinplaceApi(skinplacePayload)
      : null;
    const newStatus = resolved?.status ?? null;
    const skinplaceDebug = resolved?.debug ?? null;

    console.log(`[STATUS] Resolution: skinplacePayload=${skinplacePayload ? 'OK' : 'NULL'} | newStatus="${newStatus ?? 'NULL'}" | debug=${JSON.stringify(skinplaceDebug)}`);

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

      console.log(`[STATUS] Progression: "${oldStatus}"(idx=${oldStatusIndex}) -> "${newStatus}"(idx=${newStatusIndex}) | terminal=${newStatus === 'FAILED' || newStatus === 'CANCELLED'}`);

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

        console.log(`[STATUS] Trade ${trade.id} mis a jour: ${oldStatus} -> ${newStatus}`, skinplaceDebug);

        // Déclencher les hooks de balance (même logique que le webhook IPN)
        let balanceCredited = false;
        try {
          if (newStatus === 'ACCEPTED_BY_BOT') {
            await TradeHooks.onTradeAccepted(trade.userId, trade.id);
          } else if (newStatus === 'AVAILABLE') {
            await TradeHooks.onTradeAvailable(trade.id);
            balanceCredited = true;
          }
        } catch (hookError) {
          console.error(`[STATUS] TradeHooks error for trade ${trade.id}:`, hookError);
          balanceCredited = false;
        }

        const detailMsg = `Skinplace: ${skinplaceDebug.effectiveSource} (steamtrade=${skinplaceDebug.steamtradeStatus ?? '?'}, payment=${skinplaceDebug.paymentStatus ?? '?'})`;

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
              : `Statut mis a jour depuis Skinplace — ${detailMsg}`,
          },
        });
      }

      // Résolu côté Skinplace mais pas d'évolution autorisée
      console.log(`[STATUS] Pas de progression autorisée: local="${oldStatus}"(idx=${oldStatusIndex}) Skinplace->"${newStatus}"(idx=${newStatusIndex}) source="${skinplaceDebug.effectiveSource}"`);
      const noMoveMsg = `Statut inchangé — local: ${trade.status}, Skinplace->${newStatus} (${skinplaceDebug.effectiveSource})`;
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
    console.error(`[STATUS] Retour statut local sans appel Skinplace pour trade ${trade.id} — vérifiez SKINPLACE_API_KEY, skinplaceToken et order_id`);
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
          'Statut Skinplace non disponible (vérifiez SKINPLACE_API_KEY et skinplaceToken / order_id). Statut local conservé.',
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
