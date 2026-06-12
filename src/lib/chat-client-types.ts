export interface ChatMessage {
  id: string;
  content: string;
  senderType: 'USER' | 'BOT' | 'AI' | 'MODERATOR' | 'SYSTEM';
  createdAt: string;
  userId?: string | null;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ConversationSummary {
  id: string;
  userId?: string | null;
  status: string;
  subject?: string | null;
  summary?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  messages?: ChatMessage[];
  _count?: { messages: number };
}
