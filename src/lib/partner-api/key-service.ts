import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { ApiClient } from '@prisma/client';
import { decrypt, encrypt } from '@/lib/encryption';
import { prisma } from '~/prisma/prisma';

const KEY_PREFIX = 'msk_live_';

export function encryptApiKeyForStorage(rawKey: string): string {
  if (!process.env.ENCRYPTION_KEY?.trim()) {
    return rawKey;
  }
  return encrypt(rawKey);
}

export function decryptStoredApiKey(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!process.env.ENCRYPTION_KEY?.trim()) {
    return stored;
  }
  try {
    return decrypt(stored);
  } catch {
    return stored;
  }
}

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

  const candidates = await prisma.apiClient.findMany({
    where: { keyPrefix, status: 'ACTIVE' },
  });

  const expected = Buffer.from(keyHash, 'hex');
  const client = candidates.find((candidate) => {
    const stored = Buffer.from(candidate.keyHash, 'hex');
    return stored.length === expected.length && timingSafeEqual(stored, expected);
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
      encryptedKey: null,
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

export async function getActiveApiClientForUser(userId: string): Promise<ApiClient | null> {
  return prisma.apiClient.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function regenerateApiClientCredentials(
  clientId: string
): Promise<{ client: ApiClient; rawKey: string }> {
  const { rawKey, keyPrefix, keyHash } = generateApiKey();
  const webhookSecret = generateWebhookSecret();

  const client = await prisma.apiClient.update({
    where: { id: clientId },
    data: {
      keyPrefix,
      keyHash,
      encryptedKey: null,
      webhookSecret,
      status: 'ACTIVE',
    },
  });

  return { client, rawKey };
}

export async function updateApiClient(
  id: string,
  params: { rateLimitPerMin?: number; scopes?: string[] }
): Promise<ApiClient> {
  return prisma.apiClient.update({
    where: { id },
    data: {
      ...(params.rateLimitPerMin !== undefined ? { rateLimitPerMin: params.rateLimitPerMin } : {}),
      ...(params.scopes !== undefined ? { scopes: params.scopes } : {}),
    },
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

export function toOwnerApiClientView(client: ApiClient) {
  return {
    ...sanitizeApiClient(client),
    api_key: null as string | null,
    webhook_secret: null as string | null,
  };
}
