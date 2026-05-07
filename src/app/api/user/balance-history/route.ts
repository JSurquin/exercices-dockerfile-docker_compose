import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';

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
      select: { balanceCents: true, pendingBalanceCents: true },
    });
    const currentBalance = user?.balanceCents ?? 0;
    const pendingBalance = user?.pendingBalanceCents ?? 0;

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
      pendingBalanceCents: pendingBalance,
    });
  } catch (error) {
    console.error('[api/user/balance-history]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
