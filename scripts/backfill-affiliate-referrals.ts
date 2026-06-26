#!/usr/bin/env tsx
/**
 * Rattrapage des filleuls affiliés non enregistrés (parrain en base sans entrée referral,
 * ou ventes attribuées à un code sans parrain).
 *
 * Usage :
 *   npx tsx scripts/backfill-affiliate-referrals.ts        # dry-run
 *   npx tsx scripts/backfill-affiliate-referrals.ts --fix  # application
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { AffiliateService } from '@/lib/affiliate-service';

const DRY_RUN = !process.argv.includes('--fix');

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (lecture seule) ===' : '=== APPLICATION ===');

  const result = await AffiliateService.repairMissingReferralRecords({ dryRun: DRY_RUN });

  console.log(`Filleuls réparés (parrain déjà en base) : ${result.linkedFromParrain}`);
  console.log(`Filleuls rattachés via ventes attribuées : ${result.linkedFromTrades}`);
  console.log(`Compteurs affiliés resynchronisés : ${result.syncedAffiliateCounts}`);

  if (DRY_RUN && (result.linkedFromParrain > 0 || result.linkedFromTrades > 0)) {
    console.log('\nRelancer avec --fix pour appliquer.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
