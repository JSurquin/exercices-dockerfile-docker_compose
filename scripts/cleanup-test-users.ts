#!/usr/bin/env tsx

/**
 * Script pour nettoyer les utilisateurs de test
 * Usage: pnpm test:e2e:cleanup
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Nettoyage des utilisateurs de test...\n');

  try {
    // Supprimer les utilisateurs de test
    const users = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-',
          endsWith: '@moonskin.test',
        },
      },
    });

    console.log(`✅ ${users.count} utilisateur(s) de test supprimé(s)`);
    // Sessions / accounts liés sont supprimés en cascade (onDelete) côté schéma Prisma.

    console.log('\n✨ Nettoyage terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
