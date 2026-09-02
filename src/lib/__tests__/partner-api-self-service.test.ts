import {
  hashApiKey,
  regenerateApiClientCredentials,
} from '@/lib/partner-api/key-service';
import { canUserManageApiKeys } from '@/lib/partner-api/developer-access';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    apiClient: {
      update: jest.fn(),
    },
  },
}));

const { prisma } = jest.requireMock('~/prisma/prisma') as {
  prisma: {
    user: { findUnique: jest.Mock };
    apiClient: { update: jest.Mock };
  };
};

describe('partner-api developer-access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows users with developerProgramEnabled', async () => {
    prisma.user.findUnique.mockResolvedValue({
      developerProgramEnabled: true,
      _count: { apiClients: 0 },
    });
    await expect(canUserManageApiKeys('user-1')).resolves.toBe(true);
  });

  it('allows users with existing api clients', async () => {
    prisma.user.findUnique.mockResolvedValue({
      developerProgramEnabled: false,
      _count: { apiClients: 1 },
    });
    await expect(canUserManageApiKeys('user-1')).resolves.toBe(true);
  });

  it('denies users without program access', async () => {
    prisma.user.findUnique.mockResolvedValue({
      developerProgramEnabled: false,
      _count: { apiClients: 0 },
    });
    await expect(canUserManageApiKeys('user-1')).resolves.toBe(false);
  });
});

describe('partner-api regenerateApiClientCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates key hash and webhook secret', async () => {
    prisma.apiClient.update.mockImplementation(async ({ data }: { data: Record<string, string> }) => ({
      id: 'client-1',
      keyPrefix: data.keyPrefix,
      keyHash: data.keyHash,
      webhookSecret: data.webhookSecret,
      status: 'ACTIVE',
    }));

    const result = await regenerateApiClientCredentials('client-1');

    expect(prisma.apiClient.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: expect.objectContaining({
        keyPrefix: expect.any(String),
        keyHash: expect.any(String),
        encryptedKey: null,
        webhookSecret: expect.any(String),
        status: 'ACTIVE',
      }),
    });
    expect(result.rawKey).toMatch(/^msk_live_/);
    expect(hashApiKey(result.rawKey)).toBe(result.client.keyHash);
  });
});
