export interface ChatMessage {
  id: string;
  content: string;
  senderType: 'USER' | 'BOT' | 'AI' | 'MODERATOR' | 'SYSTEM';
  createdAt: string;
  userId?: string | null;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    steamUsername: string | null;
    steamAvatar: string | null;
    role?: string | null;
  } | null;
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
  assignedModerator?: {
    id: string;
    name: string | null;
    email: string;
    steamUsername?: string | null;
    steamAvatar?: string | null;
  } | null;
  clientRating?: number | null;
  clientRatedAt?: string | null;
  messages?: ChatMessage[];
  _count?: { messages: number };
}
