'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(GUEST_CONVERSATION_KEY);
      if (savedId) {
        setConversationId(savedId);
      }
    }
  }, []);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10_000,
  });

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(newConvId),
      });
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
        body: JSON.stringify({
          conversationId,
          content,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversation(conversationId),
      });
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
    isLoading:
      createConversationMutation.isPending || sendMessageMutation.isPending,
  };
}
