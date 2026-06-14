/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from '@/hooks/use-chat';
import * as chatClient from '@/lib/chat-client';
import type { ChatMessage } from '@/lib/chat-client-types';
import { queryKeys } from '@/lib/query-keys';
import * as sound from '@/lib/play-notification-sound';

jest.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    messages: {
      hooks: {
        chat: {
          createConversationError: 'create err',
          sendMessageError: 'send err',
        },
      },
    },
  }),
}));

jest.mock('@/lib/play-notification-sound', () => ({
  playNotificationSound: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.fetch = jest.fn();
});

describe('useChat', () => {
  it('charge conversations quand ouvert', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        {
          id: 'c1',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          lastMessageAt: '2026-01-02',
          messages: [],
        },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [{ id: 'm1', content: 'hi', senderType: 'USER', createdAt: '2026-01-02', isRead: true }],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat(true), { wrapper });

    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.getUnreadCount()).toBe(0);
    expect(result.current.isRefreshingMessages).toBe(false);
  });

  it('startNewConversation efface la sélection', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    const { result } = renderHook(() => useChat(true), { wrapper });

    result.current.setConversationId('c99');
    result.current.startNewConversation();
    expect(result.current.conversationId).toBeNull();
  });

  it('startNewConversation ignore la conversation active existante', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        {
          id: 'c1',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          lastMessageAt: '2026-01-02',
          messages: [],
        },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));

    result.current.startNewConversation();
    await waitFor(() => expect(result.current.conversationId).toBeNull());
  });

  it('sendMessage en mode nouvelle conversation force un nouveau fil', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        { id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', lastMessageAt: '', messages: [] },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'm1',
        conversationId: 'c-new',
        createdNewConversation: true,
      }),
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));

    result.current.startNewConversation();
    await waitFor(() => expect(result.current.conversationId).toBeNull());
    await result.current.sendMessage('Trade bloqué', { category: 'trade' });

    expect(global.fetch).toHaveBeenCalledWith('/api/chat/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        content: 'Trade bloqué',
        category: 'trade',
        forceNew: true,
      }),
    }));
    await waitFor(() => expect(result.current.conversationId).toBe('c-new'));
  });

  it('sendMessage appelle l’API', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm1', conversationId: 'c1', senderType: 'USER' }),
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await result.current.sendMessage('hello', { category: 'trade' });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('sendMessage sur conversation fermée force un nouveau fil', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        { id: 'c1', status: 'CLOSED', createdAt: '', updatedAt: '', lastMessageAt: '', messages: [] },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'm1',
        conversationId: 'c-new',
        createdNewConversation: true,
      }),
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    result.current.setConversationId('c1');
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await result.current.sendMessage('nouveau message');

    expect(global.fetch).toHaveBeenCalledWith('/api/chat/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        content: 'nouveau message',
        forceNew: true,
      }),
    }));
  });

  it('ne charge pas les queries si fermé', () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    const { result } = renderHook(() => useChat(false), { wrapper });
    expect(result.current.conversations).toEqual([]);
    expect(chatClient.fetchConversationsList).not.toHaveBeenCalled();
  });

  it('createConversation via mutation', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-c', status: 'ACTIVE' }),
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.sendMessage('first message');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('joue un son quand message staff arrive', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    let call = 0;
    jest.spyOn(chatClient, 'fetchMessagesPage').mockImplementation(async () => {
      call += 1;
      return {
        messages:
          call > 1
            ? [
                { id: 'm1', senderType: 'BOT', isRead: false, content: 'x', createdAt: '' },
                { id: 'm2', senderType: 'BOT', isRead: false, content: 'y', createdAt: '' },
              ]
            : [{ id: 'm1', senderType: 'BOT', isRead: false, content: 'x', createdAt: '' }],
        nextCursor: null,
        hasMore: false,
      };
    });

    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchInterval: false, staleTime: 0 },
      },
    });
    const w = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChat(true), { wrapper: w });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await client.refetchQueries({ queryKey: ['chat', 'conversation', 'c1', 'messages'] });
    await waitFor(() => expect(sound.playNotificationSound).toHaveBeenCalled());
  });

  it('joue un son pour message MODERATOR avec les bons paramètres', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    let call = 0;
    jest.spyOn(chatClient, 'fetchMessagesPage').mockImplementation(async () => {
      call += 1;
      return {
        messages:
          call > 1
            ? [
                { id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' },
                { id: 'm2', senderType: 'MODERATOR', isRead: false, content: 'r', createdAt: '' },
              ]
            : [{ id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' }],
        nextCursor: null,
        hasMore: false,
      };
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchInterval: false, staleTime: 0 } },
    });
    const w = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useChat(true), { wrapper: w });
    await waitFor(() => expect(chatClient.fetchMessagesPage).toHaveBeenCalled());
    await client.refetchQueries({ queryKey: ['chat', 'conversation', 'c1', 'messages'] });
    await waitFor(() =>
      expect(sound.playNotificationSound).toHaveBeenCalledWith(660, 400, 0.25),
    );
  });

  it('ne joue pas de son au premier chargement ni pour message USER seul', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [{ id: 'm1', senderType: 'USER', isRead: false, content: 'hello', createdAt: '' }],
      nextCursor: null,
      hasMore: false,
    });

    renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(chatClient.fetchMessagesPage).toHaveBeenCalled());
    expect(sound.playNotificationSound).not.toHaveBeenCalled();
  });

  it('compte les messages staff non lus via getUnreadCount', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [
        { id: 'm1', senderType: 'MODERATOR', isRead: false, content: 'a', createdAt: '' },
        { id: 'm2', senderType: 'BOT', isRead: false, content: 'b', createdAt: '' },
        { id: 'm3', senderType: 'USER', isRead: false, content: 'c', createdAt: '' },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    expect(result.current.getUnreadCount()).toBe(2);
  });

  it('getUnreadCount retourne 0 quand la conversation est consultée', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [
        { id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' },
        { id: 'm2', senderType: 'BOT', isRead: false, content: 'r', createdAt: '' },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat(true, true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    expect(result.current.getUnreadCount()).toBe(0);
    expect(result.current.conversationListItems[0]?.unread).toBe(0);
  });

  it('getUnreadCount retourne 0 pendant awaitingStaffReply sur la conversation active', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        {
          id: 'c1',
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
          messages: [{ id: 'm2', senderType: 'BOT', isRead: false, content: 'bot', createdAt: '' }],
        },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [{ id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' }],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm3', conversationId: 'c1' }),
    });

    const { result } = renderHook(() => useChat(true, false), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    expect(result.current.getUnreadCount()).toBe(0);
    expect(result.current.conversationListItems[0]?.unread).toBe(1);

    await result.current.sendMessage('nouvelle question');
    await waitFor(() => expect(result.current.getUnreadCount()).toBe(0));
    expect(result.current.getListUnreadTotal()).toBe(0);
    expect(result.current.conversationListItems[0]?.unread).toBe(0);
  });

  it('ne joue pas de son pour un message bot reçu pendant la consultation', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    let call = 0;
    jest.spyOn(chatClient, 'fetchMessagesPage').mockImplementation(async () => {
      call += 1;
      return {
        messages:
          call > 1
            ? [
                { id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' },
                { id: 'm2', senderType: 'BOT', isRead: false, content: 'r', createdAt: '' },
              ]
            : [{ id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' }],
        nextCursor: null,
        hasMore: false,
      };
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchInterval: false, staleTime: 0 } },
    });
    const w = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useChat(true, true), { wrapper: w });
    await waitFor(() => expect(chatClient.fetchMessagesPage).toHaveBeenCalled());
    await client.refetchQueries({ queryKey: ['chat', 'conversation', 'c1', 'messages'] });
    expect(sound.playNotificationSound).not.toHaveBeenCalled();
  });

  it('expose le snapshot SSR sans localStorage', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    function Probe() {
      useChat(false);
      return null;
    }
    const client = new QueryClient();
    const html = renderToString(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(html).toBe('');
  });

  it('sync multi-onglets via storage event', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        { id: 'stored-c', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] },
        { id: 'other-c', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    localStorage.setItem('chat_active_conversation_id', 'stored-c');

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('stored-c'));

    localStorage.setItem('chat_active_conversation_id', 'other-c');
    window.dispatchEvent(new StorageEvent('storage', { key: 'chat_active_conversation_id' }));
    await waitFor(() => expect(result.current.conversationId).toBe('other-c'));
  });

  it('bascule de conversation si createdNewConversation', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'm1',
        conversationId: 'c-new',
        createdNewConversation: true,
      }),
    });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await result.current.sendMessage('nouveau sujet', { forceNew: true });
    await waitFor(() => expect(result.current.conversationId).toBe('c-new'));
  });

  it('réessaie avec forceNew après erreur 400', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 400 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'm1', conversationId: 'c1' }),
      });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await result.current.sendMessage('retry me');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body)).toEqual({
      content: 'retry me',
      forceNew: true,
    });
  });

  it('construit un item de liste si conversations vides mais messages chargés', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [
        { id: 'm1', senderType: 'USER', isRead: true, content: 'Bonjour', createdAt: '2026-06-01' },
      ],
      nextCursor: null,
      hasMore: false,
      status: 'ACTIVE',
    });
    localStorage.setItem('chat_active_conversation_id', 'orphan-c');

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('orphan-c'));
    await waitFor(() => expect(result.current.conversationListItems).toHaveLength(1));
    expect(result.current.conversationListItems[0]?.id).toBe('orphan-c');
  });

  it('expire awaitingStaffReply après 90 secondes', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        {
          id: 'c1',
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
          messages: [{ id: 'm0', senderType: 'BOT', isRead: false, content: 'bot', createdAt: '' }],
        },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [{ id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' }],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm2', conversationId: 'c1' }),
    });
    jest.useFakeTimers({ advanceTimers: true });
    const { result } = renderHook(() => useChat(true, false), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await act(async () => {
      await result.current.sendMessage('question');
    });
    await waitFor(() => expect(result.current.getListUnreadTotal()).toBe(0));
    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });
    await waitFor(() => expect(result.current.getListUnreadTotal()).toBe(1));
    jest.useRealTimers();
  });

  it('réinitialise awaitingStaffReply quand le staff répond', async () => {
    let convMessages: ChatMessage[] = [
      { id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' },
    ];
    jest.spyOn(chatClient, 'fetchConversationsList').mockImplementation(async () => ({
      conversations: [
        { id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: convMessages },
      ],
    }));
    jest.spyOn(chatClient, 'fetchMessagesPage').mockImplementation(async () => ({
      messages: convMessages,
      nextCursor: null,
      hasMore: false,
    }));
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'm2', conversationId: 'c1' }),
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const w = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useChat(true, false), { wrapper: w });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await act(async () => {
      await result.current.sendMessage('question');
    });
    await waitFor(() => expect(result.current.getUnreadCount()).toBe(0));

    convMessages = [
      { id: 'm1', senderType: 'USER', isRead: true, content: 'q', createdAt: '' },
      { id: 'm2', senderType: 'USER', isRead: true, content: 'q2', createdAt: '' },
      { id: 'm3', senderType: 'BOT', isRead: false, content: 'r', createdAt: '' },
    ];
    await act(async () => {
      await client.invalidateQueries({ queryKey: queryKeys.conversationMessages('c1') });
      await client.invalidateQueries({ queryKey: queryKeys.conversations });
    });
    await waitFor(() =>
      expect(result.current.currentConversation?.messages.at(-1)?.senderType).toBe('BOT'),
    );
    await waitFor(() => expect(result.current.getUnreadCount()).toBe(1));
  });

  it('calcule getListUnreadTotal hors conversation active', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [
        {
          id: 'c1',
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
          messages: [{ id: 'm1', senderType: 'BOT', isRead: false, content: 'bot', createdAt: '' }],
        },
        {
          id: 'c2',
          status: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
          messages: [{ id: 'm2', senderType: 'MODERATOR', isRead: false, content: 'mod', createdAt: '' }],
        },
      ],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useChat(true, false), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    expect(result.current.getListUnreadTotal()).toBe(2);
  });

  it('utilise les paramètres par défaut (fermé, hors conversation)', () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({ conversations: [] });
    const { result } = renderHook(() => useChat(), { wrapper });
    expect(result.current.conversations).toEqual([]);
    expect(chatClient.fetchConversationsList).not.toHaveBeenCalled();
  });

  it('charge les pages de messages plus anciennes', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage')
      .mockResolvedValueOnce({
        messages: [{ id: 'm2', senderType: 'BOT', isRead: true, content: 'recent', createdAt: '' }],
        nextCursor: 'cursor-1',
        hasMore: true,
      })
      .mockResolvedValueOnce({
        messages: [{ id: 'm1', senderType: 'USER', isRead: true, content: 'old', createdAt: '' }],
        nextCursor: null,
        hasMore: false,
      });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await result.current.loadOlderMessages();
    await waitFor(() => expect(chatClient.fetchMessagesPage).toHaveBeenCalledTimes(2));
  });

  it('sendMessage propage l’erreur API', async () => {
    jest.spyOn(chatClient, 'fetchConversationsList').mockResolvedValue({
      conversations: [{ id: 'c1', status: 'ACTIVE', createdAt: '', updatedAt: '', messages: [] }],
    });
    jest.spyOn(chatClient, 'fetchMessagesPage').mockResolvedValue({
      messages: [],
      nextCursor: null,
      hasMore: false,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useChat(true), { wrapper });
    await waitFor(() => expect(result.current.conversationId).toBe('c1'));
    await expect(result.current.sendMessage('fail')).rejects.toThrow('send err');
  });
});
