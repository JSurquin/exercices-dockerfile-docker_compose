import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';
import { CreateConversationRequest, ConversationFilters } from '@/lib/types/chat';
import { ConversationStatus, SenderType } from '@prisma/client';

// GET /api/chat/conversations - Récupérer les conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: ConversationFilters = {
      status: searchParams.get('status') as ConversationStatus || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') as any || undefined,
      userId: searchParams.get('userId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Vérifier les permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isModerator = session.user.role === 'MODERATOR';
    const isUser = session.user.role === 'USER' || session.user.role === 'AFFILIATE';

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
    if (filters.userId && (isAdmin || isModerator)) {
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
    const body: CreateConversationRequest = await request.json();

    // Validation
    if (!body.initialMessage?.trim()) {
      return NextResponse.json({ error: 'Message initial requis' }, { status: 400 });
    }

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

    // Réponse automatique du bot — on stocke une clé i18n pour que
    // le client puisse la résoudre dans la langue courante de l'UI.
    // Format : __i18n:<dotted.key>__
    setTimeout(async () => {
      try {
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            userId: null,
            content: '__i18n:chatWidget.responses.thankYouMessage__',
            senderType: 'BOT',
            isRead: false,
          },
        });
      } catch (error) {
        logger.error('Erreur lors de l\'envoi de la réponse automatique:', error);
      }
    }, 1000);

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de la création de la conversation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
