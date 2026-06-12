'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/components/providers/locale-provider';
import { playNotificationSound } from '@/lib/play-notification-sound';
import {
  countClientNotifyMessages,
  shouldPlayClientNotificationSound,
} from '@/lib/chat-notification-logic';
import {
  getUnreadMessageCount,
  selectInitialConversationId,
} from '@/lib/chat-logic';
import { formatConversationDisplayTitle } from '@/lib/chat-conversation-router';
import {
  fetchConversationsList,
  fetchMessagesPage,
  flattenMessagePages,
  persistConversationId,
  readStoredConversationId,
  resolveActiveConversationId,
  subscribeStorage,
} from '@/lib/chat-client';

export type { ChatMessage, ConversationSummary } from '@/lib/chat-client-types';

export function useChat(isOpen = false) {
  const queryClient = useQueryClient();
  const { messages: t } = useLocale();
  const chatT = t.hooks.chat;

  const storedId = useSyncExternalStore(
    subscribeStorage,
    readStoredConversationId,
    () => null,
  );

  const [pickedConversationId, setPickedConversationId] = useState<string | null>(null);
  const [awaitingStaffReply, setAwaitingStaffReply] = useState(false);

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: fetchConversationsList,
    enabled: isOpen,
    staleTime: 30_000,
  });

  const conversations = useMemo(
    () => conversationsData?.conversations ?? [],
    [conversationsData],
  );

  const conversationId = useMemo(
    () =>
      resolveActiveConversationId({
        pickedId: pickedConversationId,
        storedId,
        conversations,
        selectInitial: selectInitialConversationId,
      }),
    [pickedConversationId, conversations, storedId],
  );

  const setConversationId = useCallback((id: string | null) => {
    setPickedConversationId(id);
    persistConversationId(id);
  }, []);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
  } = useInfiniteQuery({
    queryKey: queryKeys.conversationMessages(conversationId),
    queryFn: ({ pageParam }) => fetchMessagesPage(conversationId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!conversationId && isOpen,
    refetchInterval:
      isOpen && conversationId
        ? awaitingStaffReply
          ? 2_000
          : 15_000
        : false,
    refetchIntervalInBackground: false,
  });

  const allMessages = useMemo(
    () => flattenMessagePages(messagesData?.pages),
    [messagesData],
  );

  useEffect(() => {
    if (!awaitingStaffReply || allMessages.length === 0) return;
    const last = allMessages[allMessages.length - 1];
    if (last && last.senderType !== 'USER') {
      setAwaitingStaffReply(false);
    }
  }, [allMessages, awaitingStaffReply]);

  useEffect(() => {
    if (!awaitingStaffReply) return;
    const timeout = setTimeout(() => setAwaitingStaffReply(false), 90_000);
    return () => clearTimeout(timeout);
  }, [awaitingStaffReply]);

  const syncedReadListForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !isOpen || messagesLoading) return;
    if (allMessages.length === 0) return;
    if (syncedReadListForRef.current === conversationId) return;
    syncedReadListForRef.current = conversationId;
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  }, [conversationId, isOpen, messagesLoading, allMessages.length, queryClient]);

  const staffMsgCount = countClientNotifyMessages(allMessages);
  const prevStaffMsgCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      shouldPlayClientNotificationSound({
        previousCount: prevStaffMsgCountRef.current,
        currentCount: staffMsgCount,
      })
    ) {
      playNotificationSound(660, 400, 0.25);
    }
    prevStaffMsgCountRef.current = staffMsgCount;
  }, [staffMsgCount]);

  const sendMessageMutation = useMutation({
    mutationFn: async (params: {
      content: string;
      category?: string;
      forceNew?: boolean;
    }) => {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          content: params.content,
          category: params.category,
          forceNew: params.forceNew,
        }),
      });
      if (!res.ok) throw new Error(chatT.sendMessageError);
      return res.json();
    },
    onSuccess: (data: { conversationId: string; createdNewConversation?: boolean; senderType?: string }) => {
      if (data.createdNewConversation || data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }
      setAwaitingStaffReply(true);
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(data.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  const startNewConversation = useCallback(() => {
    setPickedConversationId(null);
    persistConversationId(null);
  }, []);

  const conversationListItems = useMemo(
    () =>
      conversations.map((conv) => ({
        id: conv.id,
        title: formatConversationDisplayTitle({
          subject: conv.subject ?? null,
          summary: conv.summary ?? null,
          messages: conv.messages,
        }),
        lastMessageAt: conv.lastMessageAt ?? conv.updatedAt,
        status: conv.status,
        unread: getUnreadMessageCount(conv.messages ?? []),
      })),
    [conversations],
  );

  const currentConversation = useMemo(() => {
    if (!conversationId) return null;
    const meta = conversations.find((c) => c.id === conversationId);
    return {
      id: conversationId,
      status: meta?.status ?? 'ACTIVE',
      subject: meta?.subject,
      summary: meta?.summary,
      messages: allMessages,
      createdAt: meta?.createdAt ?? new Date().toISOString(),
      updatedAt: meta?.updatedAt ?? new Date().toISOString(),
      lastMessageAt: meta?.lastMessageAt,
    };
  }, [conversationId, conversations, allMessages]);

  return {
    conversations,
    conversationListItems,
    currentConversation,
    conversationId,
    setConversationId,
    startNewConversation,
    sendMessage: (content: string, options?: { category?: string; forceNew?: boolean }) =>
      sendMessageMutation.mutateAsync({ content, ...options }),
    loadOlderMessages: fetchNextPage,
    hasOlderMessages: hasNextPage,
    isLoadingOlderMessages: isFetchingNextPage,
    getUnreadCount: () => getUnreadMessageCount(allMessages),
    isLoading:
      conversationsLoading ||
      messagesLoading ||
      sendMessageMutation.isPending,
    isRefreshingMessages: messagesFetching && !messagesLoading,
  };
}
