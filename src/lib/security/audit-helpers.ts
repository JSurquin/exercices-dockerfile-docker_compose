import { NextRequest } from 'next/server';
import { AuditLogger, AuditAction } from './audit-logger';

/**
 * Helpers pour simplifier l'intégration de l'audit logging dans les routes
 */

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export function getUserAgent(req: NextRequest): string | undefined {
  return req.headers.get('user-agent') || undefined;
}

export interface RequestContext {
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  path: string;
  method: string;
}

export function getRequestContext(req: NextRequest, userId?: string): RequestContext {
  const url = new URL(req.url);
  
  return {
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
    userId,
    path: url.pathname,
    method: req.method,
  };
}

/**
 * Log d'une tentative d'accès non autorisé
 */
export async function logUnauthorizedAccess(
  context: RequestContext,
  endpoint: string,
  reason?: string
): Promise<void> {
  await AuditLogger.log({
    userId: context.userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action: AuditAction.USER_LOGIN_FAILED,
    details: {
      type: 'unauthorized_access',
      endpoint,
      reason: reason || 'No valid session',
      timestamp: new Date().toISOString(),
    },
    severity: 'high',
  });
}

/**
 * Log d'une action admin
 */
export async function logAdminAccess(
  context: RequestContext,
  action: string,
  targetUserId?: string,
  details?: Record<string, any>
): Promise<void> {
  if (!context.userId) return;
  
  await AuditLogger.logAdminAction(
    context.userId,
    action,
    targetUserId,
    {
      endpoint: context.path,
      method: context.method,
      ...details,
      timestamp: new Date().toISOString(),
    },
    context.ipAddress
  );
}

/**
 * Log d'une erreur système
 */
export async function logSystemError(
  context: RequestContext,
  error: Error | unknown,
  type: string
): Promise<void> {
  await AuditLogger.log({
    userId: context.userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action: AuditAction.SUSPICIOUS_ACTIVITY,
    details: {
      type: `system_error_${type}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: context.path,
      method: context.method,
      timestamp: new Date().toISOString(),
    },
    severity: 'high',
  });
}

/**
 * Log d'une action utilisateur
 */
export async function logUserAction(
  context: RequestContext,
  action: AuditAction,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<void> {
  if (!context.userId) return;
  
  await AuditLogger.log({
    userId: context.userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action,
    details: {
      endpoint: context.path,
      method: context.method,
      ...details,
      timestamp: new Date().toISOString(),
    },
    severity,
  });
}

/**
 * Log d'une activité suspecte
 */
export async function logSuspiciousActivity(
  context: RequestContext,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  await AuditLogger.logSuspiciousActivity(
    context.userId,
    context.ipAddress,
    reason,
    {
      endpoint: context.path,
      method: context.method,
      ...details,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Log d'une validation échouée
 */
export async function logValidationFailure(
  context: RequestContext,
  field: string,
  value: any,
  reason: string
): Promise<void> {
  await AuditLogger.log({
    userId: context.userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action: AuditAction.SUSPICIOUS_ACTIVITY,
    details: {
      type: 'validation_failure',
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value, // Limiter la taille
      reason,
      endpoint: context.path,
      method: context.method,
      timestamp: new Date().toISOString(),
    },
    severity: 'medium',
  });
}

/**
 * Log d'un changement de données sensibles
 */
export async function logSensitiveDataChange(
  context: RequestContext,
  dataType: string,
  oldValue: any,
  newValue: any,
  action: AuditAction = AuditAction.PAYMENT_METHOD_UPDATED
): Promise<void> {
  if (!context.userId) return;
  
  await AuditLogger.log({
    userId: context.userId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    action,
    details: {
      type: 'sensitive_data_change',
      dataType,
      oldValue: oldValue ? 'REDACTED' : null,
      newValue: newValue ? 'REDACTED' : null,
      hasChange: oldValue !== newValue,
      endpoint: context.path,
      method: context.method,
      timestamp: new Date().toISOString(),
    },
    severity: 'high',
  });
}

/**
 * Wrapper pour les routes API avec logging automatique
 */
export function withAuditLogging<T extends any[]>(
  handler: (req: NextRequest, context: RequestContext, ...args: T) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    adminOnly?: boolean;
    logAccess?: boolean;
    actionName?: string;
  } = {}
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const context = getRequestContext(req);
    
    try {
      // Log d'accès si demandé
      if (options.logAccess) {
        await logUserAction(
          context,
          AuditAction.USER_LOGIN, // Action générique pour l'accès
          {
            type: 'api_access',
            actionName: options.actionName || 'unknown',
          },
          'low'
        );
      }
      
      return await handler(req, context, ...args);
    } catch (error) {
      await logSystemError(context, error, options.actionName || 'api_call');
      throw error;
    }
  };
}
