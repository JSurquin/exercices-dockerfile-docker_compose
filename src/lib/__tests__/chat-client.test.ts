/**
 * @jest-environment jsdom
 */
import {
  ACTIVE_CONVERSATION_KEY,
  fetchConversationsList,
  fetchMessagesPage,
  flattenMessagePages,
  GUEST_CONVERSATION_KEY,
  persistConversationId,
  readStoredConversationId,
  resolveActiveConversationId,
  subscribeStorage,
} from '@/lib/chat-client';
import { selectInitialConversationId } from '@/lib/chat-logic';

describe('readStoredConversationId / persistConversationId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lit active puis guest', () => {
    localStorage.setItem(GUEST_CONVERSATION_KEY, 'guest-1');
    expect(readStoredConversationId()).toBe('guest-1');
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, 'active-1');
    expect(readStoredConversationId()).toBe('active-1');
  });

  it('persiste et efface les deux clés', () => {
    persistConversationId('c1');
    expect(localStorage.getItem(ACTIVE_CONVERSATION_KEY)).toBe('c1');
    expect(localStorage.getItem(GUEST_CONVERSATION_KEY)).toBe('c1');
    persistConversationId(null);
    expect(localStorage.getItem(ACTIVE_CONVERSATION_KEY)).toBeNull();
  });
});

describe('subscribeStorage', () => {
  it('notifie sur storage event pertinent', () => {
    const listener = jest.fn();
    const unsub = subscribeStorage(listener);
    window.dispatchEvent(
      new StorageEvent('storage', { key: ACTIVE_CONVERSATION_KEY, newValue: 'x' }),
    );
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it('ignore les autres clés', () => {
    const listener = jest.fn();
    subscribeStorage(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'x' }));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('fetchConversationsList', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('retourne liste vide si non ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(fetchConversationsList()).resolves.toEqual({ conversations: [] });
  });

  it('normalise réponse tableau', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'c1' }],
    });
    const data = await fetchConversationsList();
    expect(data.conversations).toHaveLength(1);
  });

  it('accepte objet paginé', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ conversations: [{ id: 'c2' }] }),
    });
    const data = await fetchConversationsList();
    expect(data.conversations[0].id).toBe('c2');
  });
});

describe('fetchMessagesPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('inclut cursor si fourni', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [], nextCursor: null, hasMore: false }),
    });
    await fetchMessagesPage('c1', 'm-old');
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('cursor=m-old');
  });

  it('throw si échec', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(fetchMessagesPage('c1', null)).rejects.toThrow('FETCH_MESSAGES_FAILED');
  });
});

describe('flattenMessagePages', () => {
  it('retourne vide sans pages', () => {
    expect(flattenMessagePages(undefined)).toEqual([]);
  });

  it('concatène pages du plus ancien au plus récent', () => {
    const result = flattenMessagePages([
      { messages: [{ id: 'm2' } as never] },
      { messages: [{ id: 'm1' } as never] },
    ]);
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});

describe('resolveActiveConversationId', () => {
  it('priorise pickedId', () => {
    expect(
      resolveActiveConversationId({
        pickedId: 'picked',
        storedId: 'stored',
        conversations: [],
        selectInitial: selectInitialConversationId,
      }),
    ).toBe('picked');
  });

  it('délègue à selectInitial sinon', () => {
    expect(
      resolveActiveConversationId({
        pickedId: null,
        storedId: null,
        conversations: [{ id: 'c1', status: 'ACTIVE' }],
        selectInitial: selectInitialConversationId,
      }),
    ).toBe('c1');
  });
});
