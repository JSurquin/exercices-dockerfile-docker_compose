export interface AuditDetailLabels {
  reason: string;
  targetUser: string;
  amount: string;
  payout: string;
  blockedIp: string;
  expiresAt: string;
  type: string;
  endpoint: string;
  steamId: string;
  balanceAfter: string;
  outcome: string;
  httpStatus: string;
  eventType: string;
  transactionId: string;
  provider: string;
  flexifyStatus: string;
  reference: string;
  noDetails: string;
}

const SKIP_KEYS = new Set(['severity', 'timestamp', 'metadata']);

const KEY_LABELS: Record<string, keyof AuditDetailLabels> = {
  reason: 'reason',
  targetUserId: 'targetUser',
  amountCents: 'amount',
  payoutId: 'payout',
  blockedIp: 'blockedIp',
  banExpires: 'expiresAt',
  expiresAt: 'expiresAt',
  type: 'type',
  endpoint: 'endpoint',
  steamId: 'steamId',
  balanceAfterCents: 'balanceAfter',
  outcome: 'outcome',
  httpStatus: 'httpStatus',
  eventType: 'eventType',
  transactionId: 'transactionId',
  whitepayTransactionId: 'transactionId',
  flexifyStatus: 'flexifyStatus',
  reference: 'reference',
  provider: 'provider',
};

function formatCents(value: unknown): string {
  const cents = Number(value);
  if (Number.isNaN(cents)) return String(value);
  return `${(cents / 100).toFixed(2)} €`;
}

function formatValue(key: string, value: unknown, labels: AuditDetailLabels): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (key === 'amountCents' || key === 'balanceAfterCents') {
    return formatCents(value);
  }

  if ((key === 'banExpires' || key === 'expiresAt') && typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('fr-FR');
    }
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Transforme les détails JSON d'un log d'audit en texte lisible.
 */
export function formatAuditLogDetails(
  details: Record<string, unknown> | null | undefined,
  labels: AuditDetailLabels
): string {
  if (!details || typeof details !== 'object') {
    return labels.noDetails;
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(details)) {
    if (SKIP_KEYS.has(key)) continue;

    const labelKey = KEY_LABELS[key];
    const label = labelKey ? labels[labelKey] : key;
    const formatted = formatValue(key, value, labels);
    if (!formatted) continue;

    parts.push(`${label} : ${formatted}`);
  }

  return parts.length > 0 ? parts.join(' · ') : labels.noDetails;
}
