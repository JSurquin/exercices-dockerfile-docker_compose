import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import { TradeStatus } from '@prisma/client';
import { syncTradeStatusFromSkinplace } from '@/lib/skinplace-trade-sync';

// Statuts actifs pour lesquels le polling a du sens
const SYNCABLE_STATUSES: TradeStatus[] = ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD', 'AVAILABLE'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { tradeId } = await params;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true },
    });

    if (!trade) {
      return NextResponse.json({ error: 'Trade introuvable' }, { status: 404 });
    }

    const adminGate = await requireAdminSessionWithDbCheck(request);
    const isAdmin = !!adminGate;
    if (!isAdmin && trade.userId !== session.user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!SYNCABLE_STATUSES.includes(trade.status)) {
      return NextResponse.json(
        { error: `Sync impossible sur un trade en statut ${trade.status}` },
        { status: 400 }
      );
    }

    if (!trade.ticketId && !trade.skinplaceToken) {
      return NextResponse.json(
        { error: 'Ce trade n\'a pas de référence Skinplace enregistrée' },
        { status: 400 }
      );
    }

    const oldStatus = trade.status;
    const result = await syncTradeStatusFromSkinplace(
      {
        id: trade.id,
        userId: trade.userId,
        ticketId: trade.ticketId,
        skinplaceToken: trade.skinplaceToken,
        status: trade.status,
        availableAt: trade.availableAt,
        tradeAcceptedAt: trade.tradeAcceptedAt,
      },
      isAdmin ? 'admin_manual_sync' : 'user_manual_sync',
    );

    if (!result.updated) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_TRADE_SYNC_NO_CHANGE',
          details: {
            tradeId,
            currentStatus: oldStatus,
            reason: result.reason,
            triggeredBy: session.user.id,
          },
        },
      });

      return NextResponse.json({
        synced: false,
        message: 'Aucun changement de statut détecté',
        currentStatus: oldStatus,
        reason: result.reason,
      });
    }

    return NextResponse.json({
      synced: true,
      message: `Statut mis à jour: ${result.oldStatus} → ${result.newStatus}`,
      oldStatus: result.oldStatus,
      newStatus: result.newStatus,
      effectiveSource: result.effectiveSource,
    });
  } catch (error) {
    console.error('[Skinplace Sync] Error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout lors de l\'appel Skinplace' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
