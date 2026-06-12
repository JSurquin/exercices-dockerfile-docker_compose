import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { safeParseJson } from '@/lib/validation/helpers';
import { botSubcategoryPostSchema } from '@/lib/validation/schemas/chat-api';
import { getBotMessageContent, isValidBotSubcategoryKey } from '@/lib/chat-bot-templates';
import { createChatMessageRecord } from '@/lib/chat-message-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth.api.getSession({ headers: request.headers });

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

    const username =
      conversation.user?.steamUsername ||
      conversation.user?.name ||
      (session?.user?.name ?? 'Utilisateur');

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
