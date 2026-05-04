import { NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { TradeHooks } from '@/lib/trade-hooks';

const MAX_PER_REQUEST = 25;

/**
 * POST /api/user/trades/reconcile-overdue
 *
 * 3ᵉ filet de sécurité : trades de l'utilisateur encore IN_TRADE_HOLD alors que
 * availableAt est dépassé (webhook IPN #2 manquant, etc.). Même logique que
 * POST /api/cron/process-trades mais limité au user connecté + idempotent via TradeHooks.
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const now = new Date();

    const overdue = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        status: 'IN_TRADE_HOLD',
        availableAt: { lte: now },
      },
      select: { id: true },
      take: MAX_PER_REQUEST,
      orderBy: { availableAt: 'asc' },
    });

    let processed = 0;
    const errors: string[] = [];

    for (const row of overdue) {
      try {
        await prisma.trade.update({
          where: { id: row.id },
          data: { status: 'AVAILABLE' },
        });
        await TradeHooks.onTradeStatusChanged(row.id, 'IN_TRADE_HOLD', 'AVAILABLE');
        processed++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        errors.push(`${row.id}: ${msg}`);
        console.error(`[reconcile-overdue] trade ${row.id}:`, e);
      }
    }

    if (processed > 0 || errors.length > 0) {
      await prisma.auditLog
        .create({
          data: {
            userId: session.user.id,
            action: 'TRADE_RECONCILE_OVERDUE',
            details: {
              found: overdue.length,
              processed,
              errors: errors.slice(0, 10),
              source: 'user_dashboard_polling',
            },
            ipAddress: 'self-service',
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      found: overdue.length,
      processed,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('[reconcile-overdue]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
