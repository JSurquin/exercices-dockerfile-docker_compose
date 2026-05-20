import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { currencyConverter } from '@/lib/currency-converter';

/**
 * GET /api/user/balance-history
 * Retourne l'évolution du solde disponible sur les 30 derniers jours
 * en reconstituant le solde jour par jour depuis les BalanceTransaction.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const days = 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balanceCents: true, pendingBalanceCents: true, frozenBalanceCents: true },
    });
    const currentBalance = user?.balanceCents ?? 0;
    const userPendingBalance = user?.pendingBalanceCents ?? 0;
    const frozenBalance = user?.frozenBalanceCents ?? 0;
    const availableCents = Math.max(0, currentBalance - frozenBalance);

    // Trades en attente de fin de trade hold — source de vérité pour la projection UI.
    // Ne pas exiger pendingCreditedAt : l'IPN #1 peut être manqué tout en étant IN_TRADE_HOLD.
    const holdTrades = await prisma.trade.findMany({
      where: {
        userId,
        balanceCreditedAt: null,
        instantCreditedAt: null,
        status: { in: ['IN_TRADE_HOLD', 'ACCEPTED_BY_BOT'] },
      },
      select: { availableAt: true, netCents: true, eurCentsAtCredit: true },
      orderBy: { availableAt: 'asc' },
    });

    let pendingFromTradesCents = 0;
    for (const trade of holdTrades) {
      if (trade.eurCentsAtCredit != null) {
        pendingFromTradesCents += trade.eurCentsAtCredit;
      } else {
        pendingFromTradesCents += await currencyConverter.convertUsdCentsToEurCents(trade.netCents);
      }
    }

    // Prendre le max : couvre IPN #1 manqué (pendingBalance=0 mais trades en hold)
    const pendingBalanceCents = Math.max(userPendingBalance, pendingFromTradesCents);
    const projectedAvailableCents = availableCents + pendingBalanceCents;
    const nextReleaseAt = holdTrades.find((t) => t.availableAt)?.availableAt?.toISOString() ?? null;

    // Toutes les transactions depuis le début de la fenêtre (uniquement les transactions
    // qui affectent balanceCents : TRADE_CREDIT et WITHDRAWAL)
    const transactions = await prisma.balanceTransaction.findMany({
      where: {
        userId,
        type: { in: ['TRADE_CREDIT', 'WITHDRAWAL', 'ADMIN_ADJUSTMENT', 'PAYOUT_REFUND'] },
      },
      select: {
        createdAt: true,
        amountCents: true,
        type: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Regrouper les deltas par jour (clé = "YYYY-MM-DD")
    const deltaByDay = new Map<string, number>();
    for (const tx of transactions) {
      const key = tx.createdAt.toISOString().slice(0, 10);
      deltaByDay.set(key, (deltaByDay.get(key) ?? 0) + tx.amountCents);
    }

    // Construire le tableau de 30 jours, du plus récent au plus ancien
    const days30: { date: string; balanceCents: number }[] = [];
    let runningBalance = currentBalance;

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);

      // Pour ce jour, si i > 0, on soustrait les deltas du jour i-1 (hier relatif)
      // i.e. on remonte en soustrayant ce qui s'est passé le jour suivant
      if (i > 0) {
        const prevKey = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
        runningBalance -= deltaByDay.get(prevKey) ?? 0;
      }

      days30.push({ date: key, balanceCents: Math.max(0, runningBalance) });
    }

    // Inverser pour avoir l'ordre chronologique (le plus ancien en premier)
    days30.reverse();

    // Calculer variation : différence entre aujourd'hui et il y a 7 jours
    const last7 = days30.slice(-7);
    const oldest = last7[0]?.balanceCents ?? 0;
    const newest = last7[last7.length - 1]?.balanceCents ?? 0;
    const variationCents = newest - oldest;
    const variationPct = oldest > 0 ? ((variationCents / oldest) * 100) : 0;

    return NextResponse.json({
      history: days30,
      variationCents,
      variationPct: Math.round(variationPct * 10) / 10,
      currentBalanceCents: currentBalance,
      availableCents,
      frozenBalanceCents: frozenBalance,
      pendingBalanceCents,
      projectedAvailableCents,
      pendingTradesCount: holdTrades.length,
      nextReleaseAt,
    });
  } catch (error) {
    console.error('[api/user/balance-history]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
