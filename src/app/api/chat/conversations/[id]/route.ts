import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
  resolveChatIdentity,
} from '@/lib/require-admin';
import {
  redactEmailsForNonStaffViewer,
  redactEmailsInConversationForGuest,
} from '@/lib/chat-response-redact';
import { safeParseJson } from '@/lib/validation/helpers';
import { patchConversationSchema } from '@/lib/validation/schemas/chat-api';

// GET /api/chat/conversations/[id] - Récupérer une conversation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identity = await resolveChatIdentity(request);

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            steamUsername: true,
            steamAvatar: true,
          },
        },
        assignedModerator: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
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
      const session = identity.session;
      const isAdmin = identity.role === 'ADMIN';
      const isModerator = identity.role === 'MODERATOR';
      const isOwner = conversation.userId === session.user.id;
      const isAssigned = conversation.assignedTo === session.user.id;

      if (!isAdmin && !isModerator && !isOwner && !isAssigned) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      // Marquer les messages comme lus
      await prisma.chatMessage.updateMany({
        where: {
          conversationId: resolvedParams.id,
          isRead: false,
          NOT: { userId: session.user.id },
        },
        data: { isRead: true },
      });
    } else {
      // Invité : accès uniquement aux conversations sans userId (guest)
      if (conversation.userId !== null) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
    }

    const isStaff =
      identity.kind === 'user' &&
      (identity.role === 'ADMIN' || identity.role === 'MODERATOR');
    const raw = conversation as unknown as Record<string, unknown>;
    let payload: Record<string, unknown> = raw;
    if (identity.kind === 'guest') {
      payload = redactEmailsInConversationForGuest(raw);
    } else if (identity.kind === 'user' && !isStaff) {
      payload = redactEmailsForNonStaffViewer(raw, identity.session.user.id);
    }
    return NextResponse.json(payload);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/chat/conversations/[id] - Mettre à jour une conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, patchConversationSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Mettre à jour la conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: resolvedParams.id },
      data: {
        status: body.status,
        closedAt: body.status === 'CLOSED' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            steamUsername: true,
            steamAvatar: true,
          },
        },
        assignedModerator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_UPDATED', {
      conversationId: resolvedParams.id,
      status: body.status,
      previousStatus: conversation.status,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/chat/conversations/[id] - Supprimer une conversation (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    await prisma.conversation.delete({
      where: { id: resolvedParams.id },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_DELETED', {
      conversationId: resolvedParams.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
