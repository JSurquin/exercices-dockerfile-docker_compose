import cron from 'node-cron';
import { CRON_SCHEDULES } from '@/lib/cron-jobs/schedules';
import { runProcessTradesJob } from '@/lib/cron-jobs/process-trades';
import { runGiveawayDrawJob } from '@/lib/cron-jobs/giveaway-draw';
import { runUpdateTradesStatusJob } from '@/lib/cron-jobs/update-trades-status';
import { runSecurityMaintenanceJob } from '@/lib/cron-jobs/security-maintenance';
import { runAutoCloseInactiveConversationsJob } from '@/lib/cron-jobs/auto-close-inactive-conversations';

type JobRunner = {
  name: string;
  schedule: string;
  run: () => Promise<unknown>;
};

const jobs: JobRunner[] = [
  {
    name: 'update-trades-status',
    schedule: CRON_SCHEDULES.updateTradesStatus,
    run: runUpdateTradesStatusJob,
  },
  {
    name: 'process-trades',
    schedule: CRON_SCHEDULES.processTrades,
    run: runProcessTradesJob,
  },
  {
    name: 'giveaway-draw',
    schedule: CRON_SCHEDULES.giveawayDraw,
    run: runGiveawayDrawJob,
  },
  {
    name: 'security-maintenance',
    schedule: CRON_SCHEDULES.securityMaintenance,
    run: runSecurityMaintenanceJob,
  },
  {
    name: 'auto-close-inactive-conversations',
    schedule: CRON_SCHEDULES.autoCloseInactiveConversations,
    run: runAutoCloseInactiveConversationsJob,
  },
];

const globalForCron = globalThis as typeof globalThis & {
  __cronWorkerStarted?: boolean;
};

async function runJob(job: JobRunner) {
  const startedAt = new Date().toISOString();
  console.log(`[cron-worker] ▶ ${job.name} (${startedAt})`);
  try {
    const result = await job.run();
    console.log(`[cron-worker] ✓ ${job.name}`, result);
  } catch (error) {
    console.error(`[cron-worker] ✗ ${job.name}`, error);
  }
}

/**
 * Démarre le planificateur node-cron (idempotent).
 * Appelé automatiquement au lancement du serveur (`pnpm start` / `pnpm dev`).
 * Désactivable via ENABLE_CRON_WORKER=false.
 */
export function startCronWorker(): boolean {
  if (globalForCron.__cronWorkerStarted) {
    return false;
  }

  if (process.env.ENABLE_CRON_WORKER === 'false') {
    console.log('[cron-worker] Désactivé (ENABLE_CRON_WORKER=false)');
    return false;
  }

  globalForCron.__cronWorkerStarted = true;

  console.log('[cron-worker] Démarrage du planificateur node-cron…');
  console.log('[cron-worker] Jobs enregistrés :');
  for (const job of jobs) {
    console.log(`  - ${job.name}: ${job.schedule}`);
    cron.schedule(job.schedule, () => {
      void runJob(job);
    });
  }

  console.log('[cron-worker] En attente des prochaines exécutions…');
  return true;
}
