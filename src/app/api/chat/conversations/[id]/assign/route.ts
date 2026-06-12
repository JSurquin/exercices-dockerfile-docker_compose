import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';
import { requireAdminOrModeratorSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { assignConversationPostSchema } from '@/lib/validation/schemas/chat-api';
import { isValidModeratorRole } from '@/lib/chat-logic';

// POST /api/chat/conversations/[id]/assign
export async function POST(
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
    const parsed = safeParseJson(raw, assignConversationPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Vérifier que le modérateur existe et a le bon rôle
    const moderator = await prisma.user.findUnique({
      where: { id: body.moderatorId },
    });

    if (!moderator) {
      return NextResponse.json({ error: 'Modérateur non trouvé' }, { status: 404 });
    }

    if (!isValidModeratorRole(moderator.role)) {
      return NextResponse.json({ error: 'L\'utilisateur n\'est pas un modérateur' }, { status: 400 });
    }

    // Assigner la conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: resolvedParams.id },
      data: {
        assignedTo: body.moderatorId,
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
      },
    });

    // Créer un message système pour notifier l'assignation
    await prisma.chatMessage.create({
      data: {
        conversationId: resolvedParams.id,
        userId: null,
        content: `Conversation assignée à ${moderator.name || moderator.email}`,
        senderType: 'SYSTEM',
        isRead: false,
      },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_ASSIGNED', {
      conversationId: resolvedParams.id,
      assignedTo: body.moderatorId,
      assignedBy: session.user.id,
      previousAssignedTo: conversation.assignedTo,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    logger.error('Erreur lors de l\'assignation de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/chat/conversations/[id]/assign - Désassigner une conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    // Désassigner la conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: resolvedParams.id },
      data: {
        assignedTo: null,
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
      },
    });

    // Créer un message système pour notifier la désassignation
    await prisma.chatMessage.create({
      data: {
        conversationId: resolvedParams.id,
        userId: null,
        content: 'Conversation désassignée',
        senderType: 'SYSTEM',
        isRead: false,
      },
    });

    // Log de l'audit
    await logger.info(session.user.id, 'CONVERSATION_UNASSIGNED', {
      conversationId: resolvedParams.id,
      previousAssignedTo: conversation.assignedTo,
      unassignedBy: session.user.id,
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    logger.error('Erreur lors de la désassignation de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
