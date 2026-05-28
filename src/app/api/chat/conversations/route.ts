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

    // Vérifier les permissions (rôle DB, pas seulement le cookie)
    const isAdmin = role === 'ADMIN';
    const isModerator = role === 'MODERATOR';
    const isUser = role === 'USER' || role === 'AFFILIATE';

    const whereClause: any = {};

    if (isUser && !isAdmin && !isModerator) {
      // Les utilisateurs ne peuvent voir que leurs propres conversations
      whereClause.userId = session.user.id;
    } else if (isModerator && !isAdmin) {
      // Les modérateurs peuvent voir toutes les conversations ou celles qui leur sont assignées
      if (filters.assignedTo === 'me') {
        whereClause.assignedTo = session.user.id;
      }
    }

    // Appliquer les filtres
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.assignedTo && filters.assignedTo !== 'me') {
      whereClause.assignedTo = filters.assignedTo;
    }
    if (filters.category) {
      whereClause.category = filters.category;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    // Filtre par userId : admin uniquement (évite fuite / abus côté modérateur)
    if (filters.userId && isAdmin) {
      whereClause.userId = filters.userId;
    }
    if (filters.search) {
      whereClause.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

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
        orderBy: { updatedAt: 'desc' },
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
