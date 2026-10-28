#!/usr/bin/env tsx
/**
 * Rattrapage local — crédite les commissions affilié legacy sur balanceCents.
 * Usage : pnpm tsx scripts/local/backfill-affiliate-commissions.ts
 * (scripts/local/ est gitignored — ne pas committer)
 */
import 'dotenv/config';
import { prisma } from '../../prisma/prisma';
import { AffiliateService } from '../../src/lib/affiliate-service';

const BATCH_SIZE = 100;

async function fetchUncreditedTradeIds(): Promise<string[]> {
  const rows = await prisma.affiliateCommission.findMany({
    where: {
      balanceCreditedAt: null,
      status: { in: ['PENDING', 'APPROVED', 'PAYOUT_REQUESTED'] },
      tradeId: { not: null },
      trade: {
        status: { in: ['AVAILABLE', 'PAYOUT_PENDING', 'PAID'] },
      },
    },
    select: { tradeId: true },
    take: BATCH_SIZE,
  });

  return [
    ...new Set(
      rows.map((r) => r.tradeId).filter((id): id is string => Boolean(id))
    ),
  ];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant — vérifie ton .env');
    process.exit(1);
  }

  const dbHost = process.env.DATABASE_URL.replace(/\/\/([^@]+@)?/, '//***@').slice(0, 80);
  console.log(`🔗 BDD : ${dbHost}…`);
  console.log('🔄 Rattrapage commissions affilié (legacy → balanceCents)\n');

  let totalProcessed = 0;
  let totalErrors = 0;
  let batch = 0;

  for (;;) {
    const tradeIds = await fetchUncreditedTradeIds();
    if (tradeIds.length === 0) break;

    batch++;
    console.log(`--- Batch ${batch} : ${tradeIds.length} trade(s) ---`);

    for (const tradeId of tradeIds) {
      try {
        await prisma.trade.update({
          where: { id: tradeId },
          data: { affiliateCommissionProcessedAt: null },
        });
        await AffiliateService.calculateCommissionForTrade(tradeId, {
          skipHoldCheck: true,
        });
        totalProcessed++;
        console.log(`  ✓ ${tradeId}`);
      } catch (err) {
        totalErrors++;
        console.error(`  ✗ ${tradeId}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  console.log('\n--- Terminé ---');
  console.log(`  Crédités : ${totalProcessed}`);
  console.log(`  Erreurs  : ${totalErrors}`);
}

main()
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
