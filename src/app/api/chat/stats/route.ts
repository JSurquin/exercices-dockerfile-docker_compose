import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ChatStats, ModeratorStats } from '@/lib/types/chat';
import { requireAdminOrModeratorSessionWithDbCheck, requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { computeAverageResponseTimeMinutes } from '@/lib/chat-logic';

// GET /api/chat/stats - Récupérer les statistiques du chat
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Période en jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Statistiques générales
    const [
      totalConversations,
      activeConversations,
      closedConversations,
      unassignedConversations,
      conversationsByPriority,
      conversationsByCategory,
    ] = await Promise.all([
      // Total des conversations
      prisma.conversation.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Conversations actives
      prisma.conversation.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: startDate },
        },
      }),
      // Conversations fermées
      prisma.conversation.count({
        where: {
          status: 'CLOSED',
          createdAt: { gte: startDate },
        },
      }),
      // Conversations non assignées
      prisma.conversation.count({
        where: {
          assignedTo: null,
          status: 'ACTIVE',
          createdAt: { gte: startDate },
        },
      }),
      // Conversations par priorité
      prisma.conversation.groupBy({
        by: ['priority'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Conversations par catégorie
      prisma.conversation.groupBy({
        by: ['category'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
          category: { not: null },
        },
      }),
    ]);

    // Calculer le temps de réponse moyen
    const conversationsWithMessages = await prisma.conversation.findMany({
      where: {
        createdAt: { gte: startDate },
        messages: {
          some: {
            senderType: { in: ['MODERATOR', 'BOT'] },
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 2, // Premier message utilisateur + première réponse
        },
      },
    });

    const averageResponseTime = computeAverageResponseTimeMinutes(conversationsWithMessages);

    // Formater les données
    const priorityStats = conversationsByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as any);

    const categoryStats = conversationsByCategory.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = item._count;
      }
      return acc;
    }, {} as any);

    const stats: ChatStats = {
      totalConversations,
      activeConversations,
      closedConversations,
      unassignedConversations,
      averageResponseTime,
      conversationsByPriority: {
        LOW: priorityStats.LOW || 0,
        NORMAL: priorityStats.NORMAL || 0,
        HIGH: priorityStats.HIGH || 0,
        URGENT: priorityStats.URGENT || 0,
      },
      conversationsByCategory: categoryStats,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/chat/stats/moderators - Statistiques des modérateurs
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Période en jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Récupérer tous les modérateurs
    const moderators = await prisma.user.findMany({
      where: {
        role: { in: ['MODERATOR', 'ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Statistiques pour chaque modérateur
    const moderatorStats: ModeratorStats[] = await Promise.all(
      moderators.map(async (moderator) => {
        const [
          assignedConversations,
          closedConversations,
          totalMessages,
          conversationsWithResponse,
        ] = await Promise.all([
          // Conversations assignées
          prisma.conversation.count({
            where: {
              assignedTo: moderator.id,
              createdAt: { gte: startDate },
            },
          }),
          // Conversations fermées
          prisma.conversation.count({
            where: {
              assignedTo: moderator.id,
              status: 'CLOSED',
              createdAt: { gte: startDate },
            },
          }),
          // Messages envoyés
          prisma.chatMessage.count({
            where: {
              userId: moderator.id,
              senderType: 'MODERATOR',
              createdAt: { gte: startDate },
            },
          }),
          // Conversations avec réponse pour calculer le temps moyen
          prisma.conversation.findMany({
            where: {
              assignedTo: moderator.id,
              createdAt: { gte: startDate },
              messages: {
                some: {
                  userId: moderator.id,
                  senderType: 'MODERATOR',
                },
              },
            },
            include: {
              messages: {
                where: {
                  createdAt: { gte: startDate },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          }),
        ]);

        const averageResponseTime = computeAverageResponseTimeMinutes(conversationsWithResponse, {
          moderatorId: moderator.id,
        });

        return {
          id: moderator.id,
          name: moderator.name,
          email: moderator.email,
          assignedConversations,
          closedConversations,
          averageResponseTime,
          totalMessages,
        };
      })
    );

    return NextResponse.json(moderatorStats);
  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques des modérateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
