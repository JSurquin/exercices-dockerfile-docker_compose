#!/usr/bin/env tsx
/**
 * Recalcule totalVolumeCents pour tous les utilisateurs à partir des trades crédités.
 *
 * Usage :
 *   npx tsx scripts/recalculate-user-volumes.ts                    # dry-run
 *   npx tsx scripts/recalculate-user-volumes.ts --fix              # applique
 *   npx tsx scripts/recalculate-user-volumes.ts --fix --user=ID    # un seul user
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { recalculateAllUserVolumes } from '@/lib/trade-volume';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');
const userArg = process.argv.find((a) => a.startsWith('--user='));
const userFilter = userArg?.split('=')[1]?.trim() || undefined;

async function findDuplicateTradeSaleTransactions(userId?: string) {
  const transactions = await prisma.pointTransaction.findMany({
    where: {
      type: 'TRADE_SALE',
      ...(userId ? { userId } : {}),
    },
    select: { id: true, userId: true, metadata: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const byTrade = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const meta = tx.metadata as { tradeId?: string } | null;
    const tradeId = meta?.tradeId;
    if (!tradeId) continue;
    const key = `${tx.userId}:${tradeId}`;
    const list = byTrade.get(key) ?? [];
    list.push(tx);
    byTrade.set(key, list);
  }

  const duplicates: Array<{ userId: string; tradeId: string; ids: string[] }> = [];
  for (const [key, list] of byTrade) {
    if (list.length <= 1) continue;
    const [userIdKey, tradeId] = key.split(':');
    duplicates.push({
      userId: userIdKey,
      tradeId,
      ids: list.map((t) => t.id),
    });
  }
  return duplicates;
}

async function main() {
  console.log(
    DRY_RUN
      ? 'Mode dry-run — aucune modification en base\n'
      : 'Mode correction — recalcul des volumes en cours\n',
  );

  if (userFilter) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userFilter },
          { steamUsername: { equals: userFilter, mode: 'insensitive' } },
          { name: { equals: userFilter, mode: 'insensitive' } },
        ],
      },
      select: { id: true, steamUsername: true, name: true, totalVolumeCents: true },
    });
    if (!user) {
      console.error(`Utilisateur introuvable : ${userFilter}`);
      process.exit(1);
    }
    console.log(
      `Cible : ${user.steamUsername || user.name || user.id} (volume actuel : ${(user.totalVolumeCents / 100).toFixed(2)} €)\n`,
    );
  }

  const duplicates = await findDuplicateTradeSaleTransactions(userFilter);
  if (duplicates.length > 0) {
    console.log(`Transactions TRADE_SALE en double détectées : ${duplicates.length}`);
    for (const dup of duplicates) {
      console.log(`  user=${dup.userId} trade=${dup.tradeId} txIds=${dup.ids.join(', ')}`);
      if (!DRY_RUN) {
        const [, ...toDelete] = dup.ids;
        if (toDelete.length > 0) {
          await prisma.pointTransaction.deleteMany({ where: { id: { in: toDelete } } });
          console.log(`    → supprimé ${toDelete.length} doublon(s)`);
        }
      }
    }
    console.log('');
  }

  const { updated, corrections } = await recalculateAllUserVolumes({
    dryRun: DRY_RUN,
    userId: userFilter
      ? (
          await prisma.user.findFirst({
            where: {
              OR: [
                { id: userFilter },
                { steamUsername: { equals: userFilter, mode: 'insensitive' } },
                { name: { equals: userFilter, mode: 'insensitive' } },
              ],
            },
            select: { id: true },
          })
        )?.id
      : undefined,
  });

  if (corrections.length === 0) {
    console.log('Aucune correction nécessaire.');
  } else {
    console.log(`${DRY_RUN ? 'Corrections proposées' : 'Corrections appliquées'} : ${updated}`);
    for (const c of corrections.slice(0, 50)) {
      console.log(
        `  ${c.userId}: ${(c.before / 100).toFixed(2)} € → ${(c.after / 100).toFixed(2)} €`,
      );
    }
    if (corrections.length > 50) {
      console.log(`  … et ${corrections.length - 50} autre(s)`);
    }
  }

  if (DRY_RUN && corrections.length > 0) {
    console.log('\nRelancer avec --fix pour appliquer.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
