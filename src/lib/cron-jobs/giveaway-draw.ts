import { processDueRecurringGiveaways } from '@/lib/giveaway-recurrence';
import { runAutoDrawExpiredGiveaways } from '@/lib/cron-jobs/auto-draw-expired';

export async function runGiveawayDrawJob() {
  console.log('[CRON] Démarrage du tirage automatique des giveaways...');

  const draw = await runAutoDrawExpiredGiveaways();
  console.log(`[CRON] Tirage terminé: ${draw.processedCount} giveaways traités`);

  const recurrence = await processDueRecurringGiveaways();
  console.log(`[CRON] Giveaways récurrents: ${recurrence.processedCount} série(s) traitée(s)`);

  return {
    success: true as const,
    message: 'Tirage automatique effectué',
    ...draw,
    recurrence,
  };
}
