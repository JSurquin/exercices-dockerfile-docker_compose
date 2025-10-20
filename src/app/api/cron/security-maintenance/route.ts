import { NextRequest, NextResponse } from 'next/server';
import { SecurityManager, cleanupRateLimitStore } from '@/lib/security';
import { AuditLogger } from '@/lib/security';
import { CooldownManager } from '@/lib/security';
import { FraudDetector } from '@/lib/security';
import { logger } from '@/lib/logger';

/**
 * Endpoint de maintenance de sécurité (à appeler via un cron job)
 * Nettoie les données expirées et effectue des vérifications de routine
 */
async function handleSecurityMaintenance(req: NextRequest): Promise<NextResponse> {
  try {
    // Vérifier l'authentification du cron (token secret ou IP whitelist)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized cron access attempt', {
        ip: req.headers.get('x-forwarded-for') || req.ip,
        userAgent: req.headers.get('user-agent'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting security maintenance');

    const maintenanceResults = {
      rateLimitCleanup: 0,
      auditLogCleanup: 0,
      cooldownCleanup: 0,
      activitySpikeCheck: false,
      errors: [] as string[],
    };

    try {
      // 1. Nettoyer les rate limits expirés
      cleanupRateLimitStore();
      maintenanceResults.rateLimitCleanup = 1; // Pas de retour de count pour cette fonction
      logger.info('Rate limit cleanup completed');
    } catch (error) {
      const errorMsg = `Rate limit cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      maintenanceResults.errors.push(errorMsg);
      logger.error(errorMsg, { error });
    }

    try {
      // 2. Nettoyer les anciens logs d'audit (garder 1 an par défaut)
      const cleanedLogs = await AuditLogger.cleanupOldLogs(365);
      maintenanceResults.auditLogCleanup = cleanedLogs;
      logger.info(`Audit log cleanup completed: ${cleanedLogs} logs removed`);
    } catch (error) {
      const errorMsg = `Audit log cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      maintenanceResults.errors.push(errorMsg);
      logger.error(errorMsg, { error });
    }

    try {
      // 3. Nettoyer les anciens cooldowns (garder 90 jours par défaut)
      const cleanedCooldowns = await CooldownManager.cleanupOldRecords(90);
      maintenanceResults.cooldownCleanup = cleanedCooldowns;
      logger.info(`Cooldown cleanup completed: ${cleanedCooldowns} records removed`);
    } catch (error) {
      const errorMsg = `Cooldown cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      maintenanceResults.errors.push(errorMsg);
      logger.error(errorMsg, { error });
    }

    try {
      // 4. Vérifier les pics d'activité
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

    // 5. Effectuer d'autres vérifications de sécurité
    try {
      // TODO: Ajouter d'autres vérifications comme :
      // - Vérification des IPs suspectes
      // - Analyse des patterns de fraude
      // - Vérification de l'intégrité des données
      // - Mise à jour des listes noires/blanches
    } catch (error) {
      const errorMsg = `Additional security checks failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      maintenanceResults.errors.push(errorMsg);
      logger.error(errorMsg, { error });
    }

    // Logger la maintenance effectuée
    await AuditLogger.log({
      action: 'system.maintenance' as any,
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
      results: maintenanceResults 
    });

    return NextResponse.json({
      success,
      message: success ? 'Security maintenance completed successfully' : 'Security maintenance completed with errors',
      results: maintenanceResults,
      timestamp: new Date().toISOString(),
    }, { 
      status: success ? 200 : 207 // 207 Multi-Status pour succès partiel
    });

  } catch (error) {
    logger.error('Security maintenance failed', { error });
    
    // Logger l'échec de maintenance
    try {
      await AuditLogger.log({
        action: 'system.maintenance_failed' as any,
        details: {
          type: 'security_maintenance',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      });
    } catch (logError) {
      logger.error('Failed to log maintenance failure', { logError });
    }

    return NextResponse.json({
      success: false,
      error: 'Security maintenance failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Seule la méthode POST est autorisée pour éviter les appels accidentels
export const POST = handleSecurityMaintenance;

// Bloquer les autres méthodes
export const GET = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
