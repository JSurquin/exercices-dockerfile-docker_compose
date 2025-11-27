'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
//import { useAuth } from './use-auth';

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
  // const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Charger l'ID de conversation depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(GUEST_CONVERSATION_KEY);
      if (savedId) {
        setConversationId(savedId);
      }
    }
  }, []);

  // Fetcher les conversations de l'utilisateur
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations', 1 ],
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: false,
    refetchInterval: 5000, // Poll toutes les 5 secondes
  });

  // Fetcher la conversation actuelle
  const { data: currentConversation } = useQuery<Conversation>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('No conversation ID');
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll toutes les 5 secondes
  });

  // Créer une nouvelle conversation
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
      
      // Sauvegarder dans localStorage pour les guests
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_CONVERSATION_KEY, newConvId);
      }
      
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', newConvId] });
    },
  });

  // Envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Si pas de conversation, en créer une
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
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Calculer le nombre de messages non lus
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
