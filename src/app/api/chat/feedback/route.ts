import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { requireAdminOrModeratorSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseSearchParams } from '@/lib/validation/helpers';
import { chatFeedbackQuerySchema } from '@/lib/validation/schemas/chat-api';
import { computeAverageClientRating } from '@/lib/chat-logic';
import type { ClientFeedbackEntry, ClientFeedbackSummary } from '@/lib/types/chat';

const feedbackInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      steamUsername: true,
    },
  },
  assignedModerator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const parsedQ = safeParseSearchParams(new URL(request.url).searchParams, chatFeedbackQuerySchema);
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const q = parsedQ.data;

    const isAdmin = session.user.role === 'ADMIN';
    const onlyMine = !isAdmin || q.scope === 'mine';

    const where = {
      OR: [{ clientRating: { not: null } }, { clientFeedback: { not: null } }],
      ...(onlyMine ? { assignedTo: session.user.id } : {}),
    };

    const skip = (q.page - 1) * q.limit;

    const [rows, total, summaryRows] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: feedbackInclude,
        orderBy: [{ clientRatedAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: q.limit,
      }),
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        select: {
          clientRating: true,
          clientFeedback: true,
        },
      }),
    ]);

    const feedback: ClientFeedbackEntry[] = rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      clientRating: row.clientRating,
      clientFeedback: row.clientFeedback,
      clientRatedAt: row.clientRatedAt,
      closedAt: row.closedAt,
      user: row.user,
      assignedModerator: row.assignedModerator,
    }));

    const summary: ClientFeedbackSummary = {
      averageRating: computeAverageClientRating(summaryRows.map((r) => r.clientRating)),
      ratedCount: summaryRows.filter((r) => r.clientRating != null).length,
      feedbackCount: summaryRows.filter(
        (r) => r.clientFeedback != null && r.clientFeedback.trim() !== '',
      ).length,
    };

    return NextResponse.json({
      feedback,
      summary,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        pages: Math.ceil(total / q.limit),
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des feedbacks chat:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
