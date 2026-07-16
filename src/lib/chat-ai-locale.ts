import type { Locale } from '@/lib/i18n';

export type ChatAiLocale = Locale;

const CHAT_AI_LOCALES: readonly ChatAiLocale[] = ['fr', 'en', 'cn'];

export function isValidChatAiLocale(value: string | undefined | null): value is ChatAiLocale {
  return CHAT_AI_LOCALES.includes(value as ChatAiLocale);
}

/** Détecte la langue probable du message quand la locale UI n'est pas disponible. */
export function detectMessageLocale(message: string): ChatAiLocale {
  const trimmed = message.trim();
  if (!trimmed) return 'fr';

  if (/[\u4e00-\u9fff]/.test(trimmed)) return 'cn';

  const englishWords =
    /\b(how|what|why|when|where|does|work|help|please|thanks|hello|hey|can|could|would|is|are|the|my|your|moon\s*skin|moonskin|sell|selling|payment|trade|skin|skins|if|get|scammed)\b/i;
  const frenchWords =
    /\b(comment|pourquoi|quand|bonjour|salut|merci|aide|marche|fonctionne|paiement|vendre|vente|skin|skins|je|tu|vous|nous|et\s+si|me\s+fais|me\s+faire)\b/i;

  const hasEnglish = englishWords.test(trimmed);
  const hasFrench = frenchWords.test(trimmed);

  if (hasEnglish && !hasFrench) return 'en';
  if (hasFrench && !hasEnglish) return 'fr';

  const hasFrenchAccents = /[àâäéèêëïîôùûüç]/i.test(trimmed);
  if (!hasFrenchAccents && /^[\x00-\x7F\s\d.,!?'"()-]+$/.test(trimmed) && trimmed.length > 3) {
    return 'en';
  }

  return 'fr';
}

export function resolveChatAiLocale(input: {
  uiLocale?: string | null;
  userMessage?: string;
}): ChatAiLocale {
  if (isValidChatAiLocale(input.uiLocale ?? undefined)) {
    return input.uiLocale as ChatAiLocale;
  }
  if (input.userMessage) {
    return detectMessageLocale(input.userMessage);
  }
  return 'fr';
}

export function chatAiLanguageRule(locale: ChatAiLocale): string {
  switch (locale) {
    case 'en':
      return 'Respond ONLY in English, even if RAG excerpts are in French.';
    case 'cn':
      return '请只用简体中文回答，即使 RAG 摘录是法语或英语。';
    default:
      return 'Réponds UNIQUEMENT en français, même si les extraits RAG sont en anglais.';
  }
}
