import { prisma } from '../../prisma/prisma';

const MARGIN_RATE_DEFAULT = 0.05;

export type FragmentDemandGiveaway = {
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
};

export type FragmentDemandSeries = {
  frequency: string;
  ticketPrice: number;
  maxTickets: number;
};

/** Nombre d'instances attendues sur 30 jours pour une série récurrente. */
export function spawnsPer30Days(frequency: string): number {
  switch (frequency) {
    case 'DAILY':
      return 30;
    case 'WEEKLY':
      return 30 / 7;
    case 'MONTHLY':
      return 1;
    case 'YEARLY':
      return 1 / 12;
    default:
      return 0;
  }
}

/** Fragments nécessaires pour remplir les giveaways (prix × places). */
export function estimateGiveawayFragmentDemand(
  activeGiveaways: FragmentDemandGiveaway[],
  activeSeries: FragmentDemandSeries[] = []
) {
  let demandIfSoldOut = 0;
  let demandRemaining = 0;

  for (const giveaway of activeGiveaways) {
    const price = Math.max(0, giveaway.ticketPrice);
    const maxTickets = Math.max(0, giveaway.maxTickets);
    const soldTickets = Math.min(maxTickets, Math.max(0, giveaway.soldTickets));
    demandIfSoldOut += price * maxTickets;
    demandRemaining += price * (maxTickets - soldTickets);
  }

  let demandRecurring30d = 0;
  for (const series of activeSeries) {
    const perInstance = Math.max(0, series.ticketPrice) * Math.max(0, series.maxTickets);
    demandRecurring30d += Math.round(perInstance * spawnsPer30Days(series.frequency));
  }

  return {
    demandIfSoldOut,
    demandRemaining,
    demandRecurring30d,
  };
}

function startUtc(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

export async function getGamificationEconomyDashboard(marginRate = MARGIN_RATE_DEFAULT) {
  const d1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const d7 = startUtc(7);
  const d30 = startUtc(30);

  const [
    fragGen24h,
    fragGen7d,
    fragGen30d,
    fragSpent24h,
    fragSpent7d,
    fragSpent30d,
    fragByType,
    sumUserFragments,
    giveawayTotals,
    giveawayEndedAgg,
    entriesTotal,
    participantsDistinct,
    tradesVol7d,
    tradesVol30d,
    endedGiveawaysWithWinners,
    activeGiveawaysForDemand,
    activeSeriesForDemand,
  ] = await Promise.all([
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d1 }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d7 }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d30 }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d1 }, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d7 }, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.aggregate({
      where: { createdAt: { gte: d30 }, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.fragmentTransaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    }),
    prisma.user.aggregate({ _sum: { fragments: true } }),
    prisma.giveaway.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.giveaway.aggregate({
      where: { status: 'ENDED' },
      _count: true,
      _sum: { soldTickets: true, rewardValueCents: true },
    }),
    prisma.giveawayEntry.aggregate({ _count: true }),
    prisma.giveawayEntry.groupBy({ by: ['userId'] }).then((rows) => rows.length),
    prisma.trade.aggregate({
      where: { status: 'PAID', updatedAt: { gte: d7 } },
      _sum: { grossCents: true },
    }),
    prisma.trade.aggregate({
      where: { status: 'PAID', updatedAt: { gte: d30 } },
      _sum: { grossCents: true },
    }),
    prisma.giveaway.findMany({
      where: { status: 'ENDED' },
      select: {
        id: true,
        rewardValueCents: true,
        durationType: true,
        winnerCount: true,
        winners: { select: { id: true } },
        winnerId: true,
      },
    }),
    prisma.giveaway.findMany({
      where: { status: { in: ['ACTIVE', 'PAUSED'] } },
      select: { ticketPrice: true, maxTickets: true, soldTickets: true },
    }),
    prisma.giveawaySeries.findMany({
      where: { status: 'ACTIVE' },
      select: { frequency: true, ticketPrice: true, maxTickets: true },
    }),
  ]);

  const generatedTotal = fragByType
    .filter((r) => String(r.type).startsWith('GENERATED'))
    .reduce((s, r) => s + (r._sum.amount ?? 0), 0);
  const spentTotal = Math.abs(
    fragByType.filter((r) => r.type === 'SPENT_GIVEAWAY').reduce((s, r) => s + (r._sum.amount ?? 0), 0)
  );

  const circulationTheoretical = generatedTotal - spentTotal;
  const fragmentsUnused = sumUserFragments._sum.fragments ?? 0;
  const fragmentDemand = estimateGiveawayFragmentDemand(
    activeGiveawaysForDemand,
    activeSeriesForDemand
  );
  const coverageRatio =
    fragmentDemand.demandRemaining > 0 ? fragmentsUnused / fragmentDemand.demandRemaining : null;

  const volume7c = tradesVol7d._sum.grossCents ?? 0;
  const volume30c = tradesVol30d._sum.grossCents ?? 0;
  const grossBenefit7 = (volume7c / 100) * marginRate;
  const grossBenefit30 = (volume30c / 100) * marginRate;

  let giveawayCostEndedCents = 0;
  for (const g of endedGiveawaysWithWinners) {
    const n = g.winners.length > 0 ? g.winners.length : g.winnerId ? 1 : 0;
    giveawayCostEndedCents += g.rewardValueCents * n;
  }

  const cost7d = await prisma.giveaway
    .findMany({
      where: { status: 'ENDED', updatedAt: { gte: d7 } },
      select: {
        rewardValueCents: true,
        winners: { select: { id: true } },
        winnerId: true,
      },
    })
    .then((rows) =>
      rows.reduce((s, g) => {
        const n = g.winners.length > 0 ? g.winners.length : g.winnerId ? 1 : 0;
        return s + g.rewardValueCents * n;
      }, 0)
    );

  const cost30d = await prisma.giveaway
    .findMany({
      where: { status: 'ENDED', updatedAt: { gte: d30 } },
      select: {
        rewardValueCents: true,
        winners: { select: { id: true } },
        winnerId: true,
      },
    })
    .then((rows) =>
      rows.reduce((s, g) => {
        const n = g.winners.length > 0 ? g.winners.length : g.winnerId ? 1 : 0;
        return s + g.rewardValueCents * n;
      }, 0)
    );

  const gen30 = fragGen30d._sum.amount ?? 0;
  const spent30abs = Math.abs(fragSpent30d._sum.amount ?? 0);
  const utilRate30 = gen30 > 0 ? spent30abs / gen30 : 0;
  const ratioGame7 = grossBenefit7 > 0 ? cost7d / 100 / grossBenefit7 : null;
  const ratioGame30 = grossBenefit30 > 0 ? cost30d / 100 / grossBenefit30 : null;

  const giveawayCountByStatus = Object.fromEntries(giveawayTotals.map((g) => [g.status, g._count])) as Record<
    string,
    number
  >;

  const avgEntries =
    giveawayEndedAgg._count > 0 ? (giveawayEndedAgg._sum.soldTickets ?? 0) / giveawayEndedAgg._count : 0;

  const alerts: string[] = [];
  if (ratioGame30 != null && ratioGame30 > 0.15) alerts.push('Économie trop généreuse (giveaways / marge > 15%)');
  else if (ratioGame30 != null && ratioGame30 > 0.12) alerts.push('Giveaways coûteux vs marge — à surveiller');
  if (utilRate30 < 0.25 && gen30 > 100) alerts.push('Faible utilisation des fragments sur 30j');
  if (utilRate30 > 0.85 && gen30 > 100) alerts.push('Très forte consommation de fragments sur 30j');
  if (fragmentDemand.demandRemaining > fragmentsUnused * 3 && fragmentDemand.demandRemaining > 100) {
    alerts.push('Les giveaways actifs demandent bien plus de fragments que les soldes joueurs');
  } else if (
    fragmentsUnused > fragmentDemand.demandRemaining * 5 &&
    fragmentDemand.demandRemaining > 0 &&
    fragmentsUnused > 100
  ) {
    alerts.push('Les soldes fragments dépassent largement la demande des giveaways actifs');
  }

  const costByDuration = await prisma.giveaway.groupBy({
    by: ['durationType'],
    where: { status: 'ENDED' },
    _sum: { rewardValueCents: true },
    _count: true,
  });

  return {
    marginRateAssumption: marginRate,
    fragments: {
      generatedTotal: generatedTotal,
      generated24h: fragGen24h._sum.amount ?? 0,
      generated7d: fragGen7d._sum.amount ?? 0,
      generated30d: gen30,
      spentTotalGiveaways: spentTotal,
      spent24hAbs: Math.abs(fragSpent24h._sum.amount ?? 0),
      spent7dAbs: Math.abs(fragSpent7d._sum.amount ?? 0),
      spent30dAbs: spent30abs,
      circulationTheoretical,
      unusedOnBalances: fragmentsUnused,
      utilizationRate30d: utilRate30,
      demandIfSoldOut: fragmentDemand.demandIfSoldOut,
      demandRemaining: fragmentDemand.demandRemaining,
      demandRecurring30d: fragmentDemand.demandRecurring30d,
      coverageRatio,
      byType: fragByType,
    },
    giveaways: {
      countByStatus: giveawayCountByStatus,
      endedCount: giveawayEndedAgg._count,
      totalEntries: entriesTotal._count,
      approxUniqueParticipants: participantsDistinct,
      avgEntriesPerEndedGiveaway: avgEntries,
      totalEndedRewardCostCents: giveawayCostEndedCents,
      costLast7dCents: cost7d,
      costLast30dCents: cost30d,
      costByDurationType: costByDuration,
    },
    finance: {
      volumeSoldCents7d: volume7c,
      volumeSoldCents30d: volume30c,
      estimatedGrossBenefitEur7d: grossBenefit7,
      estimatedGrossBenefitEur30d: grossBenefit30,
      giveawayCostEur7d: cost7d / 100,
      giveawayCostEur30d: cost30d / 100,
      ratioGiveawayCostToBenefit7d: ratioGame7,
      ratioGiveawayCostToBenefit30d: ratioGame30,
    },
    alerts,
  };
}
