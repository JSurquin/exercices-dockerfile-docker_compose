import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/require-session-user', () => ({
  requireUserSession: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/review-prompt', () => {
  const actual = jest.requireActual('@/lib/review-prompt');
  return {
    ...actual,
    resolveAndConsumeReviewPrompt: jest.fn(),
  };
});

import { requireUserSession } from '@/lib/require-session-user';
import { prisma } from '~/prisma/prisma';
import { resolveAndConsumeReviewPrompt } from '@/lib/review-prompt';
import { GET, POST } from '@/app/api/user/review-prompt/route';

const mockRequireUserSession = requireUserSession as jest.Mock;
const mockUserUpdate = prisma.user.update as jest.Mock;
const mockResolve = resolveAndConsumeReviewPrompt as jest.Mock;

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/review-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/user/review-prompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserUpdate.mockResolvedValue({ id: 'u1' });
  });

  it('exige une authentification', async () => {
    mockRequireUserSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ action: 'clicked', trigger: 'withdrawal' }));
    expect(res.status).toBe(401);
  });

  it('enregistre le clic de façon idempotente', async () => {
    mockRequireUserSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(makeRequest({ action: 'clicked', trigger: 'withdrawal' }));
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({
        reviewPromptAction: 'clicked',
        reviewPromptTrigger: 'withdrawal',
      }),
    });

    const res2 = await POST(makeRequest({ action: 'clicked', trigger: 'withdrawal' }));
    expect(res2.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledTimes(2);
  });

  it('rejette un body invalide', async () => {
    mockRequireUserSession.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(makeRequest({ action: 'rated', trigger: 'withdrawal' }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});

describe('GET /api/user/review-prompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolve.mockResolvedValue({ askReview: false, amountCents: null });
  });

  it('exige une authentification', async () => {
    mockRequireUserSession.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/user/review-prompt'));
    expect(res.status).toBe(401);
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('évalue un retrait payé au chargement de page', async () => {
    mockRequireUserSession.mockResolvedValue({ user: { id: 'u1' } });
    mockResolve.mockResolvedValue({ askReview: true, amountCents: 9950 });

    const res = await GET(new NextRequest('http://localhost/api/user/review-prompt'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      askReview: true,
      trigger: 'withdrawal',
      amountCents: 9950,
    });
    expect(mockResolve).toHaveBeenCalledWith('u1', { type: 'withdrawal' });
  });
});
