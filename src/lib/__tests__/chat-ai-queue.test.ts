import {
  enqueueChatAiReply,
  getChatAiQueueStats,
} from '@/lib/chat-ai-queue';

describe('chat-ai-queue', () => {
  const originalMax = process.env.OLLAMA_MAX_CONCURRENT;

  afterEach(() => {
    if (originalMax === undefined) {
      delete process.env.OLLAMA_MAX_CONCURRENT;
    } else {
      process.env.OLLAMA_MAX_CONCURRENT = originalMax;
    }
  });

  it('exécute les tâches avec la limite de concurrence configurée', async () => {
    process.env.OLLAMA_MAX_CONCURRENT = '2';

    let running = 0;
    let maxRunning = 0;

    const task = async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 20));
      running -= 1;
    };

    await Promise.all([
      enqueueChatAiReply('conv-a', task),
      enqueueChatAiReply('conv-b', task),
      enqueueChatAiReply('conv-c', task),
    ]);

    expect(maxRunning).toBeLessThanOrEqual(2);
    expect(getChatAiQueueStats().active).toBe(0);
  });

  it('sérialise les réponses d une même conversation', async () => {
    process.env.OLLAMA_MAX_CONCURRENT = '3';

    const order: number[] = [];
    let current = 0;

    const task = async (id: number) => {
      order.push(id);
      await new Promise((resolve) => setTimeout(resolve, 10));
    };

    await Promise.all([
      enqueueChatAiReply('conv-1', () => task(++current)),
      enqueueChatAiReply('conv-1', () => task(++current)),
      enqueueChatAiReply('conv-1', () => task(++current)),
    ]);

    expect(order).toEqual([1, 2, 3]);
  });

  it('expose les stats de file d attente', () => {
    process.env.OLLAMA_MAX_CONCURRENT = '4';
    expect(getChatAiQueueStats()).toEqual({
      active: 0,
      waiting: 0,
      maxConcurrent: 4,
      trackedConversations: 0,
    });
  });
});
