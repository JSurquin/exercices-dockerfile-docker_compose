import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { rateConversationPostSchema } from '@/lib/validation/schemas/chat-api';
import {
  canClientRateConversation,
  canClientSubmitFeedback,
  canGuestAccessConversation,
  canUserAccessConversation,
  isConversationHiddenFromClientViewer,
  isStaffRole,
} from '@/lib/chat-logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const parsed = safeParseJson(raw, rateConversationPostSchema);
    if (!parsed.ok) return parsed.response;

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (
      isConversationHiddenFromClientViewer({
        status: conversation.status,
        scope: 'widget',
      })
    ) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
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
      if (isStaffRole(identity.role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else if (!canGuestAccessConversation(conversation.userId)) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const trimmedFeedback = parsed.data.feedback?.trim();
    const hasRating = parsed.data.rating != null;
    const hasFeedback = Boolean(trimmedFeedback);

    if (hasRating) {
      if (!canClientRateConversation(conversation.status, conversation.clientRating)) {
        return NextResponse.json({ error: 'Notation indisponible' }, { status: 400 });
      }
    } else if (hasFeedback) {
      if (
        !canClientSubmitFeedback(
          conversation.status,
          conversation.clientRating,
          conversation.clientFeedback,
        )
      ) {
        return NextResponse.json({ error: 'Commentaire indisponible' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const updated = await prisma.conversation.update({
      where: { id: resolvedParams.id },
      data: {
        ...(hasRating
          ? {
              clientRating: parsed.data.rating,
              clientRatedAt: new Date(),
            }
          : {}),
        ...(hasFeedback ? { clientFeedback: trimmedFeedback } : {}),
      },
      select: {
        id: true,
        clientRating: true,
        clientRatedAt: true,
        clientFeedback: true,
      },
    });

    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, hasRating ? 'CONVERSATION_RATED' : 'CONVERSATION_FEEDBACK', {
        conversationId: resolvedParams.id,
        ...(hasRating ? { rating: parsed.data.rating } : {}),
        ...(hasFeedback ? { hasFeedback: true } : {}),
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Erreur lors de la notation de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
