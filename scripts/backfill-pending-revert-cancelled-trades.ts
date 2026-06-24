#!/usr/bin/env tsx
/**
 * Rattrape les trades CANCELLED/FAILED dont le solde pending n'a pas été reverté.
 *
 * Usage :
 *   npx tsx scripts/backfill-pending-revert-cancelled-trades.ts        # dry-run (lecture seule)
 *   npx tsx scripts/backfill-pending-revert-cancelled-trades.ts --fix  # application
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { TradeHooks } from '@/lib/trade-hooks';
import { currencyConverter } from '@/lib/currency-converter';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');

async function resolveEurCents(trade: {
  eurCentsAtCredit: number | null;
  netCents: number;
}): Promise<number> {
  if (trade.eurCentsAtCredit != null) return trade.eurCentsAtCredit;
  return currencyConverter.convertUsdCentsToEurCents(trade.netCents);
}

async function main() {
  console.log(
    DRY_RUN
      ? 'Mode dry-run — aucune modification en base\n'
      : 'Mode correction — revert pending en cours\n'
  );

  const trades = await prisma.trade.findMany({
    where: {
      status: { in: ['CANCELLED', 'FAILED'] },
      pendingRevertedAt: null,
      OR: [{ pendingCreditedAt: { not: null } }, { instantCreditedAt: { not: null } }],
    },
    select: {
      id: true,
      userId: true,
      status: true,
      netCents: true,
      eurCentsAtCredit: true,
      pendingCreditedAt: true,
      instantCreditedAt: true,
      user: {
        select: {
          id: true,
          steamId: true,
          pendingBalanceCents: true,
          balanceCents: true,
        },
      },
    },
    orderBy: { updatedAt: 'asc' },
  });

  if (trades.length === 0) {
    console.log('Aucun trade à rattraper.');
    return;
  }

  console.log(`${trades.length} trade(s) éligible(s) :\n`);

  const runningPendingByUser = new Map<string, number>();
  const runningBalanceByUser = new Map<string, number>();

  for (const trade of trades) {
    const eurCents = await resolveEurCents(trade);
    const pendingBefore =
      runningPendingByUser.get(trade.userId) ?? trade.user.pendingBalanceCents;
    const balanceBefore =
      runningBalanceByUser.get(trade.userId) ?? trade.user.balanceCents;

    let pendingAfter = pendingBefore;
    let balanceAfter = balanceBefore;

    if (trade.instantCreditedAt) {
      balanceAfter = balanceBefore - eurCents;
    } else if (trade.pendingCreditedAt) {
      pendingAfter = Math.max(0, pendingBefore - eurCents);
    }

    runningPendingByUser.set(trade.userId, pendingAfter);
    runningBalanceByUser.set(trade.userId, balanceAfter);

    console.log(
      [
        `tradeId=${trade.id}`,
        `status=${trade.status}`,
        `montantEurCents=${eurCents}`,
        `userId=${trade.user.id}`,
        `steamId=${trade.user.steamId ?? 'n/a'}`,
        `pendingAvant=${pendingBefore}`,
        `pendingApres=${pendingAfter}`,
        `balanceAvant=${balanceBefore}`,
        `balanceApres=${balanceAfter}`,
        `instantCredit=${trade.instantCreditedAt ? 'oui' : 'non'}`,
      ].join(' | ')
    );

    if (!DRY_RUN) {
      try {
        await TradeHooks.onTradeRolledBack(trade.userId, trade.id, 'backfill_script');
        console.log(`  -> revert appliqué pour ${trade.id}`);
      } catch (err) {
        console.error(`  -> ERREUR pour ${trade.id}:`, err);
      }
    }
  }

  if (DRY_RUN) {
    console.log('\nDry-run terminé. Relancez avec --fix pour appliquer.');
  } else {
    console.log('\nBackfill terminé.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
