import { assignConversationToModerator, autoAssignModeratorOnReplyIfUnassigned } from '@/lib/chat-assignment';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import { prisma } from '~/prisma/prisma';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('assignConversationToModerator', () => {
  it('assigne le modérateur et crée un message SYSTEM', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'mod-1',
      role: 'MODERATOR',
      name: 'Mod Test',
      email: 'mod@test.com',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({});

    const ok = await assignConversationToModerator({
      conversationId: 'c1',
      moderatorId: 'mod-1',
      assignedBy: 'admin-1',
      previousAssignedTo: null,
    });

    expect(ok).toBe(true);
    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({ assignedTo: 'mod-1' }),
      }),
    );
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: 'SYSTEM',
          content: '__i18n:moderation.conversation.system.assigned|Mod Test__',
        }),
      }),
    );
  });

  it('refuse un utilisateur non modérateur', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: 'USER',
      name: 'User',
      email: 'user@test.com',
    });

    const ok = await assignConversationToModerator({
      conversationId: 'c1',
      moderatorId: 'u1',
      assignedBy: 'admin-1',
    });

    expect(ok).toBe(false);
    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });
});

describe('autoAssignModeratorOnReplyIfUnassigned', () => {
  it('assigne automatiquement si le ticket est non assigné', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'mod-1',
      role: 'MODERATOR',
      name: 'Mod Test',
      email: 'mod@test.com',
    });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    (prisma.chatMessage.create as jest.Mock).mockResolvedValue({});

    const ok = await autoAssignModeratorOnReplyIfUnassigned({
      conversationId: 'c1',
      moderatorId: 'mod-1',
      assignedTo: null,
    });

    expect(ok).toBe(true);
    expect(prisma.conversation.update).toHaveBeenCalled();
  });

  it('ne réassigne pas si le ticket est déjà assigné', async () => {
    const ok = await autoAssignModeratorOnReplyIfUnassigned({
      conversationId: 'c1',
      moderatorId: 'mod-2',
      assignedTo: 'mod-1',
    });

    expect(ok).toBe(false);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.conversation.update).not.toHaveBeenCalled();
  });
});
