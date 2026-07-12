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
  getConversationListUnreadTotal,
  getUnreadMessageCount,
  isTerminalConversationStatus,
  markStaffMessagesReadForClientViewer,
  patchConversationListPreviewAsReadForClient,
  resolveConversationUnreadForClient,
  selectInitialConversationId,
  shouldClearAwaitingStaffReply,
} from '@/lib/chat-logic';
import { formatConversationDisplayTitle } from '@/lib/chat-conversation-router';
import {
  fetchConversationsList,
  fetchMessagesPage,
  flattenMessagePages,
  appendGuestConversationId,
  persistConversationId,
  readStoredConversationId,
  resolveActiveConversationId,
  subscribeStorage,
} from '@/lib/chat-client';

export type { ChatMessage, ConversationSummary } from '@/lib/chat-client-types';

const CHAT_BACKGROUND_CONVERSATIONS_POLL_MS = 30_000;
const CHAT_BACKGROUND_MESSAGES_POLL_MS = 15_000;

/** Polling hors widget : utilisateur connecté ou invité avec un fil stocké localement. */
export function shouldBackgroundSyncChat(params: {
  isOpen: boolean;
  isGuest: boolean;
  storedConversationId: string | null;
}): boolean {
  return params.isOpen || !params.isGuest || Boolean(params.storedConversationId);
}

export function resolveChatMessagesPollIntervalMs(params: {
  isOpen: boolean;
  conversationId: string | null;
  shouldSync: boolean;
  awaitingStaffReply: boolean;
}): number | false {
  if (!params.shouldSync || !params.conversationId) return false;
  if (params.isOpen) {
    return params.awaitingStaffReply
      ? 2_000
      : CHAT_BACKGROUND_MESSAGES_POLL_MS;
  }
  return CHAT_BACKGROUND_MESSAGES_POLL_MS;
}

export function useChat(isOpen = false, isViewingConversation = false, isGuest = false) {
  const queryClient = useQueryClient();
  const { messages: t } = useLocale();
  const chatT = t.hooks.chat;

  const storedId = useSyncExternalStore(
    subscribeStorage,
    readStoredConversationId,
    () => null,
  );

  const [pickedConversationId, setPickedConversationId] = useState<string | null>(null);
  const pickedConversationIdRef = useRef<string | null>(null);
  pickedConversationIdRef.current = pickedConversationId;
  const [isComposingNewConversation, setIsComposingNewConversation] = useState(false);
  const isComposingNewConversationRef = useRef(false);
  const [awaitingStaffReply, setAwaitingStaffReply] = useState(false);
  const pendingListSyncIdRef = useRef<string | null>(null);

  const shouldSyncChat = shouldBackgroundSyncChat({
    isOpen,
    isGuest,
    storedConversationId: storedId,
  });

  const { data: conversationsData, isLoading: conversationsLoading, isFetching: conversationsFetching } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: fetchConversationsList,
    enabled: shouldSyncChat,
    staleTime: 30_000,
    refetchInterval: isOpen ? false : shouldSyncChat ? CHAT_BACKGROUND_CONVERSATIONS_POLL_MS : false,
    refetchIntervalInBackground: !isOpen && shouldSyncChat,
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
      listLoaded: conversationsData !== undefined,
      selectInitial: selectInitialConversationId,
    });
  }, [isComposingNewConversation, pickedConversationId, conversations, storedId, conversationsData]);

  const setConversationId = useCallback((id: string | null) => {
    isComposingNewConversationRef.current = false;
    setIsComposingNewConversation(false);
    setPickedConversationId(id);
    if (id && isGuest) {
      appendGuestConversationId(id);
    } else {
      persistConversationId(id);
    }
  }, [isGuest]);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    isFetching: messagesFetching,
  } = useInfiniteQuery({
    queryKey: queryKeys.conversationMessages(conversationId),
    queryFn: ({ pageParam }) =>
      fetchMessagesPage(conversationId!, pageParam, { markRead: isViewingConversation }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!conversationId && shouldSyncChat,
    refetchInterval: resolveChatMessagesPollIntervalMs({
      isOpen,
      conversationId,
      shouldSync: shouldSyncChat,
      awaitingStaffReply,
    }),
    refetchIntervalInBackground: !isOpen && shouldSyncChat,
  });

  const allMessages = useMemo(
    () => flattenMessagePages(messagesData?.pages),
    [messagesData],
  );

  const loadedConversationStatus = useMemo(() => {
    const latestPage = messagesData?.pages?.[0];
    return latestPage?.status;
  }, [messagesData]);

  const loadedAiEnabled = useMemo(() => {
    const latestPage = messagesData?.pages?.[0];
    return latestPage?.aiEnabled;
  }, [messagesData]);

  const loadedClientRating = useMemo(() => {
    const latestPage = messagesData?.pages?.[0];
    return latestPage?.clientRating ?? null;
  }, [messagesData]);

  const loadedAssignedModerator = useMemo(() => {
    const latestPage = messagesData?.pages?.[0];
    if (latestPage?.assignedModerator) return latestPage.assignedModerator;
    const meta = conversations.find((c) => c.id === conversationId);
    return meta?.assignedModerator ?? null;
  }, [messagesData, conversations, conversationId]);

  const isClientEngagedWithChat = isViewingConversation;

  const isEngagedWithConversation = useCallback(
    (convId: string | null | undefined) =>
      Boolean(
        convId &&
          conversationId === convId &&
          isClientEngagedWithChat,
      ),
    [conversationId, isClientEngagedWithChat],
  );

  const messagesForUnreadCount = useMemo(
    () =>
      isClientEngagedWithChat
        ? markStaffMessagesReadForClientViewer(allMessages)
        : allMessages,
    [allMessages, isClientEngagedWithChat],
  );

  const resolveConversationUnread = useCallback(
    (
      convId: string,
      conversationStatus: string,
      previewMessages: Array<{ isRead: boolean; senderType: string }>,
    ) =>
      resolveConversationUnreadForClient({
        conversationStatus,
        previewMessages,
        isViewingThisConversation: isEngagedWithConversation(convId),
      }),
    [isEngagedWithConversation],
  );

  const visibleMessages = useMemo(
    () =>
      isViewingConversation
        ? markStaffMessagesReadForClientViewer(allMessages)
        : allMessages,
    [allMessages, isViewingConversation],
  );

  const wasViewingConversationRef = useRef(false);
  useEffect(() => {
    const enteredView = isViewingConversation && !wasViewingConversationRef.current;
    const leftView = !isViewingConversation && wasViewingConversationRef.current;
    wasViewingConversationRef.current = isViewingConversation;
    if (!conversationId || !isOpen) return;
    if (enteredView) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(conversationId),
      });
    }
    if (leftView) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    }
  }, [conversationId, isOpen, isViewingConversation, queryClient]);

  useEffect(() => {
    if (!conversationId || !isViewingConversation || messagesLoading || allMessages.length === 0) {
      return;
    }
    queryClient.setQueryData<{ conversations: Array<{ id: string; messages?: Array<{ isRead: boolean; senderType: string }> }> }>(
      queryKeys.conversations,
      (current) => {
        if (!current?.conversations?.length) return current;
        return {
          ...current,
          conversations: patchConversationListPreviewAsReadForClient(
            current.conversations,
            conversationId,
          ),
        };
      },
    );
  }, [
    allMessages.length,
    conversationId,
    isViewingConversation,
    messagesLoading,
    queryClient,
  ]);

  useEffect(() => {
    if (!isOpen || !shouldSyncChat) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  }, [isOpen, shouldSyncChat, queryClient]);

  useEffect(() => {
    if (!conversationId || !loadedConversationStatus) return;
    if (loadedConversationStatus !== 'DELETED') return;
    setPickedConversationId(null);
    persistConversationId(null);
    queryClient.removeQueries({
      queryKey: queryKeys.conversationMessages(conversationId),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  }, [conversationId, loadedConversationStatus, queryClient]);

  useEffect(() => {
    if (
      loadedConversationStatus &&
      isTerminalConversationStatus(loadedConversationStatus)
    ) {
      setAwaitingStaffReply(false);
    }
  }, [loadedConversationStatus, conversationId]);

  useEffect(() => {
    if (!awaitingStaffReply || allMessages.length === 0) return;
    const last = allMessages[allMessages.length - 1];
    if (shouldClearAwaitingStaffReply(last)) {
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
    if (!conversationId || !shouldSyncChat || messagesLoading) return;
    if (!messageSyncToken) return;
    if (!isViewingConversation) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
  }, [
    conversationId,
    shouldSyncChat,
    messagesLoading,
    messageSyncToken,
    isViewingConversation,
    queryClient,
  ]);

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
      skipAi?: boolean;
    }) => {
      const activeMeta = conversationId
        ? conversations.find((c) => c.id === conversationId)
        : undefined;
      const activeStatus = activeMeta?.status ?? loadedConversationStatus;
      const shouldForceNew =
        params.forceNew ||
        isComposingNewConversationRef.current ||
        Boolean(activeStatus && isTerminalConversationStatus(activeStatus));

      const explicitConversationId = isComposingNewConversationRef.current
        ? undefined
        : pickedConversationIdRef.current ?? conversationId ?? undefined;

      const postMessage = (forceNew: boolean) =>
        fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: forceNew ? undefined : explicitConversationId,
            content: params.content,
            category: params.category,
            forceNew: forceNew || undefined,
            skipAi: params.skipAi || undefined,
          }),
        });

      let res = await postMessage(shouldForceNew);
      if (!res.ok && res.status === 400 && !shouldForceNew) {
        res = await postMessage(true);
      }
      if (!res.ok) throw new Error(chatT.sendMessageError);
      const payload = await res.json();
      const reopenedFromTerminal =
        Boolean(
          shouldForceNew &&
            activeStatus &&
            isTerminalConversationStatus(activeStatus),
        );
      const reopenedWhileAwaitingPrevious =
        Boolean(shouldForceNew && activeStatus && !reopenedFromTerminal);
      return {
        ...payload,
        reopenedFromTerminal,
        reopenedWhileAwaitingPrevious,
      };
    },
    onSuccess: (data: {
      conversationId: string;
      createdNewConversation?: boolean;
      senderType?: string;
      aiQueueHint?: { waiting: boolean; ahead: number } | null;
      reopenedFromTerminal?: boolean;
      reopenedWhileAwaitingPrevious?: boolean;
    }) => {
      isComposingNewConversationRef.current = false;
      setIsComposingNewConversation(false);
      pendingListSyncIdRef.current = data.conversationId;
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

  useEffect(() => {
    if (!conversationsData || isComposingNewConversation || sendMessageMutation.isPending) return;

    const knownIds = new Set(conversations.map((conversation) => conversation.id));
    if (pendingListSyncIdRef.current && knownIds.has(pendingListSyncIdRef.current)) {
      pendingListSyncIdRef.current = null;
    }

    if (!conversationId) return;
    if (knownIds.has(conversationId)) return;
    if (conversationId === pendingListSyncIdRef.current) return;
    if (conversationsLoading || conversationsFetching) return;

    if (conversations.length === 0) {
      pendingListSyncIdRef.current = null;
      setPickedConversationId(null);
      persistConversationId(null);
      queryClient.removeQueries({
        queryKey: queryKeys.conversationMessages(conversationId),
      });
      return;
    }

    const cachedMessages = queryClient.getQueryData<{
      pages?: Array<{ messages: unknown[] }>;
    }>(queryKeys.conversationMessages(conversationId));
    const hasCachedMessages = Boolean(
      cachedMessages?.pages?.some((page) => page.messages.length > 0),
    );
    if (hasCachedMessages || messagesLoading || allMessages.length > 0) return;

    setPickedConversationId(null);
    persistConversationId(null);
    queryClient.removeQueries({
      queryKey: queryKeys.conversationMessages(conversationId),
    });
  }, [
    conversationsData,
    conversations,
    conversationId,
    isComposingNewConversation,
    queryClient,
    sendMessageMutation.isPending,
    conversationsLoading,
    conversationsFetching,
    messagesLoading,
    allMessages.length,
  ]);

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
      unread: resolveConversationUnread(conv.id, conv.status, conv.messages ?? []),
    }));

    if (
      items.length === 0 &&
      conversationId &&
      !isComposingNewConversation &&
      (conversationsLoading || conversationsFetching || sendMessageMutation.isPending) &&
      (allMessages.length > 0 || !messagesLoading)
    ) {
      return [
        {
          id: conversationId,
          title: formatConversationDisplayTitle({
            subject: null,
            summary: null,
            messages: allMessages,
          }),
          lastMessageAt:
            allMessages[allMessages.length - 1]?.createdAt ??
            new Date().toISOString(),
          status: loadedConversationStatus ?? 'ACTIVE',
          unread: resolveConversationUnread(
            conversationId,
            loadedConversationStatus ?? 'ACTIVE',
            allMessages,
          ),
        },
      ];
    }

    return items;
  }, [
    conversations,
    conversationId,
    resolveConversationUnread,
    isComposingNewConversation,
    allMessages,
    messagesLoading,
    loadedConversationStatus,
    conversationsLoading,
    conversationsFetching,
    sendMessageMutation.isPending,
  ]);

  const currentConversation = useMemo(() => {
    if (!conversationId) return null;
    const meta = conversations.find((c) => c.id === conversationId);
    return {
      id: conversationId,
      status: meta?.status ?? loadedConversationStatus ?? 'ACTIVE',
      aiEnabled: loadedAiEnabled ?? true,
      clientRating: meta?.clientRating ?? loadedClientRating ?? null,
      assignedModerator: loadedAssignedModerator,
      subject: meta?.subject,
      summary: meta?.summary,
      messages: visibleMessages,
      createdAt: meta?.createdAt ?? new Date().toISOString(),
      updatedAt: meta?.updatedAt ?? new Date().toISOString(),
      lastMessageAt: meta?.lastMessageAt,
    };
  }, [
    conversationId,
    conversations,
    visibleMessages,
    loadedConversationStatus,
    loadedAiEnabled,
    loadedClientRating,
    loadedAssignedModerator,
  ]);

  return {
    conversations,
    conversationListItems,
    currentConversation,
    conversationId,
    setConversationId,
    startNewConversation,
    sendMessage: (content: string, options?: { category?: string; forceNew?: boolean; skipAi?: boolean }) =>
      sendMessageMutation.mutateAsync({ content, ...options }),
    loadOlderMessages: fetchNextPage,
    hasOlderMessages: hasNextPage,
    isLoadingOlderMessages: isFetchingNextPage,
    getUnreadCount: () => getUnreadMessageCount(messagesForUnreadCount),
    getListUnreadTotal: () =>
      getConversationListUnreadTotal(
        conversationListItems,
        conversationId,
        isClientEngagedWithChat,
      ),
    isLoading:
      conversationsLoading ||
      messagesLoading ||
      sendMessageMutation.isPending,
    isSending: sendMessageMutation.isPending,
    isRefreshingMessages: messagesFetching && !messagesLoading,
  };
}
