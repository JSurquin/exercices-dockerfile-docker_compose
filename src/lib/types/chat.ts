import { ConversationStatus, ConversationPriority, SenderType } from '@prisma/client';

export interface CreateConversationRequest {
  subject?: string;
  category?: string;
  priority?: ConversationPriority;
  initialMessage: string;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  senderType?: SenderType;
}

export interface ConversationWithMessages {
  id: string;
  userId: string | null;
  status: ConversationStatus;
  subject: string | null;
  category: string | null;
  priority: ConversationPriority;
  assignedTo: string | null;
  aiEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  summary?: string | null;
  lastMessageAt?: Date | null;
  deletedAt?: Date | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  } | null;
  assignedModerator?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  messages: ChatMessageWithUser[];
  _count?: {
    messages: number;
  };
}

export interface ChatMessageWithUser {
  id: string;
  conversationId: string;
  userId: string | null;
  content: string;
  senderType: SenderType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    steamUsername: string | null;
    steamAvatar: string | null;
  } | null;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  assignedTo?: string;
  category?: string;
  priority?: ConversationPriority;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AssignConversationRequest {
  conversationId: string;
  moderatorId: string;
}

export interface UpdateConversationStatusRequest {
  conversationId: string;
  status: ConversationStatus;
}

export interface ChatStats {
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  unassignedConversations: number;
  averageResponseTime: number;
  conversationsByPriority: {
    [key in ConversationPriority]: number;
  };
  conversationsByCategory: {
    [category: string]: number;
  };
  averageClientRating: number;
  ratedConversations: number;
}

export interface ModeratorStats {
  id: string;
  name: string | null;
  email: string;
  assignedConversations: number;
  closedConversations: number;
  averageResponseTime: number;
  totalMessages: number;
  averageClientRating: number;
  ratedConversations: number;
}

export interface ClientFeedbackEntry {
  id: string;
  subject: string | null;
  clientRating: number | null;
  clientFeedback: string | null;
  clientRatedAt: Date | null;
  closedAt: Date | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    steamUsername: string | null;
  } | null;
  assignedModerator?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface ClientFeedbackSummary {
  averageRating: number;
  ratedCount: number;
  feedbackCount: number;
}
