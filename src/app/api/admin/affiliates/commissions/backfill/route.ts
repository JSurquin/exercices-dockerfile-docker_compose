import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSession } from '@/lib/require-admin';
import { TradeHooks } from '@/lib/trade-hooks';

/**
 * POST /api/admin/affiliates/commissions/backfill
 * Crédite les commissions legacy (balanceCreditedAt null) pour les trades encore valides.
 */
export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdminSession(request);
    if (!adminSession) {
      return NextResponse.json({ success: false, error: 'Accès non autorisé' }, { status: 403 });
    }

    const uncredited = await prisma.affiliateCommission.findMany({
      where: {
        balanceCreditedAt: null,
        status: { in: ['PENDING', 'APPROVED', 'PAYOUT_REQUESTED'] },
        tradeId: { not: null },
        trade: {
          status: { in: ['AVAILABLE', 'PAYOUT_PENDING', 'PAID'] },
        },
      },
      select: { tradeId: true },
      take: 100,
    });

    const tradeIds = [
      ...new Set(
        uncredited
          .map((c: { tradeId: string | null }) => c.tradeId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    let processed = 0;
    let errors = 0;

    for (const tradeId of tradeIds) {
      try {
        await prisma.trade.update({
          where: { id: tradeId },
          data: { affiliateCommissionProcessedAt: null },
        });
        await TradeHooks.processAffiliateCommission(tradeId, { skipHoldCheck: true });
        processed++;
      } catch (err) {
        errors++;
        console.error(`[Backfill] Failed for trade ${tradeId}:`, err);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        action: 'AFFILIATE_COMMISSIONS_BACKFILLED',
        details: { tradeIds, processed, errors },
      },
    });

    return NextResponse.json({
      success: true,
      data: { processed, errors, tradeCount: tradeIds.length },
    });
  } catch (error) {
    console.error('Erreur backfill commissions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
