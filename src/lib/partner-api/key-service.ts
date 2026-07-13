import { createHash, randomBytes } from 'crypto';
import type { ApiClient } from '@prisma/client';
import { prisma } from '~/prisma/prisma';

const KEY_PREFIX = 'msk_live_';

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const suffix = randomBytes(24).toString('hex');
  const rawKey = `${KEY_PREFIX}${suffix}`;
  const keyPrefix = rawKey.slice(0, 16);
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

export async function findApiClientByKey(rawKey: string): Promise<ApiClient | null> {
  if (!rawKey.startsWith(KEY_PREFIX) || rawKey.length < 20) {
    return null;
  }
  const keyPrefix = rawKey.slice(0, 16);
  const keyHash = hashApiKey(rawKey);

  const client = await prisma.apiClient.findFirst({
    where: { keyPrefix, keyHash, status: 'ACTIVE' },
  });

  if (!client) return null;
  if (client.expiresAt && client.expiresAt < new Date()) return null;
  return client;
}

export async function createApiClient(params: {
  name: string;
  userId: string;
  createdBy: string;
  rateLimitPerMin?: number;
  scopes?: string[];
  expiresAt?: Date | null;
}): Promise<{ client: ApiClient; rawKey: string }> {
  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  const webhookSecret = generateWebhookSecret();

  const client = await prisma.apiClient.create({
    data: {
      name: params.name,
      userId: params.userId,
      keyPrefix,
      keyHash,
      webhookSecret,
      createdBy: params.createdBy,
      rateLimitPerMin: params.rateLimitPerMin ?? 100,
      scopes: params.scopes ?? ['read', 'trade', 'payout'],
      expiresAt: params.expiresAt ?? null,
    },
  });

  return { client, rawKey };
}

export async function revokeApiClient(id: string): Promise<void> {
  await prisma.apiClient.update({
    where: { id },
    data: { status: 'REVOKED' },
  });
}

export function sanitizeApiClient(client: ApiClient) {
  return {
    id: client.id,
    name: client.name,
    user_id: client.userId,
    status: client.status,
    scopes: client.scopes,
    rate_limit_per_min: client.rateLimitPerMin,
    webhook_url: client.webhookUrl,
    key_prefix: client.keyPrefix,
    expires_at: client.expiresAt?.toISOString() ?? null,
    last_used_at: client.lastUsedAt?.toISOString() ?? null,
    created_at: client.createdAt.toISOString(),
  };
}
