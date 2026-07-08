import { NextRequest, NextResponse } from 'next/server';
import { resolveChatIdentity } from '@/lib/require-admin';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  isTerminalConversationStatus,
} from '@/lib/chat-logic';
import { escalateConversationToModerators } from '@/lib/chat-escalation';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';

// POST /api/chat/conversations/[id]/escalate — passer la main à un modérateur humain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const identity = await resolveChatIdentity(request);

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: { name: true, steamUsername: true },
        },
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
          scope: 'widget',
        })
      ) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else if (!canGuestAccessConversation(conversation.userId)) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (isTerminalConversationStatus(conversation.status)) {
      return NextResponse.json({ error: 'Conversation fermée' }, { status: 400 });
    }

    const userDisplayName =
      identity.kind === 'user'
        ? identity.session.user.name ?? undefined
        : conversation.user?.steamUsername ?? conversation.user?.name ?? undefined;

    const result = await escalateConversationToModerators({
      conversationId: resolvedParams.id,
      reason: 'button',
      userDisplayName,
    });

    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, 'CHAT_ESCALATION_REQUESTED', {
        conversationId: resolvedParams.id,
        alreadyEscalated: result.alreadyEscalated,
      });
    }

    return NextResponse.json({
      conversationId: resolvedParams.id,
      aiEnabled: result.aiEnabled,
      alreadyEscalated: result.alreadyEscalated,
    });
  } catch (error) {
    logger.error('Erreur lors de l\'escalade vers modérateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
