#!/usr/bin/env node
/**
 * One-time repair: fix checksum for 20251003160000_add_flexify_kycaid in _prisma_migrations
 * so that "prisma migrate dev" stops reporting drift (Prisma compares stored checksum with file).
 * No data loss, only updates the internal migrations table.
 */
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrationName = '20251119160000_add_flexify_kycaid';
const migrationPath = join(__dirname, 'migrations', migrationName, 'migration.sql');
const content = readFileSync(migrationPath, 'utf8');
const checksum = createHash('sha256').update(content).digest('hex');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    `UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = $2`,
    checksum,
    migrationName
  );

  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, checksum FROM "_prisma_migrations" WHERE migration_name = $1`,
    migrationName
  );

  console.log('Updated checksum for', migrationName);
  console.log('New checksum:', checksum);
  console.log('Row:', rows);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
