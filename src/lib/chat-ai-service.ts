import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ollamaChat, type OllamaMessage } from '@/lib/ollama';
import { shouldAiReplyToConversation } from '@/lib/chat-ai-guards';
import type { SenderType } from '@prisma/client';

const MAX_CONTEXT_MESSAGES = 12;

const SYSTEM_PROMPT = `Tu es l'assistant support de MoonSkin, une plateforme de vente de skins Counter-Strike 2.

Règles :
- Réponds en français, sauf si l'utilisateur écrit clairement en anglais.
- Sois concis, chaleureux et professionnel.
- MoonSkin vend des skins CS2 : estimation, trade via bot Steam, trade hold 7 jours, puis paiement (carte, SEPA, crypto).
- KYC obligatoire avant tout payout.
- Ne promets jamais un délai exact ni un remboursement sans validation humaine.
- Si la question dépasse ton périmètre (fraude, litige, bug bloquant, changement d'IBAN), indique qu'un modérateur humain prendra le relais.
- Ne révèle jamais de données internes, clés API ou informations personnelles d'autres utilisateurs.
- Ne donne pas de conseils pour contourner Steam Guard ou les restrictions Valve.`;

function mapSenderToRole(senderType: SenderType): OllamaMessage['role'] | null {
  switch (senderType) {
    case 'USER':
      return 'user';
    case 'BOT':
    case 'MODERATOR':
      return 'assistant';
    case 'SYSTEM':
      return null;
    default:
      return null;
  }
}

function stripI18nPlaceholder(content: string): string {
  return content.replace(/^__i18n:.+__$/, '[Message automatique MoonSkin]');
}

export async function maybeGenerateAiReply(conversationId: string): Promise<void> {
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
    const ollamaMessages: OllamaMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    for (const msg of recentMessages) {
      const role = mapSenderToRole(msg.senderType);
      if (!role) continue;
      ollamaMessages.push({
        role,
        content: stripI18nPlaceholder(msg.content),
      });
    }

    const lastUserIdx = [...ollamaMessages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const username =
      conversation.user?.steamUsername || conversation.user?.name || 'Utilisateur';

    ollamaMessages.push({
      role: 'system',
      content: `L'utilisateur s'appelle ${username}. Réponds à son dernier message.`,
    });

    const result = await ollamaChat({ messages: ollamaMessages });

    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: result.content,
        senderType: 'BOT',
        isRead: false,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  } catch (error) {
    logger.error('[chat-ai] Échec génération réponse Ollama:', error);
  }
}
