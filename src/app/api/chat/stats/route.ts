import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ChatStats, ModeratorStats } from '@/lib/types/chat';

// GET /api/chat/stats - Récupérer les statistiques du chat
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions (admin ou modérateur)
    const isAdmin = session.user.role === 'ADMIN';
    const isModerator = session.user.role === 'MODERATOR';

    if (!isAdmin && !isModerator) {
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

    let totalResponseTime = 0;
    let responseCount = 0;

    conversationsWithMessages.forEach((conv) => {
      if (conv.messages.length >= 2) {
        const userMessage = conv.messages.find(m => m.senderType === 'USER');
        const moderatorMessage = conv.messages.find(m => m.senderType === 'MODERATOR' || m.senderType === 'BOT');
        
        if (userMessage && moderatorMessage && moderatorMessage.createdAt > userMessage.createdAt) {
          const responseTime = moderatorMessage.createdAt.getTime() - userMessage.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0; // en minutes

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
    const session = await auth.api.getSession({
        headers: request.headers,
      });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions (admin seulement)
    if (session.user.role !== 'ADMIN') {
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

        // Calculer le temps de réponse moyen
        let totalResponseTime = 0;
        let responseCount = 0;

        conversationsWithResponse.forEach((conv) => {
          const userMessages = conv.messages.filter(m => m.senderType === 'USER');
          const moderatorMessages = conv.messages.filter(m => m.userId === moderator.id && m.senderType === 'MODERATOR');

          userMessages.forEach((userMsg) => {
            const nextModeratorMsg = moderatorMessages.find(
              modMsg => modMsg.createdAt > userMsg.createdAt
            );
            if (nextModeratorMsg) {
              const responseTime = nextModeratorMsg.createdAt.getTime() - userMsg.createdAt.getTime();
              totalResponseTime += responseTime;
              responseCount++;
            }
          });
        });

        const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;

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
