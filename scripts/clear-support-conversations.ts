#!/usr/bin/env tsx

/**
 * Nettoie les tickets support (conversations chat) en masse.
 *
 * Usage:
 *   pnpm support:clear -- --dry-run
 *   pnpm support:clear -- --status active --confirm
 *   pnpm support:clear -- --all --confirm
 */

import { PrismaClient, ConversationStatus } from '@prisma/client';

const prisma = new PrismaClient();

type ClearStatus = 'active' | 'all';

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const confirm = argv.includes('--confirm');
  const all = argv.includes('--all');
  const status: ClearStatus = all ? 'all' : 'active';
  return { dryRun, confirm, status };
}

function buildWhere(status: ClearStatus) {
  if (status === 'all') {
    return { status: { not: 'DELETED' as ConversationStatus } };
  }
  return { status: 'ACTIVE' as ConversationStatus };
}

async function clearSupportConversations() {
  const { dryRun, confirm, status } = parseArgs(process.argv.slice(2));

  const where = buildWhere(status);
  const count = await prisma.conversation.count({ where });

  console.log(`🧹 Nettoyage des tickets support (${status})…\n`);
  console.log(`   Conversations ciblées : ${count}`);

  if (count === 0) {
    console.log('\n✨ Rien à nettoyer.');
    return;
  }

  if (dryRun) {
    const sample = await prisma.conversation.findMany({
      where,
      select: { id: true, subject: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log('\n🔍 Mode dry-run — aucune modification.');
    console.log('   Exemples :');
    for (const conv of sample) {
      console.log(`   - [${conv.status}] ${conv.subject ?? '(sans sujet)'} (${conv.id})`);
    }
    if (count > 5) {
      console.log(`   … et ${count - 5} autre(s)`);
    }
    console.log('\n   Relancez avec --confirm pour appliquer.');
    return;
  }

  if (!confirm) {
    console.error('\n❌ Ajoutez --confirm pour exécuter la suppression.');
    process.exit(1);
  }

  const now = new Date();
  const result = await prisma.conversation.updateMany({
    where,
    data: {
      status: 'DELETED',
      deletedAt: now,
      updatedAt: now,
    },
  });

  console.log(`\n✅ ${result.count} ticket(s) support archivé(s) (soft delete).`);
  console.log('✨ Nettoyage terminé.');
}

clearSupportConversations()
  .catch((error) => {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
