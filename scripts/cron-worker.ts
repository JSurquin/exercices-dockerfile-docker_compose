import { config } from 'dotenv';
import { startCronWorker } from '@/lib/cron-jobs/start-worker';

config({ path: '.env.local' });
config();

if (!startCronWorker()) {
  process.exit(process.env.ENABLE_CRON_WORKER === 'false' ? 0 : 1);
}
