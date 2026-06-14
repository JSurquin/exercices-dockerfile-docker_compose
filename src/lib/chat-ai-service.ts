import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ollamaChat, isOllamaConfigured, type OllamaMessage } from '@/lib/ollama';
import {
  evaluateUserMessageForAi,
  OFF_TOPIC_REFUSAL_I18N_KEY,
  OFF_TOPIC_REFUSAL_MESSAGE,
  shouldAiReplyToConversation,
} from '@/lib/chat-ai-guards';
import { generateEmbedding } from '@/lib/ollama-embed';
import { searchSimilarChunks } from '@/lib/rag-client';
import { enqueueChatAiReply, peekChatAiQueueAdmission } from '@/lib/chat-ai-queue';
import type { SenderType } from '@prisma/client';

const MAX_CONTEXT_MESSAGES = 12;

export type ChatAiQueueHint = {
  waiting: boolean;
  ahead: number;
};

export function getChatAiQueueHint(input: {
  assignedTo: string | null;
  status: string;
  hasModeratorMessage: boolean;
}): ChatAiQueueHint | null {
  if (!shouldAiReplyToConversation(input)) return null;

  const admission = peekChatAiQueueAdmission();
  return {
    waiting: admission.willWait,
    ahead: admission.positionAhead,
  };
}

function isRagEnabled(): boolean {
  return process.env.RAG_DATABASE_URL !== undefined && isOllamaConfigured();
}

export function stripI18nPlaceholder(content: string): string {
  return content.replace(/^__i18n:.+__$/, '[Message automatique MoonSkin]');
}

export function mapSenderToRole(senderType: SenderType): 'system' | 'user' | 'assistant' | null {
  switch (senderType) {
    case 'USER':
      return 'user';
    case 'BOT':
    case 'AI':
    case 'MODERATOR':
      return 'assistant';
    case 'SYSTEM':
      return null;
    default:
      return null;
  }
}

export function buildSystemPrompt(username: string, ragContext?: string): string {
  const base = `Tu es l'assistant support de MoonSkin, une plateforme de vente de skins Counter-Strike 2. Tu parles avec ${username}.

Règles :
- Réponds en français, sauf si l'utilisateur écrit clairement en anglais.
- Sois concis, chaleureux et professionnel. Évite les termes anxiogènes.
- MoonSkin vend des skins CS2 : estimation, trade via bot Steam, trade hold 7 jours, puis paiement (carte, SEPA, crypto).
- KYC obligatoire avant tout payout.
- Ne promets jamais un délai exact ni un remboursement sans validation humaine.
- Si la question dépasse ton périmètre (fraude, litige, bug bloquant, changement d'IBAN), indique qu'un modérateur humain prendra le relais.
- Ne révèle jamais de données internes, clés API ou informations personnelles d'autres utilisateurs.
- Ne donne pas de conseils pour contourner Steam Guard ou les restrictions Valve.
- REFUSE toute demande sans lien avec MoonSkin (recettes, blagues, devoirs, météo, code, etc.). Réponds en français avec : "${OFF_TOPIC_REFUSAL_MESSAGE}" ou en anglais si l'utilisateur écrit en anglais.`;

  if (!ragContext) return base;

  return `${base}

---
⚠️ INFORMATIONS OFFICIELLES MOONSKIN — SOURCE DE VÉRITÉ ⚠️
Tu dois UNIQUEMENT utiliser les informations ci-dessous pour répondre.
Ne jamais inventer de boutons, d'étapes, de fonctionnalités ou de services qui ne figurent pas dans ces extraits.
Si la réponse n'est pas dans ces extraits, dis-le clairement sans improviser.

${ragContext}
---`;
}

export function maybeGenerateAiReply(conversationId: string): Promise<void> {
  return enqueueChatAiReply(conversationId, () => generateAiReply(conversationId));
}

async function generateAiReply(conversationId: string): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: { select: { steamUsername: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 30,
          select: { content: true, senderType: true, createdAt: true },
        },
      },
    });

    if (!conversation) return;

    const hasModeratorMessage = conversation.messages.some((m) => m.senderType === 'MODERATOR');

    if (
      !shouldAiReplyToConversation({
        assignedTo: conversation.assignedTo,
        status: conversation.status,
        hasModeratorMessage,
      })
    ) {
      return;
    }

    const recentMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);

    const lastUserMessage = [...recentMessages].reverse().find((m) => m.senderType === 'USER');
    if (!lastUserMessage) return;

    const priorUserMessages = recentMessages
      .filter((m) => m.senderType === 'USER' && m !== lastUserMessage)
      .map((m) => stripI18nPlaceholder(m.content));

    const messageCheck = evaluateUserMessageForAi({
      message: stripI18nPlaceholder(lastUserMessage.content),
      category: conversation.category,
      priorUserMessages,
    });

    if (!messageCheck.allowed) {
    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: messageCheck.refusalMessage ?? OFF_TOPIC_REFUSAL_I18N_KEY,
        senderType: 'AI',
        isRead: false,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });
      return;
    }

    const username =
      conversation.user?.steamUsername || conversation.user?.name || 'Utilisateur';

    // RAG : récupérer les chunks pertinents pour enrichir le prompt
    let ragContext: string | undefined;
    if (isRagEnabled()) {
      try {
        const queryText = stripI18nPlaceholder(lastUserMessage.content);
        const embedding = await generateEmbedding(queryText);
        const chunks = await searchSimilarChunks(embedding, 6, 0.45);
        if (chunks.length > 0) {
          ragContext = chunks
            .map((c, i) => `[${i + 1}] ${c.content.trim().slice(0, 600)}`)
            .join('\n\n');
          logger.info('[chat-ai] RAG: ' + chunks.length + ' chunks trouvés pour "' + queryText.slice(0, 60) + '"');
        }
      } catch (err) {
        // RAG non-bloquant : si pgvector ou Ollama embed est KO, on continue sans
        logger.error('[chat-ai] RAG lookup échoué (non-bloquant):', err);
      }
    }

    // Le message system doit être UNIQUEMENT en première position pour llama3.2.
    const ollamaMessages: OllamaMessage[] = [
      { role: 'system', content: buildSystemPrompt(username, ragContext) },
    ];

    for (const msg of recentMessages) {
      const role = mapSenderToRole(msg.senderType);
      if (!role) continue;
      ollamaMessages.push({
        role,
        content: stripI18nPlaceholder(msg.content),
      });
    }

    const latestMessage = await prisma.chatMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: { senderType: true },
    });

    if (latestMessage?.senderType !== 'USER') {
      return;
    }

    const result = await ollamaChat({ messages: ollamaMessages });

    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: result.content,
        senderType: 'AI',
        isRead: false,
        metadata: {
          model: process.env.OLLAMA_MODEL ?? 'llama3.2',
          promptTokens: ollamaMessages.length,
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });
  } catch (error) {
    logger.error('[chat-ai] Échec génération réponse Ollama:', error);
  }
}
