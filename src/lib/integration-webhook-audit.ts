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
  externalId?: string;
  payoutId?: string;
  webhookId?: string;
  signaturePresent?: boolean;
  bodyLength?: number;
  userAgent?: string;
  errorMessage?: string;
  whitepayStatus?: string;
  flexifyStatus?: string;
  internalStatus?: string;
  txHash?: string;
  reference?: string;
  method?: string;
  amount?: string;
  currency?: string;
  errorCode?: number;
  errorReason?: string;
  tokenConfigured?: boolean;
  digestPresent?: boolean;
  dateHeaderPresent?: boolean;
  duplicateProcessedAt?: string;
  [key: string]: unknown;
}

export interface WhitepayWebhookMeta {
  eventType?: string;
  transactionId?: string;
  externalId?: string;
  whitepayStatus?: string;
  txHash?: string;
}

export interface FlexifyWebhookMeta {
  reference?: string;
  transactionId?: string;
  flexifyStatus?: string;
  eventType?: string;
  method?: string;
  amount?: string;
  currency?: string;
  errorCode?: number;
  errorReason?: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

export function buildWebhookAuditBase(
  request: NextRequest,
  rawBody: string,
  signaturePresent: boolean
): Pick<IntegrationWebhookAuditDetails, 'bodyLength' | 'signaturePresent' | 'userAgent'> {
  return {
    bodyLength: rawBody.length,
    signaturePresent,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}

export function extractWhitepayWebhookMeta(payload: unknown): WhitepayWebhookMeta {
  const pl = readRecord(payload);
  if (!pl) return {};

  const tx = readRecord(pl.transaction);
  const eventType = readString(pl.event_type);
  const transactionId = readString(tx?.id);
  const externalId = readString(tx?.external_id) ?? readString(tx?.externalId);
  const whitepayStatus = readString(tx?.status);
  const txHash =
    readString(tx?.tx_hash) ??
    readString(tx?.hash) ??
    readString(tx?.txHash);

  return { eventType, transactionId, externalId, whitepayStatus, txHash };
}

export function extractFlexifyWebhookMeta(payload: unknown): FlexifyWebhookMeta {
  const pl = readRecord(payload);
  if (!pl) return {};

  const errorCode = readNumber(pl.error_code);

  return {
    reference: readString(pl.reference),
    transactionId: readString(pl.identifier) ?? readString(pl.transaction_id),
    flexifyStatus: readString(pl.status),
    eventType: readString(pl.type),
    method: readString(pl.method),
    amount: readString(pl.amount),
    currency: readString(pl.currency),
    errorCode: errorCode && errorCode !== 0 ? errorCode : undefined,
    errorReason: readString(pl.error_reason),
  };
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
    const sanitizedDetails = Object.fromEntries(
      Object.entries(details).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

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
          ...sanitizedDetails,
        },
      },
    });
  } catch (error) {
    console.error(`[WebhookAudit] Failed to log ${provider} webhook call`, error);
  }
}
