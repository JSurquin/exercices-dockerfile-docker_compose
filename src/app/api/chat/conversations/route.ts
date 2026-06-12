import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';
import { resolveChatIdentity } from '@/lib/require-admin';
import { ConversationFilters } from '@/lib/types/chat';
import { ConversationStatus, SenderType } from '@prisma/client';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  chatConversationsQuerySchema,
  createConversationPostSchema,
} from '@/lib/validation/schemas/chat-api';
import { buildConversationWhereClause } from '@/lib/chat-logic';

// GET /api/chat/conversations - Récupérer les conversations
export async function GET(request: NextRequest) {
  try {
    const identity = await resolveChatIdentity(request);
    if (identity.kind === 'guest') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const session = identity.session;
    const role = identity.role;

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, chatConversationsQuerySchema);
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const q = parsedQ.data;
    const filters: ConversationFilters = {
      status: (q.status as ConversationStatus) || undefined,
      assignedTo: q.assignedTo || undefined,
      category: q.category || undefined,
      priority: (q.priority as any) || undefined,
      userId: q.userId || undefined,
      search: q.search || undefined,
      page: q.page,
      limit: q.limit,
    };

    const whereClause = buildConversationWhereClause({
      role,
      userId: session.user.id,
      filters,
    });

    const skip = ((filters.page || 1) - 1) * (filters.limit || 20);

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
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
            orderBy: { createdAt: 'desc' },
            take: 1, // Dernier message seulement pour la liste
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: filters.limit || 20,
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      conversations,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        pages: Math.ceil(total / (filters.limit || 20)),
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/chat/conversations - Créer une nouvelle conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, createConversationPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId: session?.user?.id || null,
        subject: body.subject || null,
        category: body.category || null,
        priority: body.priority || 'NORMAL',
        status: 'ACTIVE',
        lastMessageAt: new Date(),
        messages: {
          create: {
            userId: session?.user?.id || null,
            content: body.initialMessage,
            senderType: session?.user ? 'USER' : 'USER', // Même pour les invités
            isRead: false,
          },
        },
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
        },
      },
    });

    // Log de l'audit
    if (session?.user) {
      const { logAudit } = await import('@/lib/logger');
      await logAudit(session.user.id, 'CONVERSATION_CREATED', {
        conversationId: conversation.id,
        subject: body.subject,
        category: body.category,
      });
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de la création de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
