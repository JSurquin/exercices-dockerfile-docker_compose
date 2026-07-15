import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  applyReadStateToMessagesForViewer,
  markConversationMessagesAsReadForViewer,
  softDeleteConversation,
} from '@/lib/chat-message-service';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
  resolveChatIdentity,
} from '@/lib/require-admin';
import {
  redactEmailsForNonStaffViewer,
  redactEmailsInConversationForGuest,
} from '@/lib/chat-response-redact';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import { patchConversationSchema, chatAccessScopeQuerySchema } from '@/lib/validation/schemas/chat-api';
import {
  canGuestAccessConversation,
  canUserAccessConversation,
  CONVERSATION_CLOSED_I18N_KEY,
  isConversationHiddenFromClientViewer,
  isStaffRole,
  shouldRedactEmailsForViewer,
} from '@/lib/chat-logic';
import { createChatMessageRecord } from '@/lib/chat-message-service';
import {
  CHAT_ASSIGNED_MODERATOR_SELECT,
  touchStaffPresenceFromRole,
} from '@/lib/chat-staff-presence';

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
          select: CHAT_ASSIGNED_MODERATOR_SELECT,
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

    const { searchParams } = new URL(request.url);
    const parsedScope = safeParseSearchParams(searchParams, chatAccessScopeQuerySchema);
    if (!parsedScope.ok) return parsedScope.response;
    const scope = parsedScope.data.scope;

    if (
      isConversationHiddenFromClientViewer({
        status: conversation.status,
        scope,
        role: identity.kind === 'user' ? identity.role : undefined,
      })
    ) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'user') {
      const session = identity.session;
      if (scope === 'staff' && !isStaffRole(identity.role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      if (
        !canUserAccessConversation({
          role: identity.role,
          userId: session.user.id,
          conversationUserId: conversation.userId,
          assignedTo: conversation.assignedTo,
          scope,
        })
      ) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      await markConversationMessagesAsReadForViewer({
        conversationId: resolvedParams.id,
        role: identity.role,
      });
      await touchStaffPresenceFromRole(session.user.id, identity.role);
    } else if (!canGuestAccessConversation(conversation.userId)) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const raw = conversation as unknown as Record<string, unknown>;
    const redactMode = shouldRedactEmailsForViewer({
      identityKind: identity.kind,
      role: identity.kind === 'user' ? identity.role : undefined,
    });
    let payload: Record<string, unknown> = raw;
    if (redactMode === 'guest') {
      payload = redactEmailsInConversationForGuest(raw);
    } else if (redactMode === 'non-staff-user' && identity.kind === 'user') {
      payload = redactEmailsForNonStaffViewer(raw, identity.session.user.id);
    }
    if (identity.kind === 'user' && Array.isArray(payload.messages)) {
      payload = {
        ...payload,
        messages: applyReadStateToMessagesForViewer(
          payload.messages as Array<{ isRead: boolean; senderType: string }>,
          identity.role,
        ),
      };
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

    if (body.status === 'CLOSED' && conversation.status !== 'CLOSED') {
      await createChatMessageRecord({
        conversationId: resolvedParams.id,
        userId: null,
        content: CONVERSATION_CLOSED_I18N_KEY,
        senderType: 'SYSTEM',
      });
      await prisma.chatMessage.updateMany({
        where: {
          conversationId: resolvedParams.id,
          isRead: false,
          senderType: { not: 'USER' },
        },
        data: { isRead: true },
      });
    }

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

// DELETE /api/chat/conversations/[id] - Soft delete (propriétaire ou admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identity = await resolveChatIdentity(request);

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    if (identity.kind === 'user') {
      const isOwner = conversation.userId === identity.session.user.id;
      const isStaff = identity.role === 'ADMIN' || identity.role === 'MODERATOR';
      if (!isOwner && !isStaff) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await softDeleteConversation(resolvedParams.id);

    if (identity.kind === 'user') {
      await logger.info(identity.session.user.id, 'CONVERSATION_DELETED', {
        conversationId: resolvedParams.id,
        soft: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
