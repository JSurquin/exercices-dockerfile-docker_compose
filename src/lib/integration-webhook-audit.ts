import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { getClientIP } from '@/lib/security/audit-helpers';

export type IntegrationWebhookProvider = 'whitepay' | 'flexify' | 'skinplace' | 'kycaid';

export type IntegrationWebhookOutcome =
  | 'received'
  | 'invalid_json'
  | 'invalid_signature'
  | 'stale_date'
  | 'ignored'
  | 'unknown_event'
  | 'duplicate'
  | 'payout_not_found'
  | 'skipped'
  | 'processed'
  | 'error';

export interface IntegrationWebhookAuditDetails {
  outcome: IntegrationWebhookOutcome;
  httpStatus: number;
  eventType?: string;
  transactionId?: string;
  payoutId?: string;
  signaturePresent?: boolean;
  bodyLength?: number;
  errorMessage?: string;
  whitepayStatus?: string;
  [key: string]: unknown;
}

function outcomeSeverity(
  outcome: IntegrationWebhookOutcome
): 'low' | 'medium' | 'high' | 'critical' {
  switch (outcome) {
    case 'invalid_signature':
    case 'stale_date':
      return 'high';
    case 'error':
    case 'payout_not_found':
      return 'medium';
    case 'invalid_json':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Trace un appel webhook entrant dans audit_log (visible dans /admin/audit).
 * Ne doit jamais faire échouer le handler webhook principal.
 */
export async function logIntegrationWebhookCall(
  provider: IntegrationWebhookProvider,
  request: NextRequest,
  details: IntegrationWebhookAuditDetails,
  userId?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || 'system',
        action: `webhook.${provider}.call`,
        ipAddress: getClientIP(request),
        details: {
          provider,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          severity: outcomeSeverity(details.outcome),
          ...details,
        },
      },
    });
  } catch (error) {
    console.error(`[WebhookAudit] Failed to log ${provider} webhook call`, error);
  }
}
