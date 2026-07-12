import { prisma } from '~/prisma/prisma';
import { runAutoCloseInactiveConversationsJob } from '@/lib/cron-jobs/auto-close-inactive-conversations';
import { CONVERSATION_AUTO_CLOSED_I18N_KEY } from '@/lib/chat-logic';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    conversation: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      updateMany: jest.fn(),
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

describe('runAutoCloseInactiveConversationsJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.chatMessage.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.conversation.update as jest.Mock).mockResolvedValue({});
    createChatMessageRecord.mockResolvedValue({ id: 'm1' });
  });

  it('ferme les conversations actives inactives depuis 6 h', async () => {
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([{ id: 'c1' }]);

    const result = await runAutoCloseInactiveConversationsJob();

    expect(createChatMessageRecord).toHaveBeenCalledWith({
      conversationId: 'c1',
      userId: null,
      content: CONVERSATION_AUTO_CLOSED_I18N_KEY,
      senderType: 'SYSTEM',
    });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: expect.objectContaining({ status: 'CLOSED' }),
    });
    expect(result.closedCount).toBe(1);
    expect(result.success).toBe(true);
  });

  it('ne fait rien sans conversation éligible', async () => {
    const result = await runAutoCloseInactiveConversationsJob();
    expect(createChatMessageRecord).not.toHaveBeenCalled();
    expect(result.closedCount).toBe(0);
  });
});
