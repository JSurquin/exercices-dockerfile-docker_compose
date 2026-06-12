import type { ChatMessage, ConversationSummary } from '@/lib/chat-client-types';

export const ACTIVE_CONVERSATION_KEY = 'chat_active_conversation_id';
export const GUEST_CONVERSATION_KEY = 'guest_conversation_id';

export function readStoredConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(ACTIVE_CONVERSATION_KEY) ??
    localStorage.getItem(GUEST_CONVERSATION_KEY)
  );
}

export function persistConversationId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    localStorage.setItem(GUEST_CONVERSATION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    localStorage.removeItem(GUEST_CONVERSATION_KEY);
  }
}

export function subscribeStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (e: StorageEvent) => {
    if (
      e.key === ACTIVE_CONVERSATION_KEY ||
      e.key === GUEST_CONVERSATION_KEY ||
      e.key === null
    ) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export async function fetchConversationsList(): Promise<{ conversations: ConversationSummary[] }> {
  const res = await fetch('/api/chat/conversations');
  if (!res.ok) return { conversations: [] };
  const data = await res.json();
  return Array.isArray(data) ? { conversations: data } : data;
}

export async function fetchMessagesPage(conversationId: string, cursor: string | null) {
  const params = new URLSearchParams({ limit: '30' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(
    `/api/chat/conversations/${conversationId}/messages?${params.toString()}`,
  );
  if (!res.ok) throw new Error('FETCH_MESSAGES_FAILED');
  return res.json() as Promise<{
    messages: ChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
}

export function flattenMessagePages(
  pages: Array<{ messages: ChatMessage[] }> | undefined,
): ChatMessage[] {
  if (!pages?.length) return [];
  return pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages);
}

export function resolveActiveConversationId(params: {
  pickedId: string | null;
  storedId: string | null;
  conversations: Array<{ id: string; status: string; lastMessageAt?: string | Date | null }>;
  selectInitial: (
    conversations: Array<{ id: string; status: string; lastMessageAt?: string | Date | null }>,
    storedId?: string | null,
  ) => string | null;
}): string | null {
  if (params.pickedId) return params.pickedId;
  return params.selectInitial(params.conversations, params.storedId);
}
