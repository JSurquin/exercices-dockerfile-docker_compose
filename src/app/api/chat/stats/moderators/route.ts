import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ModeratorStats } from '@/lib/types/chat';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

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
        const [assignedConversations, closedConversations, totalMessages, conversationsWithResponse] =
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
          ]);

        let totalResponseTime = 0;
        let responseCount = 0;

        conversationsWithResponse.forEach((conv) => {
          const userMessages = conv.messages.filter((m) => m.senderType === 'USER');
          const moderatorMessages = conv.messages.filter(
            (m) => m.userId === moderator.id && m.senderType === 'MODERATOR'
          );
          userMessages.forEach((userMsg) => {
            const nextModMsg = moderatorMessages.find((m) => m.createdAt > userMsg.createdAt);
            if (nextModMsg) {
              totalResponseTime += nextModMsg.createdAt.getTime() - userMsg.createdAt.getTime();
              responseCount++;
            }
          });
        });

        const averageResponseTime =
          responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;

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
    logger.error('Erreur stats modérateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
