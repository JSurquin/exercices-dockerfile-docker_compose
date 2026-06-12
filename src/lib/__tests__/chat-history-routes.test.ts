import { NextRequest } from 'next/server';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    chatMessage: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/require-admin', () => ({
  resolveChatIdentity: jest.fn(),
}));

jest.mock('@/lib/chat-ai-service', () => ({
  maybeGenerateAiReply: jest.fn(),
}));

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return { ...actual, after: (fn: () => void) => fn() };
});

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/chat-message-service', () => ({
  createChatMessageRecord: jest.fn(),
  fetchConversationMessagesPage: jest.fn(),
  markConversationMessagesAsReadForViewer: jest.fn(),
  applyReadStateToMessagesForViewer: jest.fn((messages: unknown[]) => messages),
}));

import { prisma } from '~/prisma/prisma';
import { resolveChatIdentity } from '@/lib/require-admin';
import {
  createChatMessageRecord,
  fetchConversationMessagesPage,
  markConversationMessagesAsReadForViewer,
} from '@/lib/chat-message-service';
import {
  GET as getMessages,
  POST as postThreadMessage,
} from '@/app/api/chat/conversations/[id]/messages/route';

const mockIdentity = resolveChatIdentity as jest.Mock;
const mockFetchPage = fetchConversationMessagesPage as jest.Mock;
const mockCreateMsg = createChatMessageRecord as jest.Mock;
const mockMarkRead = markConversationMessagesAsReadForViewer as jest.Mock;

function makeRequest(url: string, init?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/chat/conversations/[id]/messages', () => {
  it('403 pour user tiers', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u2' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      assignedTo: null,
      user: null,
    });

    const res = await getMessages(
      makeRequest('http://localhost/api/chat/conversations/c1/messages'),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('paginer pour le propriétaire', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      assignedTo: null,
      user: null,
    });
    mockFetchPage.mockResolvedValue({
      messages: [{ id: 'm1', content: 'Hi', senderType: 'USER' }],
      nextCursor: null,
      hasMore: false,
    });
    (prisma.chatMessage.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    const res = await getMessages(
      makeRequest('http://localhost/api/chat/conversations/c1/messages?limit=30'),
      { params: Promise.resolve({ id: 'c1' }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(1);
    expect(mockMarkRead).toHaveBeenCalledWith({
      conversationId: 'c1',
      role: 'USER',
    });
    expect(mockFetchPage).toHaveBeenCalledWith({
      conversationId: 'c1',
      cursor: null,
      limit: 30,
    });
  });

  it('modérateur accède à toute conversation', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'MODERATOR',
      session: { user: { id: 'mod-1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      assignedTo: null,
      user: { email: 'user@test.com' },
    });
    mockFetchPage.mockResolvedValue({ messages: [], nextCursor: null, hasMore: false });
    (prisma.chatMessage.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

    const res = await getMessages(
      makeRequest('http://localhost/api/chat/conversations/c1/messages'),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(200);
    expect(mockMarkRead).toHaveBeenCalledWith({
      conversationId: 'c1',
      role: 'MODERATOR',
    });
  });
});

describe('POST /api/chat/conversations/[id]/messages', () => {
  it('bloque user sur conversation DELETED', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      status: 'DELETED',
      assignedTo: null,
      lastMessageAt: new Date(),
      category: 'trade',
      user: null,
    });
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);

    const res = await postThreadMessage(
      makeRequest('http://localhost/api/chat/conversations/c1/messages', {
        method: 'POST',
        body: { content: 'hello' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('modérateur peut répondre sur conversation fermée', async () => {
    mockIdentity.mockResolvedValue({
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
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([]);
    mockCreateMsg.mockResolvedValue({ id: 'm1', senderType: 'MODERATOR' });

    const res = await postThreadMessage(
      makeRequest('http://localhost/api/chat/conversations/c1/messages', {
        method: 'POST',
        body: { content: 'Réponse staff' },
      }),
      { params: Promise.resolve({ id: 'c1' }) },
    );
    expect(res.status).toBe(201);
    expect(mockCreateMsg).toHaveBeenCalledWith(
      expect.objectContaining({ senderType: 'MODERATOR' }),
    );
  });
});
