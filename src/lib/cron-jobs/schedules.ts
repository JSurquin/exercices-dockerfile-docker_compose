/** Expressions cron du planificateur node-cron (démarré avec `pnpm start` / `pnpm dev`). */
export const CRON_SCHEDULES = {
  /** Mise à jour des statuts trades via Skinplace */
  updateTradesStatus: '*/10 * * * *',
  /** Traitement des trades en fin de hold */
  processTrades: '0 * * * *',
  /** Tirages giveaways + récurrence */
  giveawayDraw: '*/15 * * * *',
  /** Maintenance sécurité (logs, rate limits, cooldowns) */
  securityMaintenance: '0 3 * * *',
} as const;

export type CronJobName = keyof typeof CRON_SCHEDULES;
