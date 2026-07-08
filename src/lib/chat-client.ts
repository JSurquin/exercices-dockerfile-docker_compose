import type { ChatMessage, ConversationSummary } from '@/lib/chat-client-types';

export const ACTIVE_CONVERSATION_KEY = 'chat_active_conversation_id';
export const ACTIVE_CONVERSATION_SESSION_KEY = 'chat_active_conversation_session_id';
export const GUEST_CONVERSATION_KEY = 'guest_conversation_id';
export const GUEST_CONVERSATION_HISTORY_KEY = 'chat_guest_conversation_ids';
export const MAX_GUEST_CONVERSATION_HISTORY = 20;

export function readGuestConversationIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(GUEST_CONVERSATION_HISTORY_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
      }
    }
  } catch {
    // ignore malformed history
  }

  const legacy =
    localStorage.getItem(GUEST_CONVERSATION_KEY) ??
    localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  return legacy ? [legacy] : [];
}

export function readStoredConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem(ACTIVE_CONVERSATION_SESSION_KEY) ??
    localStorage.getItem(ACTIVE_CONVERSATION_KEY) ??
    localStorage.getItem(GUEST_CONVERSATION_KEY) ??
    readGuestConversationIds()[0] ??
    null
  );
}

export function persistConversationId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    sessionStorage.setItem(ACTIVE_CONVERSATION_SESSION_KEY, id);
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    localStorage.setItem(GUEST_CONVERSATION_KEY, id);
  } else {
    sessionStorage.removeItem(ACTIVE_CONVERSATION_SESSION_KEY);
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    localStorage.removeItem(GUEST_CONVERSATION_KEY);
  }
}

export function appendGuestConversationId(id: string) {
  if (typeof window === 'undefined' || !id) return;

  const ids = readGuestConversationIds().filter((existingId) => existingId !== id);
  ids.unshift(id);
  localStorage.setItem(
    GUEST_CONVERSATION_HISTORY_KEY,
    JSON.stringify(ids.slice(0, MAX_GUEST_CONVERSATION_HISTORY)),
  );
  persistConversationId(id);
}

export function subscribeStorage(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (e: StorageEvent) => {
    if (
      e.key === ACTIVE_CONVERSATION_KEY ||
      e.key === ACTIVE_CONVERSATION_SESSION_KEY ||
      e.key === GUEST_CONVERSATION_KEY ||
      e.key === GUEST_CONVERSATION_HISTORY_KEY ||
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
  if (res.ok) {
    const data = await res.json();
    return Array.isArray(data) ? { conversations: data } : data;
  }
  if (res.status !== 401) return { conversations: [] };

  const guestIds = readGuestConversationIds();
  if (guestIds.length === 0) return { conversations: [] };

  const guestRes = await fetch(
    `/api/chat/conversations?ids=${encodeURIComponent(guestIds.join(','))}`,
  );
  if (!guestRes.ok) return { conversations: [] };
  const data = await guestRes.json();
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
    status?: string;
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
  const selected = params.selectInitial(params.conversations, params.storedId);
  if (selected) return selected;
  // Invité : l’API liste renvoie 401, restaurer l’ID local si présent
  if (!params.conversations.length && params.storedId) {
    return params.storedId;
  }
  return null;
}
