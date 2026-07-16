import { prisma } from '~/prisma/prisma';
import { runAutoUnassignInactiveConversationsJob } from '@/lib/cron-jobs/auto-unassign-inactive-conversations';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/chat-message-service', () => ({
  createChatMessageRecord: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const { createChatMessageRecord } = jest.requireMock('@/lib/chat-message-service') as {
  createChatMessageRecord: jest.Mock;
};

describe('runAutoUnassignInactiveConversationsJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    createChatMessageRecord.mockResolvedValue({ id: 'm1' });
  });

  it('désassigne les conversations assignées inactives depuis 1 h', async () => {
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([
      { id: 'c1', aiEnabled: false },
    ]);

    const result = await runAutoUnassignInactiveConversationsJob();

    expect(createChatMessageRecord).toHaveBeenCalledWith({
      conversationId: 'c1',
      userId: null,
      content: '__i18n:moderation.conversation.system.unassigned__',
      senderType: 'SYSTEM',
    });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({
        assignedTo: null,
        aiEnabled: true,
      }),
    });
    expect(result.unassignedCount).toBe(1);
    expect(result.success).toBe(true);
  });

  it('ne fait rien sans conversation éligible', async () => {
    const result = await runAutoUnassignInactiveConversationsJob();
    expect(createChatMessageRecord).not.toHaveBeenCalled();
    expect(result.unassignedCount).toBe(0);
  });
});
