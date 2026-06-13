#!/usr/bin/env tsx
/**
 * Corrige les montants EUR affichés dans les anciennes notifications admin
 * « Nouveau trade créé » (montants USD affichés avec le symbole € sans conversion).
 *
 * Usage :
 *   npx tsx scripts/backfill-trade-notification-amounts.ts        # lecture seule
 *   npx tsx scripts/backfill-trade-notification-amounts.ts --fix  # application
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { NotificationType, PrismaClient } from '@prisma/client';
import { currencyConverter } from '@/lib/currency-converter';

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--fix');

interface TradeNotificationMetadata {
  tradeId?: string;
  userId?: string;
  amount?: number;
}

function parseMetadata(raw: unknown): TradeNotificationMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const data = raw as Record<string, unknown>;
  return {
    tradeId: typeof data.tradeId === 'string' ? data.tradeId : undefined,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    amount: typeof data.amount === 'number' ? data.amount : undefined,
  };
}

function extractUsername(messageFr: string, messageEn: string): string | null {
  const frMatch = messageFr.match(/^(.+?) a créé un trade de /);
  if (frMatch?.[1]) return frMatch[1];

  const enMatch = messageEn.match(/^(.+?) created a trade of /);
  if (enMatch?.[1]) return enMatch[1];

  return null;
}

async function resolveUsdCents(
  metadata: TradeNotificationMetadata,
): Promise<number | null> {
  if (typeof metadata.amount === 'number' && metadata.amount > 0) {
    return metadata.amount;
  }

  if (!metadata.tradeId) return null;

  const trade = await prisma.trade.findUnique({
    where: { id: metadata.tradeId },
    select: { grossCents: true },
  });

  return trade?.grossCents ?? null;
}

async function buildMessages(username: string, usdCents: number) {
  const eurCents = await currencyConverter.convertUsdCentsToEurCents(usdCents);
  const amountFormatted = currencyConverter.formatEurPrice(eurCents);

  return {
    amountFormatted,
    messageFr: `${username} a créé un trade de ${amountFormatted}`,
    messageEn: `${username} created a trade of ${amountFormatted}`,
    messageCn: `${username} 创建了 ${amountFormatted} 的交易`,
  };
}

async function main() {
  console.log(DRY_RUN ? 'Mode lecture seule (ajoutez --fix pour appliquer)\n' : 'Mode correction — écriture en base\n');

  const notifications = await prisma.notification.findMany({
    where: {
      type: NotificationType.TRADE_UPDATE,
      titleFr: 'Nouveau trade créé',
    },
    select: {
      id: true,
      messageFr: true,
      messageEn: true,
      messageCn: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`${notifications.length} notification(s) « Nouveau trade créé » trouvée(s)\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const notification of notifications) {
    const metadata = parseMetadata(notification.metadata);
    const usdCents = await resolveUsdCents(metadata);

    if (!usdCents) {
      console.warn(`  SKIP ${notification.id} — montant USD introuvable (metadata/trade)`);
      failed++;
      continue;
    }

    let username = extractUsername(notification.messageFr, notification.messageEn);
    if (!username && metadata.userId) {
      const user = await prisma.user.findUnique({
        where: { id: metadata.userId },
        select: { steamUsername: true, name: true },
      });
      username = user?.steamUsername || user?.name || null;
    }

    if (!username) {
      console.warn(`  SKIP ${notification.id} — nom d'utilisateur introuvable`);
      failed++;
      continue;
    }

    const messages = await buildMessages(username, usdCents);

    if (
      notification.messageFr === messages.messageFr &&
      notification.messageEn === messages.messageEn &&
      (notification.messageCn ?? '') === messages.messageCn
    ) {
      skipped++;
      continue;
    }

    const oldAmount = notification.messageFr.match(/trade de (.+)$/)?.[1] ?? '?';
    console.log(
      `  FIX ${notification.id} (${notification.createdAt.toISOString().slice(0, 10)}) : ${oldAmount} → ${messages.amountFormatted}`,
    );

    if (!DRY_RUN) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          messageFr: messages.messageFr,
          messageEn: messages.messageEn,
          messageCn: messages.messageCn,
        },
      });
    }

    updated++;
  }

  console.log(`\nRésumé : ${updated} à corriger/corrigée(s), ${skipped} déjà OK, ${failed} ignorée(s)`);

  if (DRY_RUN && updated > 0) {
    console.log('\nRelancez avec --fix pour appliquer les corrections.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
