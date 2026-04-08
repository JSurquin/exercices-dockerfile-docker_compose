'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys';

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'USER' | 'BOT' | 'MODERATOR' | 'SYSTEM';
  createdAt: string;
  userId?: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  userId?: string;
  status: string;
  subject?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const GUEST_CONVERSATION_KEY = 'guest_conversation_id';

export function useChat() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Charger la liste des conversations de l'utilisateur (connecté ou invité)
  const { data: conversationsData } = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return { conversations: [] };
      const data = await res.json();
      return Array.isArray(data) ? { conversations: data } : data;
    },
    staleTime: 10_000,
  });

  const conversations: Conversation[] = useMemo(
    () => conversationsData?.conversations ?? [],
    [conversationsData]
  );

  // Initialiser l'ID de conversation : depuis l'API (utilisateur connecté) ou localStorage (invité)
  useEffect(() => {
    if (initialized) return;

    if (typeof window === 'undefined') return;

    // Si l'utilisateur a des conversations côté serveur, prendre la plus récente active
    if (conversations.length > 0) {
      const active = conversations.find((c) => c.status === 'ACTIVE') ?? conversations[0];
      if (active) {
        setConversationId(active.id);
        localStorage.setItem(GUEST_CONVERSATION_KEY, active.id);
        setInitialized(true);
        return;
      }
    }

    // Sinon fallback localStorage (invité)
    const savedId = localStorage.getItem(GUEST_CONVERSATION_KEY);
    if (savedId) {
      setConversationId(savedId);
    }

    setInitialized(true);
  }, [conversations, initialized]);

  // Charger la conversation courante avec polling
  const { data: currentConversation } = useQuery<Conversation>({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: async () => {
      if (!conversationId) throw new Error('No conversation ID');
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!conversationId,
    refetchInterval: conversationId ? 5000 : false,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (initialMessage: string) => {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Support',
          category: 'SUPPORT',
          initialMessage,
        }),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return res.json();
    },
    onSuccess: (data) => {
      const newConvId = data.id;
      setConversationId(newConvId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_CONVERSATION_KEY, newConvId);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(newConvId) });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) {
        return createConversationMutation.mutateAsync(content);
      }
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  const getUnreadCount = () => {
    if (!currentConversation) return 0;
    return currentConversation.messages.filter(
      (m) => !m.isRead && m.senderType !== 'USER'
    ).length;
  };

  return {
    conversations,
    currentConversation,
    conversationId,
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    getUnreadCount,
    isLoading: createConversationMutation.isPending || sendMessageMutation.isPending,
  };
}
