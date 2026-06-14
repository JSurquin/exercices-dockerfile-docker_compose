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
  isTerminalConversationStatus,
  markStaffMessagesReadForClientViewer,
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

export function useChat(isOpen = false, isViewingConversation = false) {
  const queryClient = useQueryClient();
  const { messages: t } = useLocale();
  const chatT = t.hooks.chat;

  const storedId = useSyncExternalStore(
    subscribeStorage,
    readStoredConversationId,
    () => null,
  );

  const [pickedConversationId, setPickedConversationId] = useState<string | null>(null);
  const [isComposingNewConversation, setIsComposingNewConversation] = useState(false);
  const isComposingNewConversationRef = useRef(false);
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

  const conversationId = useMemo(() => {
    if (isComposingNewConversation) return null;
    return resolveActiveConversationId({
      pickedId: pickedConversationId,
      storedId,
      conversations,
      selectInitial: selectInitialConversationId,
    });
  }, [isComposingNewConversation, pickedConversationId, conversations, storedId]);

  const setConversationId = useCallback((id: string | null) => {
    isComposingNewConversationRef.current = false;
    setIsComposingNewConversation(false);
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

  const visibleMessages = useMemo(
    () =>
      isViewingConversation
        ? markStaffMessagesReadForClientViewer(allMessages)
        : allMessages,
    [allMessages, isViewingConversation],
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

  const messageSyncToken = useMemo(() => {
    if (!allMessages.length) return '';
    const last = allMessages[allMessages.length - 1];
    return `${conversationId ?? ''}:${allMessages.length}:${last.id}:${last.isRead}`;
  }, [conversationId, allMessages]);

  useEffect(() => {
    if (!conversationId || !isOpen || messagesLoading) return;
    if (!messageSyncToken) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  }, [conversationId, isOpen, messagesLoading, messageSyncToken, queryClient]);

  const staffMsgCount = countClientNotifyMessages(allMessages);
  const prevStaffMsgCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !isViewingConversation &&
      shouldPlayClientNotificationSound({
        previousCount: prevStaffMsgCountRef.current,
        currentCount: staffMsgCount,
      })
    ) {
      playNotificationSound(660, 400, 0.25);
    }
    prevStaffMsgCountRef.current = staffMsgCount;
  }, [staffMsgCount, isViewingConversation]);

  const sendMessageMutation = useMutation({
    mutationFn: async (params: {
      content: string;
      category?: string;
      forceNew?: boolean;
    }) => {
      const activeMeta = conversationId
        ? conversations.find((c) => c.id === conversationId)
        : undefined;
      const shouldForceNew =
        params.forceNew ||
        isComposingNewConversationRef.current ||
        Boolean(
          activeMeta?.status && isTerminalConversationStatus(activeMeta.status),
        );

      const postMessage = (forceNew: boolean) =>
        fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: forceNew ? undefined : (conversationId ?? undefined),
            content: params.content,
            category: params.category,
            forceNew: forceNew || undefined,
          }),
        });

      let res = await postMessage(shouldForceNew);
      if (!res.ok && res.status === 400 && !shouldForceNew) {
        res = await postMessage(true);
      }
      if (!res.ok) throw new Error(chatT.sendMessageError);
      return res.json();
    },
    onSuccess: (data: { conversationId: string; createdNewConversation?: boolean; senderType?: string }) => {
      isComposingNewConversationRef.current = false;
      setIsComposingNewConversation(false);
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
    isComposingNewConversationRef.current = true;
    setIsComposingNewConversation(true);
    setPickedConversationId(null);
    persistConversationId(null);
  }, []);

  const conversationListItems = useMemo(() => {
    const items = conversations.map((conv) => ({
      id: conv.id,
      title: formatConversationDisplayTitle({
        subject: conv.subject ?? null,
        summary: conv.summary ?? null,
        messages: conv.messages,
      }),
      lastMessageAt: conv.lastMessageAt ?? conv.updatedAt,
      status: conv.status,
      unread:
        isViewingConversation && conv.id === conversationId
          ? 0
          : getUnreadMessageCount(conv.messages ?? []),
    }));

    if (
      items.length === 0 &&
      conversationId &&
      !isComposingNewConversation &&
      (allMessages.length > 0 || !messagesLoading)
    ) {
      const meta = conversations.find((c) => c.id === conversationId);
      return [
        {
          id: conversationId,
          title: formatConversationDisplayTitle({
            subject: meta?.subject ?? null,
            summary: meta?.summary ?? null,
            messages: allMessages,
          }),
          lastMessageAt:
            meta?.lastMessageAt ??
            meta?.updatedAt ??
            allMessages[allMessages.length - 1]?.createdAt ??
            new Date().toISOString(),
          status: meta?.status ?? 'ACTIVE',
          unread: isViewingConversation ? 0 : getUnreadMessageCount(allMessages),
        },
      ];
    }

    return items;
  }, [
    conversations,
    conversationId,
    isViewingConversation,
    isComposingNewConversation,
    allMessages,
    messagesLoading,
  ]);

  const currentConversation = useMemo(() => {
    if (!conversationId) return null;
    const meta = conversations.find((c) => c.id === conversationId);
    return {
      id: conversationId,
      status: meta?.status ?? 'ACTIVE',
      subject: meta?.subject,
      summary: meta?.summary,
      messages: visibleMessages,
      createdAt: meta?.createdAt ?? new Date().toISOString(),
      updatedAt: meta?.updatedAt ?? new Date().toISOString(),
      lastMessageAt: meta?.lastMessageAt,
    };
  }, [conversationId, conversations, visibleMessages]);

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
    getUnreadCount: () =>
      isViewingConversation ? 0 : getUnreadMessageCount(allMessages),
    isLoading:
      conversationsLoading ||
      messagesLoading ||
      sendMessageMutation.isPending,
    isRefreshingMessages: messagesFetching && !messagesLoading,
  };
}
