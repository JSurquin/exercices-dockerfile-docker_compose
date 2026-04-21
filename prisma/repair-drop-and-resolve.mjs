#!/usr/bin/env node
/**
 * One-time repair for drift: remove the row for 20251003160000_add_flexify_kycaid
 * so that "prisma migrate resolve --applied" can re-add it with the correct checksum.
 * The migration must NOT be run again (data already there), so we only run resolve.
 * Run: 1) node prisma/repair-drop-and-resolve.mjs  2) npx prisma migrate resolve --applied 20251003160000_add_flexify_kycaid
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
    '20251119160000_add_flexify_kycaid'
  );
  console.log('Deleted row(s):', result);
  await prisma.$disconnect();
  console.log('Now run: npx prisma migrate resolve --applied 20251119160000_add_flexify_kycaid');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
