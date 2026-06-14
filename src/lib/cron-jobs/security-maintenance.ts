import { cleanupRateLimitStore } from '@/lib/security';
import { AuditLogger } from '@/lib/security';
import { CooldownManager } from '@/lib/security';
import { FraudDetector } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function runSecurityMaintenanceJob() {
  logger.info('Starting security maintenance');

  const maintenanceResults = {
    rateLimitCleanup: 0,
    auditLogCleanup: 0,
    cooldownCleanup: 0,
    activitySpikeCheck: false,
    errors: [] as string[],
  };

  try {
    cleanupRateLimitStore();
    maintenanceResults.rateLimitCleanup = 1;
    logger.info('Rate limit cleanup completed');
  } catch (error) {
    const errorMsg = `Rate limit cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    maintenanceResults.errors.push(errorMsg);
    logger.error(errorMsg, { error });
  }

  try {
    const cleanedLogs = await AuditLogger.cleanupOldLogs(365);
    maintenanceResults.auditLogCleanup = cleanedLogs;
    logger.info(`Audit log cleanup completed: ${cleanedLogs} logs removed`);
  } catch (error) {
    const errorMsg = `Audit log cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    maintenanceResults.errors.push(errorMsg);
    logger.error(errorMsg, { error });
  }

  try {
    const cleanedCooldowns = await CooldownManager.cleanupOldRecords(90);
    maintenanceResults.cooldownCleanup = cleanedCooldowns;
    logger.info(`Cooldown cleanup completed: ${cleanedCooldowns} records removed`);
  } catch (error) {
    const errorMsg = `Cooldown cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    maintenanceResults.errors.push(errorMsg);
    logger.error(errorMsg, { error });
  }

  try {
    const activitySpike = await FraudDetector.detectActivitySpikes();
    maintenanceResults.activitySpikeCheck = activitySpike.hasSpike;

    if (activitySpike.hasSpike) {
      logger.warn('Activity spike detected during maintenance', {
        currentRate: activitySpike.currentRate,
        averageRate: activitySpike.averageRate,
        threshold: activitySpike.threshold,
      });
    }
  } catch (error) {
    const errorMsg = `Activity spike check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    maintenanceResults.errors.push(errorMsg);
    logger.error(errorMsg, { error });
  }

  await AuditLogger.log({
    action: 'system.maintenance' as never,
    details: {
      type: 'security_maintenance',
      results: maintenanceResults,
      timestamp: new Date().toISOString(),
    },
    severity: maintenanceResults.errors.length > 0 ? 'medium' : 'low',
  });

  const success = maintenanceResults.errors.length === 0;
  logger.info('Security maintenance completed', {
    success,
    results: maintenanceResults,
  });

  return {
    success,
    message: success
      ? 'Security maintenance completed successfully'
      : 'Security maintenance completed with errors',
    results: maintenanceResults,
    timestamp: new Date().toISOString(),
  };
}
