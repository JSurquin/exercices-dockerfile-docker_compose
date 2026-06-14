const DEFAULT_MAX_CONCURRENT = 2;

function parseMaxConcurrent(): number {
  const raw = process.env.OLLAMA_MAX_CONCURRENT;
  if (!raw) return DEFAULT_MAX_CONCURRENT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_CONCURRENT;
}

let activeCount = 0;
const slotWaiters: Array<() => void> = [];
const conversationChains = new Map<string, Promise<void>>();

async function acquireSlot(): Promise<void> {
  const maxConcurrent = parseMaxConcurrent();
  if (activeCount < maxConcurrent) {
    activeCount += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    slotWaiters.push(() => {
      activeCount += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeCount = Math.max(0, activeCount - 1);
  const next = slotWaiters.shift();
  if (next) next();
}

export function getChatAiQueueStats(): {
  active: number;
  waiting: number;
  maxConcurrent: number;
  trackedConversations: number;
} {
  return {
    active: activeCount,
    waiting: slotWaiters.length,
    maxConcurrent: parseMaxConcurrent(),
    trackedConversations: conversationChains.size,
  };
}

/** Limite les appels Ollama et sérialise les réponses par conversation. */
export function enqueueChatAiReply(
  conversationId: string,
  task: () => Promise<void>,
): Promise<void> {
  const previous = conversationChains.get(conversationId) ?? Promise.resolve();

  const run = previous
    .catch(() => undefined)
    .then(async () => {
      await acquireSlot();
      try {
        await task();
      } finally {
        releaseSlot();
      }
    });

  conversationChains.set(conversationId, run);

  return run.finally(() => {
    if (conversationChains.get(conversationId) === run) {
      conversationChains.delete(conversationId);
    }
  });
}
