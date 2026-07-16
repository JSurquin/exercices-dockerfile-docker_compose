/** Routage de conversation : même fil vs nouveau thread (heuristique + IA légère). */

export const CONVERSATION_INACTIVITY_MS = 24 * 60 * 60 * 1000;

const TOPIC_PREFIXES = ['trade.', 'payment.', 'delay.', 'support.'] as const;

export function deriveConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Support';
  if (cleaned.length <= 60) return cleaned;
  return `${cleaned.slice(0, 57)}...`;
}

export function extractCategoryFromSubcategoryKey(subcategoryKey: string | null | undefined): string | null {
  if (!subcategoryKey) return null;
  const prefix = TOPIC_PREFIXES.find((p) => subcategoryKey.startsWith(p));
  if (!prefix) return subcategoryKey.split('.')[0] ?? null;
  if (prefix === 'delay.') return 'payment';
  return prefix.replace('.', '');
}

export function isConversationInactive(lastMessageAt: Date | null | undefined, now = Date.now()): boolean {
  if (!lastMessageAt) return false;
  return lastMessageAt.getTime() < now - CONVERSATION_INACTIVITY_MS;
}

export function hasTopicChanged(
  currentCategory: string | null | undefined,
  newCategory: string | null | undefined,
): boolean {
  if (!currentCategory || !newCategory) return false;
  return currentCategory !== newCategory;
}

export type ConversationRoutingDecision = 'same' | 'new';

const STAFF_REPLY_SENDER_TYPES = ['MODERATOR', 'AI'] as const;

/** True when the user sent the last message and no staff reply followed yet. */
export function isConversationAwaitingStaffReply(
  messages: Array<{ senderType: string }>,
): boolean {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderType === 'USER') {
      lastUserIdx = i;
      break;
    }
  }
  if (lastUserIdx < 0) return false;

  for (let i = lastUserIdx + 1; i < messages.length; i++) {
    if (
      (STAFF_REPLY_SENDER_TYPES as readonly string[]).includes(messages[i].senderType)
    ) {
      return false;
    }
  }
  return true;
}

export function resolveConversationRouting(params: {
  lastMessageAt: Date | null | undefined;
  currentCategory: string | null | undefined;
  newCategory: string | null | undefined;
  forceNew?: boolean;
}): ConversationRoutingDecision {
  if (params.forceNew) return 'new';
  if (isConversationInactive(params.lastMessageAt)) return 'new';
  if (hasTopicChanged(params.currentCategory, params.newCategory)) return 'new';
  return 'same';
}

/** Détection légère de changement de sujet via mots-clés (fallback sans LLM). */
export function detectSubjectShift(
  priorUserMessages: string[],
  newMessage: string,
): boolean {
  if (priorUserMessages.length === 0) return false;

  const tradeRe = /\b(trade|skin|bot|steam|inventaire|api scam)\b/i;
  const paymentRe = /\b(paiement|sepa|crypto|carte|virement|iban|retrait|payout)\b/i;
  const supportRe = /\b(bug|kyc|partenariat|compte|aide|support)\b/i;

  const bucket = (text: string) => {
    if (tradeRe.test(text)) return 'trade';
    if (paymentRe.test(text)) return 'payment';
    if (supportRe.test(text)) return 'support';
    return 'general';
  };

  const priorBucket = bucket(priorUserMessages[priorUserMessages.length - 1] ?? '');
  const newBucket = bucket(newMessage);
  return priorBucket !== 'general' && newBucket !== 'general' && priorBucket !== newBucket;
}

/** Fil d'aide : sous-catégorie + réponse BOT, puis premier message utilisateur réel. */
export function isContinuingHelpSubcategoryThread(params: {
  priorUserMessages: string[];
  existingMessages?: Array<{ senderType: string }>;
}): boolean {
  if (!params.existingMessages?.length) return false;
  if (params.priorUserMessages.length !== 1) return false;
  const userCount = params.existingMessages.filter((m) => m.senderType === 'USER').length;
  if (userCount !== 1) return false;
  return params.existingMessages.some((m) => m.senderType === 'BOT');
}

export function resolveConversationRoutingWithMessage(params: {
  lastMessageAt: Date | null | undefined;
  currentCategory: string | null | undefined;
  newCategory: string | null | undefined;
  priorUserMessages: string[];
  newMessage: string;
  forceNew?: boolean;
  existingMessages?: Array<{ senderType: string }>;
}): ConversationRoutingDecision {
  if (params.forceNew) return 'new';
  if (
    params.existingMessages &&
    isConversationAwaitingStaffReply(params.existingMessages)
  ) {
    return 'same';
  }
  if (
    isContinuingHelpSubcategoryThread({
      priorUserMessages: params.priorUserMessages,
      existingMessages: params.existingMessages,
    })
  ) {
    return 'same';
  }
  const base = resolveConversationRouting(params);
  if (base === 'new') return 'new';
  if (detectSubjectShift(params.priorUserMessages, params.newMessage)) return 'new';
  return 'same';
}

export function formatConversationDisplayTitle(conversation: {
  subject: string | null;
  summary: string | null;
  messages?: Array<{ content: string }>;
}): string {
  if (conversation.summary?.trim()) return conversation.summary.trim();
  if (conversation.subject?.trim()) return conversation.subject.trim();
  const first = conversation.messages?.[0]?.content?.trim();
  if (first) return deriveConversationTitle(first);
  return 'Support';
}
