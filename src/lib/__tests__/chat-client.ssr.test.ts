import {
  persistConversationId,
  readStoredConversationId,
  subscribeStorage,
} from '@/lib/chat-client';

describe('chat-client SSR branches', () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  it('readStoredConversationId retourne null sans window', () => {
    // @ts-expect-error simulate SSR
    delete global.window;
    expect(readStoredConversationId()).toBeNull();
  });

  it('persistConversationId no-op sans window', () => {
    // @ts-expect-error simulate SSR
    delete global.window;
    expect(() => persistConversationId('c1')).not.toThrow();
  });

  it('subscribeStorage no-op sans window', () => {
    // @ts-expect-error simulate SSR
    delete global.window;
    const unsub = subscribeStorage(() => undefined);
    expect(typeof unsub).toBe('function');
    expect(unsub()).toBeUndefined();
  });
});
