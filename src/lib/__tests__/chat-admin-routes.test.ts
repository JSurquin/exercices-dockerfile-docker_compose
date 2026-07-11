import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      updateMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    chatMessage: {
      count: jest.fn(),
    },
    affiliateStats: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
      createUser: jest.fn(),
    },
  },
}));

jest.mock('@/lib/require-admin', () => ({
  requireAdminSessionWithDbCheck: jest.fn(),
  requireAdminOrModeratorSessionWithDbCheck: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
  logAudit: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  emailService: { sendEmail: jest.fn().mockResolvedValue(undefined) },
}));

import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from '@/lib/require-admin';
import { GET as getModerators, POST as postModerators } from '@/app/api/admin/moderators/route';
import { GET as getModerator, DELETE as deleteModerator } from '@/app/api/admin/moderators/[id]/route';
import { POST as inviteModerator } from '@/app/api/admin/moderators/invite/route';
import { GET as getModeratorStats } from '@/app/api/chat/stats/moderators/route';
import { GET as getChatStats } from '@/app/api/chat/stats/route';
import { GET as getChatFeedback } from '@/app/api/chat/feedback/route';

const mockRequireAdmin = requireAdminSessionWithDbCheck as jest.Mock;
const mockRequireStaff = requireAdminOrModeratorSessionWithDbCheck as jest.Mock;

function makeRequest(url: string, init?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/admin/moderators', () => {
  it('403 sans session admin', async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const res = await getModerators(makeRequest('http://localhost/api/admin/moderators'));
    expect(res.status).toBe(403);
  });

  it('liste les modérateurs', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'm1', role: 'MODERATOR' }]);

    const res = await getModerators(makeRequest('http://localhost/api/admin/moderators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.moderators).toHaveLength(1);
  });
});

describe('POST /api/admin/moderators — promotion', () => {
  it('refuse de promouvoir un admin', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN', email: 'a@test.com' });

    const res = await postModerators(
      makeRequest('http://localhost/api/admin/moderators', {
        method: 'POST',
        body: { userId: 'u1' },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('promouvoit un USER', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'USER', email: 'u@test.com' });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1', role: 'MODERATOR' });

    const res = await postModerators(
      makeRequest('http://localhost/api/admin/moderators', {
        method: 'POST',
        body: { userId: 'u1' },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('MODERATOR');
  });
});

describe('DELETE /api/admin/moderators/[id] — rétrogradation', () => {
  it('refuse auto-rétrogradation', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'mod-1' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'mod-1', role: 'MODERATOR', email: 'm@test.com' });

    const res = await deleteModerator(
      makeRequest('http://localhost/api/admin/moderators/mod-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'mod-1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('rétrograde vers AFFILIATE si affilié actif', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'mod-1', role: 'MODERATOR', email: 'm@test.com' });
    (prisma.affiliateStats.findUnique as jest.Mock).mockResolvedValue({ isActive: true });
    (prisma.conversation.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'mod-1', role: 'AFFILIATE' });

    const res = await deleteModerator(
      makeRequest('http://localhost/api/admin/moderators/mod-1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'mod-1' }) },
    );
    expect(res.status).toBe(200);
    const updateArg = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.data.role).toBe('AFFILIATE');
    expect(prisma.conversation.updateMany).toHaveBeenCalled();
  });
});

describe('GET /api/admin/moderators/[id]', () => {
  it('refuse un utilisateur non staff', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'USER' });

    const res = await getModerator(
      makeRequest('http://localhost/api/admin/moderators/u1'),
      { params: Promise.resolve({ id: 'u1' }) },
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin/moderators/invite', () => {
  it('promouvoit un compte existant', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: 'USER',
      email: 'mod@test.com',
      name: 'Mod',
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'u1', role: 'MODERATOR', email: 'mod@test.com' });

    const res = await inviteModerator(
      makeRequest('http://localhost/api/admin/moderators/invite', {
        method: 'POST',
        body: { email: 'mod@test.com' },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invited).toBe(false);
    expect(body.role).toBe('MODERATOR');
  });
});

describe('GET /api/chat/stats', () => {
  it('403 pour non-staff', async () => {
    mockRequireStaff.mockResolvedValue(null);

    const res = await getChatStats(makeRequest('http://localhost/api/chat/stats'));
    expect(res.status).toBe(403);
  });

  it('retourne les stats agrégées pour staff', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'mod-1' } });
    (prisma.conversation.count as jest.Mock).mockResolvedValue(5);
    (prisma.conversation.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);

    const res = await getChatStats(makeRequest('http://localhost/api/chat/stats'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalConversations).toBeDefined();
  });
});

describe('GET /api/chat/stats/moderators', () => {
  it('retourne les stats par modérateur', async () => {
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin' } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'mod-1', name: 'Mod', email: 'm@test.com' },
    ]);
    (prisma.conversation.count as jest.Mock).mockResolvedValue(3);
    (prisma.chatMessage.count as jest.Mock).mockResolvedValue(10);
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);

    const res = await getModeratorStats(makeRequest('http://localhost/api/chat/stats/moderators'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('mod-1');
  });
});

describe('GET /api/chat/feedback', () => {
  it('403 pour non-staff', async () => {
    mockRequireStaff.mockResolvedValue(null);
    const res = await getChatFeedback(makeRequest('http://localhost/api/chat/feedback'));
    expect(res.status).toBe(403);
  });

  it('retourne les avis pour admin (tous)', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (prisma.conversation.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'c1',
          subject: 'Test',
          clientRating: 5,
          clientFeedback: 'Super',
          clientRatedAt: new Date(),
          closedAt: new Date(),
          user: { id: 'u1', name: 'User', email: 'u@test.com', steamUsername: null },
          assignedModerator: { id: 'mod-1', name: 'Mod', email: 'm@test.com' },
        },
      ])
      .mockResolvedValueOnce([{ clientRating: 5, clientFeedback: 'Super' }]);
    (prisma.conversation.count as jest.Mock).mockResolvedValue(1);

    const res = await getChatFeedback(makeRequest('http://localhost/api/chat/feedback?scope=all'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.feedback).toHaveLength(1);
    expect(body.summary.ratedCount).toBe(1);
    expect(body.summary.feedbackCount).toBe(1);
  });

  it('filtre aux conversations assignées pour modérateur', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'mod-1', role: 'MODERATOR' } });
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]).mockResolvedValue([]);
    (prisma.conversation.count as jest.Mock).mockResolvedValue(0);

    const res = await getChatFeedback(makeRequest('http://localhost/api/chat/feedback?scope=all'));
    expect(res.status).toBe(200);

    const listCall = (prisma.conversation.findMany as jest.Mock).mock.calls[0][0];
    expect(listCall.where.assignedTo).toBe('mod-1');
  });
});
