import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { botSubcategoryPostSchema } from '@/lib/validation/schemas/chat-api';
import { getBotMessageContent, isValidBotSubcategoryKey } from '@/lib/chat-bot-templates';
import { createChatMessageRecord } from '@/lib/chat-message-service';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  isConversationWriteBlockedForIdentity,
} from '@/lib/chat-logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identity = await resolveChatIdentity(request);

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, botSubcategoryPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { id: true, name: true, steamUsername: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (identity.kind === 'user') {
      if (
        !canUserAccessConversation({
          role: identity.role,
          userId: identity.session.user.id,
          conversationUserId: conversation.userId,
          assignedTo: conversation.assignedTo,
        })
      ) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else if (!canGuestAccessConversation(conversation.userId)) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (
      isConversationWriteBlockedForIdentity(
        conversation.status,
        identity.kind,
        identity.kind === 'user' ? identity.role : undefined,
      )
    ) {
      return NextResponse.json({ error: 'Conversation fermée' }, { status: 400 });
    }

    const username =
      conversation.user?.steamUsername ||
      conversation.user?.name ||
      (identity.kind === 'user' ? identity.session.user.name : null) ||
      'Utilisateur';

    if (!isValidBotSubcategoryKey(body.subcategoryKey)) {
      return NextResponse.json({ error: 'Clé de sous-catégorie invalide' }, { status: 400 });
    }

    const content = getBotMessageContent(body.subcategoryKey, username);

    const message = await createChatMessageRecord({
      conversationId: resolvedParams.id,
      userId: null,
      content,
      senderType: 'BOT',
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du message bot:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
