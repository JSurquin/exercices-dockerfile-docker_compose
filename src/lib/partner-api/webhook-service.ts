import { createHmac } from 'crypto';
import { prisma } from '~/prisma/prisma';
import { mapTradeStatus } from '@/lib/partner-api/response';
import { logger } from '@/lib/logger';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 5000, 15000];

export type PartnerWebhookEventType =
  | 'trade.created'
  | 'trade.status_changed'
  | 'payout.created'
  | 'payout.status_changed';

export interface PartnerWebhookPayload {
  event_id: string;
  type: PartnerWebhookEventType;
  resource_id: string;
  statut: string;
  timestamp: string;
  user_id: string;
  brut_centimes?: number;
  net_centimes?: number;
  frais?: { cashout: number; réseau: number };
  reference_paiement?: string | null;
}

function signPayload(secret: string, timestamp: number, body: string): string {
  const signed = `${timestamp}.${body}`;
  return createHmac('sha256', secret).update(signed).digest('hex');
}

async function deliverWebhook(
  deliveryId: string,
  url: string,
  secret: string,
  payload: PartnerWebhookPayload
): Promise<{ success: boolean; httpStatus?: number; error?: string; durationMs: number }> {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(secret, timestamp, body);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MoonSkin-Signature': `t=${timestamp},v1=${signature}`,
        'X-MoonSkin-Event-Id': payload.event_id,
        'User-Agent': 'MoonSkin-Webhook/1.0',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    const durationMs = Date.now() - start;
    if (response.ok) {
      return { success: true, httpStatus: response.status, durationMs };
    }
    return {
      success: false,
      httpStatus: response.status,
      error: `HTTP ${response.status}`,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message, durationMs };
  }
}

async function scheduleRetry(deliveryId: string, attempt: number, error: string, httpStatus?: number) {
  const nextAttempt = attempt + 1;
  if (nextAttempt >= MAX_ATTEMPTS) {
    await prisma.partnerWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'failed',
        attempts: nextAttempt,
        errorMessage: error,
        httpStatus: httpStatus ?? null,
        lastAttemptAt: new Date(),
        nextRetryAt: null,
      },
    });
    return;
  }

  const delay = RETRY_DELAYS_MS[nextAttempt - 1] ?? 15000;
  await prisma.partnerWebhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: 'pending',
      attempts: nextAttempt,
      errorMessage: error,
      httpStatus: httpStatus ?? null,
      lastAttemptAt: new Date(),
      nextRetryAt: new Date(Date.now() + delay),
    },
  });

  setTimeout(() => {
    void processDelivery(deliveryId);
  }, delay);
}

async function processDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.partnerWebhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { apiClient: true },
  });

  if (!delivery || delivery.status === 'success') return;
  const client = delivery.apiClient;
  if (!client.webhookUrl || client.status !== 'ACTIVE') {
    await prisma.partnerWebhookDelivery.update({
      where: { id: deliveryId },
      data: { status: 'failed', errorMessage: 'Webhook URL non configurée ou clé révoquée' },
    });
    return;
  }

  const payload = delivery.payload as unknown as PartnerWebhookPayload;
  const result = await deliverWebhook(deliveryId, client.webhookUrl, client.webhookSecret, payload);

  if (result.success) {
    await prisma.partnerWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'success',
        httpStatus: result.httpStatus,
        attempts: delivery.attempts + 1,
        lastAttemptAt: new Date(),
        durationMs: result.durationMs,
        nextRetryAt: null,
        errorMessage: null,
      },
    });
    return;
  }

  await scheduleRetry(
    deliveryId,
    delivery.attempts,
    result.error ?? 'Delivery failed',
    result.httpStatus
  );
}

export async function enqueuePartnerWebhook(
  userId: string,
  eventType: PartnerWebhookEventType,
  resourceId: string,
  payload: Omit<PartnerWebhookPayload, 'event_id' | 'type' | 'resource_id' | 'timestamp' | 'user_id'>
): Promise<void> {
  try {
    const clients = await prisma.apiClient.findMany({
      where: { userId, status: 'ACTIVE', webhookUrl: { not: null } },
    });

    if (clients.length === 0) return;

    for (const client of clients) {
      const eventId = `${eventType}:${resourceId}:${Date.now()}:${client.id}`;
      const fullPayload: PartnerWebhookPayload = {
        event_id: eventId,
        type: eventType,
        resource_id: resourceId,
        timestamp: new Date().toISOString(),
        user_id: userId,
        ...payload,
      };

      const delivery = await prisma.partnerWebhookDelivery.create({
        data: {
          apiClientId: client.id,
          eventType,
          resourceId,
          eventId,
          payload: fullPayload as object,
          status: 'pending',
        },
      });

      void processDelivery(delivery.id);
    }
  } catch (err) {
    logger.error('[PartnerWebhook] enqueue failed', err);
  }
}

export async function notifyTradeStatusChange(
  userId: string,
  trade: {
    id: string;
    status: string;
    grossCents: number;
    cashoutFees: number;
    networkFees: number;
    netCents: number;
    ticketId: string;
  },
  eventType: 'trade.created' | 'trade.status_changed' = 'trade.status_changed'
): Promise<void> {
  await enqueuePartnerWebhook(userId, eventType, trade.id, {
    statut: mapTradeStatus(trade.status),
    brut_centimes: trade.grossCents,
    net_centimes: trade.netCents,
    frais: { cashout: trade.cashoutFees, réseau: trade.networkFees },
    reference_paiement: trade.ticketId,
  });
}

export async function notifyPayoutStatusChange(
  userId: string,
  payout: {
    id: string;
    status: string;
    amountCents: number;
    tradeId: string | null;
  }
): Promise<void> {
  const eventType: PartnerWebhookEventType =
    payout.status === 'PENDING' ? 'payout.created' : 'payout.status_changed';

  await enqueuePartnerWebhook(userId, eventType, payout.id, {
    statut: payout.status.toLowerCase(),
    brut_centimes: payout.amountCents,
    net_centimes: payout.amountCents,
    reference_paiement: payout.tradeId,
  });
}

/** Traite les livraisons en attente (cron / rattrapage). */
export async function processPendingWebhookDeliveries(limit = 20): Promise<number> {
  const pending = await prisma.partnerWebhookDelivery.findMany({
    where: {
      status: 'pending',
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  for (const d of pending) {
    await processDelivery(d.id);
  }
  return pending.length;
}

export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
  toleranceSec = 300
): boolean {
  const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/);
  if (!match) return false;
  const timestamp = parseInt(match[1], 10);
  const provided = match[2];
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSec) return false;
  const expected = signPayload(secret, timestamp, rawBody);
  return expected === provided;
}
