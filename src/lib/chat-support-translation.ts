import type { SenderType } from '@prisma/client';
import {
  detectMessageLocale,
  isValidChatAiLocale,
  resolveChatAiLocale,
  type ChatAiLocale,
} from '@/lib/chat-ai-locale';
import { translateText, type SupportedLanguage } from '@/lib/translation';

export type ChatMessageLocaleMetadata = {
  clientLocale?: ChatAiLocale;
  staffLocale?: ChatAiLocale;
  clientTranslation?: {
    sourceLocale: ChatAiLocale;
    targetLocale: ChatAiLocale;
    translatedText: string;
  };
};

export type LocalizedChatMessage = {
  id: string;
  content: string;
  senderType: SenderType | string;
  translationFooter?: string;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

const STAFF_INCOMING_SENDERS = new Set(['USER', 'BOT', 'AI']);
const CLIENT_INCOMING_SENDERS = new Set(['MODERATOR']);

export function isChatI18nPlaceholder(content: string): boolean {
  return /^__i18n:.+__$/.test(content.trim());
}

export function readMessageLocaleMetadata(
  metadata: unknown,
): ChatMessageLocaleMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const record = metadata as Record<string, unknown>;
  const clientLocale = record.clientLocale;
  const staffLocale = record.staffLocale;
  const clientTranslation = record.clientTranslation;

  return {
    clientLocale: isValidChatAiLocale(clientLocale as string | undefined)
      ? (clientLocale as ChatAiLocale)
      : undefined,
    staffLocale: isValidChatAiLocale(staffLocale as string | undefined)
      ? (staffLocale as ChatAiLocale)
      : undefined,
    clientTranslation:
      clientTranslation &&
      typeof clientTranslation === 'object' &&
      !Array.isArray(clientTranslation)
        ? (clientTranslation as ChatMessageLocaleMetadata['clientTranslation'])
        : undefined,
  };
}

export function resolveConversationClientLocale(
  messages: Array<{ senderType: string; content: string; metadata?: unknown }>,
  hint?: string | null,
): ChatAiLocale {
  if (isValidChatAiLocale(hint ?? undefined)) {
    return hint as ChatAiLocale;
  }

  for (const message of messages) {
    if (message.senderType !== 'USER') continue;
    const meta = readMessageLocaleMetadata(message.metadata);
    if (meta.clientLocale) return meta.clientLocale;
    return detectMessageLocale(message.content);
  }

  return 'fr';
}

export function localeDisplayName(
  locale: ChatAiLocale,
  viewerLocale: ChatAiLocale,
): string {
  const names: Record<ChatAiLocale, Record<ChatAiLocale, string>> = {
    fr: { fr: 'français', en: 'anglais', cn: 'chinois' },
    en: { fr: 'French', en: 'English', cn: 'Chinese' },
    cn: { fr: '法语', en: '英语', cn: '中文' },
  };
  return names[viewerLocale]?.[locale] ?? locale;
}

export function buildTranslationFooter(
  targetLocale: ChatAiLocale,
  viewerLocale: ChatAiLocale,
): string {
  const language = localeDisplayName(targetLocale, viewerLocale);
  switch (viewerLocale) {
    case 'en':
      return `Translated in ${language}`;
    case 'cn':
      return `已翻译为${language}`;
    default:
      return `Traduit en ${language}`;
  }
}

async function translateChatContent(
  content: string,
  sourceLocale: ChatAiLocale,
  targetLocale: ChatAiLocale,
): Promise<string | null> {
  if (sourceLocale === targetLocale || isChatI18nPlaceholder(content)) {
    return null;
  }

  const result = await translateText(
    content,
    sourceLocale as SupportedLanguage,
    targetLocale as SupportedLanguage,
  );
  if ('error' in result) return null;
  if (result.translatedText.trim() === content.trim()) return null;
  return result.translatedText;
}

export function buildOutgoingMessageLocaleMetadata(params: {
  senderType: SenderType;
  content: string;
  uiLocale?: string | null;
  clientTranslation?: ChatMessageLocaleMetadata['clientTranslation'];
}): ChatMessageLocaleMetadata | undefined {
  const resolvedLocale = resolveChatAiLocale({
    uiLocale: params.uiLocale,
    userMessage: params.content,
  });

  if (params.senderType === 'USER') {
    return { clientLocale: resolvedLocale };
  }

  if (params.senderType === 'MODERATOR') {
    const meta: ChatMessageLocaleMetadata = { staffLocale: resolvedLocale };
    if (params.clientTranslation) {
      meta.clientTranslation = params.clientTranslation;
    }
    return meta;
  }

  return undefined;
}

export async function prepareModeratorMessageMetadata(params: {
  content: string;
  uiLocale?: string | null;
  clientLocale: ChatAiLocale;
}): Promise<ChatMessageLocaleMetadata | undefined> {
  const staffLocale = resolveChatAiLocale({
    uiLocale: params.uiLocale,
    userMessage: params.content,
  });

  if (staffLocale === params.clientLocale || isChatI18nPlaceholder(params.content)) {
    return { staffLocale };
  }

  const translatedText = await translateChatContent(
    params.content,
    staffLocale,
    params.clientLocale,
  );

  if (!translatedText) {
    return { staffLocale };
  }

  return {
    staffLocale,
    clientTranslation: {
      sourceLocale: staffLocale,
      targetLocale: params.clientLocale,
      translatedText,
    },
  };
}

export async function localizeChatMessageForViewer(
  message: LocalizedChatMessage,
  options: {
    scope: 'widget' | 'staff';
    viewerLocale: ChatAiLocale;
    clientLocale: ChatAiLocale;
  },
): Promise<LocalizedChatMessage> {
  const { scope, viewerLocale, clientLocale } = options;
  const meta = readMessageLocaleMetadata(message.metadata);
  const senderType = String(message.senderType);

  if (isChatI18nPlaceholder(message.content)) {
    return message;
  }

  if (scope === 'staff') {
    if (!STAFF_INCOMING_SENDERS.has(senderType)) {
      return message;
    }

    const sourceLocale =
      senderType === 'USER'
        ? meta.clientLocale ?? detectMessageLocale(message.content)
        : clientLocale;

    const translatedText = await translateChatContent(
      message.content,
      sourceLocale,
      viewerLocale,
    );

    if (!translatedText) return message;

    return {
      ...message,
      content: translatedText,
      translationFooter: buildTranslationFooter(viewerLocale, viewerLocale),
    };
  }

  if (!CLIENT_INCOMING_SENDERS.has(senderType)) {
    return message;
  }

  const cached = meta.clientTranslation;
  if (cached?.targetLocale === clientLocale && cached.translatedText) {
    return {
      ...message,
      content: cached.translatedText,
      translationFooter: buildTranslationFooter(clientLocale, clientLocale),
    };
  }

  const sourceLocale =
    meta.staffLocale ??
    cached?.sourceLocale ??
    detectMessageLocale(message.content);

  const translatedText = await translateChatContent(
    message.content,
    sourceLocale,
    clientLocale,
  );

  if (!translatedText) return message;

  return {
    ...message,
    content: translatedText,
    translationFooter: buildTranslationFooter(clientLocale, clientLocale),
  };
}

export async function localizeChatMessagesForViewer(
  messages: LocalizedChatMessage[],
  options: {
    scope: 'widget' | 'staff';
    viewerLocale?: ChatAiLocale | null;
    clientLocale?: ChatAiLocale | null;
  },
): Promise<LocalizedChatMessage[]> {
  const clientLocale =
    options.clientLocale ??
    resolveConversationClientLocale(
      messages.map((m) => ({
        senderType: String(m.senderType),
        content: m.content,
        metadata: m.metadata,
      })),
    );

  const viewerLocale =
    options.viewerLocale ??
    (options.scope === 'staff' ? 'en' : clientLocale);

  return Promise.all(
    messages.map((message) =>
      localizeChatMessageForViewer(message, {
        scope: options.scope,
        viewerLocale,
        clientLocale,
      }),
    ),
  );
}
