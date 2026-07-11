import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { runAutoDrawExpiredGiveaways } from '@/lib/cron-jobs/auto-draw-expired';
import { processDueRecurringGiveaways } from '@/lib/giveaway-recurrence';
import { prisma } from '~/prisma/prisma';

function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  return Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
}

export async function POST(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      const session = await requireAdminSessionWithDbCheck(request);
      if (!session) {
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
      }
    }

    const draw = await runAutoDrawExpiredGiveaways();
    const recurrence = await processDueRecurringGiveaways();
    return NextResponse.json({ ...draw, recurrence });
  } catch (error) {
    console.error('Error in auto-draw:', error);
    return NextResponse.json({ error: 'Erreur lors du tirage automatique' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isCronAuthorized(request)) {
      const session = await requireAdminSessionWithDbCheck(request);
      if (!session) {
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
      }
    }

    const now = new Date();

    const expiredGiveaways = await prisma.giveaway.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: now },
      },
      select: {
        id: true,
        title: true,
        endDate: true,
        soldTickets: true,
      },
    });

    return NextResponse.json({
      count: expiredGiveaways.length,
      giveaways: expiredGiveaways,
    });
  } catch (error) {
    console.error('Error checking expired giveaways:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}
