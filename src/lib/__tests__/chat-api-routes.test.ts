import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/require-admin', () => ({
  resolveChatIdentity: jest.fn(),
  requireAdminOrModeratorSessionWithDbCheck: jest.fn(),
  requireAdminSessionWithDbCheck: jest.fn(),
}));

jest.mock('@/lib/chat-ai-service', () => ({
  maybeGenerateAiReply: jest.fn(),
}));

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    after: (fn: () => void) => fn(),
  };
});

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
  logAudit: jest.fn(),
}));

import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import {
  resolveChatIdentity,
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from '@/lib/require-admin';
import { maybeGenerateAiReply } from '@/lib/chat-ai-service';
import { GET as getConversations, POST as postConversations } from '@/app/api/chat/conversations/route';
import { POST as postMessage } from '@/app/api/chat/messages/route';
import {
  GET as getConversation,
  PATCH as patchConversation,
  DELETE as deleteConversation,
} from '@/app/api/chat/conversations/[id]/route';
import { POST as postBotMessage } from '@/app/api/chat/conversations/[id]/bot-message/route';
import { POST as postAssign, DELETE as deleteAssign } from '@/app/api/chat/conversations/[id]/assign/route';
import { GET as getAiHealth } from '@/app/api/chat/ai/health/route';

const mockResolveChatIdentity = resolveChatIdentity as jest.Mock;
const mockRequireStaff = requireAdminOrModeratorSessionWithDbCheck as jest.Mock;
const mockRequireAdmin = requireAdminSessionWithDbCheck as jest.Mock;
const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockMaybeAi = maybeGenerateAiReply as jest.Mock;

function makeRequest(
  url: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: init?.headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.CHAT_AI_ENABLED;
});

describe('GET /api/chat/conversations', () => {
  it('retourne 401 pour invité', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    const res = await getConversations(makeRequest('http://localhost/api/chat/conversations'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour compte gelé', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'invalid' });
    const res = await getConversations(makeRequest('http://localhost/api/chat/conversations'));
    expect(res.status).toBe(403);
  });

  it('liste les conversations pour un user connecté', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([{ id: 'c1' }]);
    (prisma.conversation.count as jest.Mock).mockResolvedValue(1);

    const res = await getConversations(makeRequest('http://localhost/api/chat/conversations'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.conversations).toHaveLength(1);
  });
});

describe('POST /api/chat/conversations', () => {
  it('crée une conversation invité (userId null)', async () => {
    mockGetSession.mockResolvedValue(null);
    (prisma.conversation.create as jest.Mock).mockResolvedValue({
      id: 'guest-conv',
      userId: null,
      messages: [{ content: 'Support trade' }],
    });

    const res = await postConversations(
      makeRequest('http://localhost/api/chat/conversations', {
        method: 'POST',
        body: { initialMessage: 'Support trade' },
      }),
    );

    expect(res.status).toBe(201);
    const createArg = (prisma.conversation.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.userId).toBeNull();
  });
});

describe('POST /api/chat/messages', () => {
  const conversation = {
    id: 'c1',
    userId: null,
    status: 'ACTIVE',
    assignedTo: null,
    user: null,
  };

  it('refuse invité sur conversation liée à un compte', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      ...conversation,
      userId: 'u1',
    });
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

    const res = await postMessage(
      makeRequest('http://localhost/api/chat/messages', {
        method: 'POST',
        body: { conversationId: 'c1', content: 'hello' },
      }),
    );
    expect(res.status).toBe(401);
  });

  it('crée un message user et déclenche maybeGenerateAiReply', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      ...conversation,
      lastMessageAt: new Date(),
      category: 'trade',
    });
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'm1',
      senderType: 'USER',
      content: 'Mon trade est bloqué',
    });
    (prisma.chatMessage.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'm0', senderType: 'BOT' },
        { id: 'm1', senderType: 'USER' },
      ]);
    (prisma.conversation.update as jest.Mock).mockResolvedValue(conversation);
    mockMaybeAi.mockResolvedValue(undefined);

    const res = await postMessage(
      makeRequest('http://localhost/api/chat/messages', {
        method: 'POST',
        body: { conversationId: 'c1', content: 'Mon trade est bloqué' },
      }),
    );

    expect(res.status).toBe(201);
    expect(mockMaybeAi).toHaveBeenCalledWith('c1');
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);
  });

  it('bloque user sur conversation fermée', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      ...conversation,
      status: 'CLOSED',
    });
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

    const res = await postMessage(
      makeRequest('http://localhost/api/chat/messages', {
        method: 'POST',
        body: { conversationId: 'c1', content: 'reopen?' },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/chat/conversations/[id]', () => {
  it('masque les emails pour invité', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: null,
      assignedTo: null,
      user: { email: 'secret@test.com' },
      assignedModerator: null,
      messages: [],
    });

    const res = await getConversation(
      makeRequest('http://localhost/api/chat/conversations/c1'),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBeNull();
  });
});

describe('PATCH /api/chat/conversations/[id]', () => {
  it('ferme une conversation (staff)', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'mod-1' } });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      status: 'ACTIVE',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({
      id: 'c1',
      status: 'CLOSED',
      messages: [],
    });

    const res = await patchConversation(
      makeRequest('http://localhost/api/chat/conversations/c1', {
        method: 'PATCH',
        body: { status: 'CLOSED' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(200);
    const updateArg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.data.status).toBe('CLOSED');
    expect(updateArg.data.closedAt).toBeInstanceOf(Date);
  });
});

describe('POST /api/chat/conversations/[id]/bot-message', () => {
  it('envoie un template BOT valide', async () => {
    mockGetSession.mockResolvedValue(null);
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      user: { steamUsername: 'Player', name: null },
      status: 'ACTIVE',
      subject: null,
    });
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'bot-1',
      senderType: 'BOT',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    const res = await postBotMessage(
      makeRequest('http://localhost/api/chat/conversations/c1/bot-message', {
        method: 'POST',
        body: { subcategoryKey: 'trade.pending' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(201);
    const createArg = (prisma.chatMessage.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.senderType).toBe('BOT');
    expect(createArg.data.content).toBe('__i18n:chatWidget.botTemplates.trade.pending|Player__');
  });

  it('rejette une sous-catégorie invalide', async () => {
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', user: null });

    const res = await postBotMessage(
      makeRequest('http://localhost/api/chat/conversations/c1/bot-message', {
        method: 'POST',
        body: { subcategoryKey: 'invalid.key' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(400);
  });
});

describe('POST/DELETE /api/chat/conversations/[id]/assign', () => {
  it('assigne un modérateur et crée un message SYSTEM', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'admin-1' } });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      assignedTo: null,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'mod-1',
      role: 'MODERATOR',
      name: 'Mod Test',
      email: 'mod@test.com',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({ id: 'c1', assignedTo: 'mod-1' });

    const res = await postAssign(
      makeRequest('http://localhost/api/chat/conversations/c1/assign', {
        method: 'POST',
        body: { moderatorId: 'mod-1' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(200);
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ senderType: 'SYSTEM' }),
      }),
    );
  });

  it('refuse l’assignation d’un utilisateur non modérateur', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'admin-1' } });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      assignedTo: null,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: 'USER',
      name: 'User',
      email: 'user@test.com',
    });

    const res = await postAssign(
      makeRequest('http://localhost/api/chat/conversations/c1/assign', {
        method: 'POST',
        body: { moderatorId: 'u1' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(400);
    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('désassigne une conversation', async () => {
    mockRequireStaff.mockResolvedValue({ user: { id: 'mod-1' } });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      assignedTo: 'mod-1',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({ id: 'c1', assignedTo: null });

    const res = await deleteAssign(
      makeRequest('http://localhost/api/chat/conversations/c1/assign', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(200);
    expect(prisma.chatMessage.create).toHaveBeenCalled();
  });
});

describe('DELETE /api/chat/conversations/[id]', () => {
  it('401 pour invité', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: null });

    const res = await deleteConversation(
      makeRequest('http://localhost/api/chat/conversations/c1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(401);
  });

  it('403 si user tiers', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u2' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
    });

    const res = await deleteConversation(
      makeRequest('http://localhost/api/chat/conversations/c1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('soft delete pour le propriétaire', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({
      id: 'c1',
      status: 'DELETED',
    });

    const res = await deleteConversation(
      makeRequest('http://localhost/api/chat/conversations/c1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(200);
    const updateArg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.data.status).toBe('DELETED');
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date);
  });

  it('soft delete pour admin sur conversation d’un autre user', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'ADMIN',
      session: { user: { id: 'admin-1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({ status: 'DELETED' });

    const res = await deleteConversation(
      makeRequest('http://localhost/api/chat/conversations/c1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(200);
    expect(prisma.conversation.update).toHaveBeenCalled();
  });
});

describe('POST /api/chat/messages — modération', () => {
  it('modérateur assigné peut répondre sur conversation fermée', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'MODERATOR',
      session: { user: { id: 'mod-1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      status: 'CLOSED',
      assignedTo: 'mod-1',
      lastMessageAt: new Date(),
      category: 'support',
      user: null,
    });
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'm-mod',
      senderType: 'MODERATOR',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

    const res = await postMessage(
      makeRequest('http://localhost/api/chat/messages', {
        method: 'POST',
        body: { conversationId: 'c1', content: 'Réponse modérateur' },
      }),
    );
    expect(res.status).toBe(201);
    const createArg = (prisma.chatMessage.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.senderType).toBe('MODERATOR');
  });

  it('message modérateur visible côté client avec senderType MODERATOR', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'MODERATOR',
      session: { user: { id: 'mod-1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      status: 'ACTIVE',
      assignedTo: 'mod-1',
      lastMessageAt: new Date(),
      category: 'trade',
      user: null,
    });
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'm-mod',
      senderType: 'MODERATOR',
      content: 'Votre trade est en cours de vérification',
      conversationId: 'c1',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

    const res = await postMessage(
      makeRequest('http://localhost/api/chat/messages', {
        method: 'POST',
        body: { conversationId: 'c1', content: 'Votre trade est en cours de vérification' },
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.senderType).toBe('MODERATOR');
    expect(body.content).toContain('vérification');
  });
});

describe('GET /api/chat/ai/health', () => {
  it('signale IA désactivée quand CHAT_AI_ENABLED=false', async () => {
    const res = await getAiHealth();
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.ok).toBe(false);
  });
});
