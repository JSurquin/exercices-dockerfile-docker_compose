import {
  createChatMessageRecord,
  fetchConversationMessagesPage,
  softDeleteConversation,
  touchConversationAfterMessage,
} from '@/lib/chat-message-service';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '~/prisma/prisma';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('touchConversationAfterMessage', () => {
  it('met à jour lastMessageAt et titre auto pour premier message user', async () => {
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    await touchConversationAfterMessage('c1', 'ACTIVE', 'USER', {
      titleFromMessage: 'Mon trade est bloqué depuis hier',
      hasSubject: false,
    });

    const arg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.lastMessageAt).toBeInstanceOf(Date);
    expect(arg.data.subject).toContain('Mon trade');
  });

  it('met à jour sans auto-titre si pas de titleFromMessage', async () => {
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    await touchConversationAfterMessage('c1', 'ACTIVE', 'MODERATOR');
    const arg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.subject).toBeUndefined();
  });

  it('ne remplace pas un subject existant', async () => {
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    await touchConversationAfterMessage('c1', 'ACTIVE', 'USER', {
      titleFromMessage: 'Nouveau message',
      hasSubject: true,
    });

    const arg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.subject).toBeUndefined();
  });
});

describe('createChatMessageRecord', () => {
  it('crée le message puis touche la conversation', async () => {
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({
      id: 'm1',
      senderType: 'USER',
      content: 'Hello',
    });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
      subject: null,
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    const msg = await createChatMessageRecord({
      conversationId: 'c1',
      userId: 'u1',
      content: 'Hello',
      senderType: 'USER',
    });

    expect(msg.id).toBe('m1');
    expect(prisma.conversation.update).toHaveBeenCalled();
  });

  it('sans conversation après create ne touche pas', async () => {
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({ id: 'm1' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);

    await createChatMessageRecord({
      conversationId: 'c1',
      userId: null,
      content: 'x',
      senderType: 'SYSTEM',
    });

    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });

  it('auto-titre si subject vide ou whitespace', async () => {
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({ id: 'm1' });
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue({
      status: 'ACTIVE',
      subject: '   ',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});

    await createChatMessageRecord({
      conversationId: 'c1',
      userId: 'u1',
      content: 'Premier message user',
      senderType: 'USER',
    });

    const arg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.subject).toContain('Premier message');
  });
});

describe('fetchConversationMessagesPage', () => {
  it('hasMore avec nextCursor', async () => {
    const rows = Array.from({ length: 4 }, (_, i) => ({
      id: `m${i}`,
      createdAt: new Date(`2026-06-12T1${i}:00:00Z`),
      conversationId: 'c1',
    }));
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue(rows);

    const page = await fetchConversationMessagesPage({
      conversationId: 'c1',
      cursor: null,
      limit: 3,
    });

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('m2');
  });

  it('retourne les messages récents sans cursor', async () => {
    const rows = [
      { id: 'm2', createdAt: new Date('2026-06-12T12:00:00Z'), conversationId: 'c1' },
      { id: 'm1', createdAt: new Date('2026-06-12T11:00:00Z'), conversationId: 'c1' },
    ];
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue(rows);

    const page = await fetchConversationMessagesPage({
      conversationId: 'c1',
      cursor: null,
      limit: 30,
    });

    expect(page.messages).toHaveLength(2);
    expect(page.messages[0].id).toBe('m1');
    expect(page.hasMore).toBe(false);
  });

  it('paginer vers les messages plus anciens', async () => {
    (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'm5',
      createdAt: new Date('2026-06-12T10:00:00Z'),
      conversationId: 'c1',
    });
    (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([
      { id: 'm4', createdAt: new Date('2026-06-12T09:00:00Z'), conversationId: 'c1' },
    ]);

    const page = await fetchConversationMessagesPage({
      conversationId: 'c1',
      cursor: 'm5',
      limit: 30,
    });

    expect(page.messages[0].id).toBe('m4');
    const findArg = (prisma.chatMessage.findMany as jest.Mock).mock.calls[0][0];
    expect(findArg.where.createdAt).toBeDefined();
  });

  it('rejette un cursor d’une autre conversation', async () => {
    (prisma.chatMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'm1',
      createdAt: new Date(),
      conversationId: 'other',
    });

    await expect(
      fetchConversationMessagesPage({ conversationId: 'c1', cursor: 'm1', limit: 10 }),
    ).rejects.toThrow('INVALID_CURSOR');
  });
});

describe('softDeleteConversation', () => {
  it('passe le statut à DELETED avec deletedAt', async () => {
    (prisma.conversation.update as jest.Mock).mockResolvedValue({ status: 'DELETED' });

    await softDeleteConversation('c1');

    const arg = (prisma.conversation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.status).toBe('DELETED');
    expect(arg.data.deletedAt).toBeInstanceOf(Date);
  });
});
