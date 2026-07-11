import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ModeratorStats } from '@/lib/types/chat';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { computeAverageResponseTimeMinutes, computeAverageClientRating } from '@/lib/chat-logic';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const moderators = await prisma.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN'] } },
      select: { id: true, name: true, email: true },
    });

    const moderatorStats: ModeratorStats[] = await Promise.all(
      moderators.map(async (moderator) => {
        const [assignedConversations, closedConversations, totalMessages, conversationsWithResponse, ratedConversations] =
          await Promise.all([
            prisma.conversation.count({
              where: { assignedTo: moderator.id, createdAt: { gte: startDate } },
            }),
            prisma.conversation.count({
              where: { assignedTo: moderator.id, status: 'CLOSED', createdAt: { gte: startDate } },
            }),
            prisma.chatMessage.count({
              where: { userId: moderator.id, senderType: 'MODERATOR', createdAt: { gte: startDate } },
            }),
            prisma.conversation.findMany({
              where: {
                assignedTo: moderator.id,
                createdAt: { gte: startDate },
                messages: { some: { userId: moderator.id, senderType: 'MODERATOR' } },
              },
              include: {
                messages: {
                  where: { createdAt: { gte: startDate } },
                  orderBy: { createdAt: 'asc' },
                },
              },
            }),
            prisma.conversation.findMany({
              where: {
                assignedTo: moderator.id,
                createdAt: { gte: startDate },
                clientRating: { not: null },
              },
              select: { clientRating: true },
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
          averageClientRating: computeAverageClientRating(
            ratedConversations.map((c) => c.clientRating),
          ),
          ratedConversations: ratedConversations.length,
        };
      })
    );

    return NextResponse.json(moderatorStats);
  } catch (error) {
    logger.error('Erreur stats modérateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
