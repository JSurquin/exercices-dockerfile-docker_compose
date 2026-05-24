import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { executeGiveawayDraw } from '@/lib/execute-giveaway-draw';
import { emailService } from '@/lib/email';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { scheduleNextSpawnAfterDraw } from '@/lib/giveaway-recurrence';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
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
      include: {
        entries: true,
        winners: true,
      },
    });

    const results: unknown[] = [];

    for (const giveaway of expiredGiveaways) {
      try {
        if (giveaway.entries.length === 0) {
          await prisma.giveaway.update({
            where: { id: giveaway.id },
            data: { status: 'CANCELLED' },
          });
          if (giveaway.seriesId) {
            await scheduleNextSpawnAfterDraw(giveaway.seriesId, now);
          }
          results.push({
            giveawayId: giveaway.id,
            status: 'cancelled',
            reason: 'Aucun participant',
          });
          continue;
        }

        const draw = await executeGiveawayDraw(giveaway.id);
        if (!draw.ok) {
          results.push({ giveawayId: giveaway.id, status: 'error', error: draw.error });
          continue;
        }

        // Notification email aux gagnants (best-effort)
        try {
          const winnerIds = draw.winners.map((w) => w.userId);
          const winnerUsers = await prisma.user.findMany({
            where: { id: { in: winnerIds } },
            select: { id: true, email: true, contactEmail: true, steamUsername: true },
          });
          for (const winner of winnerUsers) {
            const email = winner.contactEmail ?? winner.email;
            if (!email) continue;
            await emailService.sendEmail({
              to: email,
              subject: `🎉 Tu as gagné — ${draw.giveaway.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h1 style="color: #f97316;">🎉 Félicitations !</h1>
                  <p>Bonjour <strong>${winner.steamUsername ?? 'joueur'}</strong>,</p>
                  <p>Tu as gagné le giveaway <strong>${draw.giveaway.title}</strong> !</p>
                  <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Lot :</strong> ${draw.giveaway.prize}</p>
                  </div>
                  <p>L'équipe MoonSkin te contactera prochainement pour te remettre ton gain.</p>
                  <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
                    Seed : <code>${draw.randomSeed.slice(0, 20)}…</code>
                  </p>
                  <p style="color: #6b7280; font-size: 12px;">MoonSkin — La plateforme CS2 de confiance</p>
                </div>
              `,
              text: `Félicitations ! Tu as gagné le giveaway ${draw.giveaway.title}. Lot : ${draw.giveaway.prize}. L'équipe te contactera bientôt.`,
            });
          }
        } catch (emailErr) {
          console.error(`[auto-draw] Erreur email gagnant giveaway ${giveaway.id}:`, emailErr);
        }

        if (giveaway.seriesId) {
          await scheduleNextSpawnAfterDraw(giveaway.seriesId, now);
        }

        results.push({
          giveawayId: giveaway.id,
          status: 'drawn',
          winnerIds: draw.winners.map((w) => w.userId),
          winners: draw.winners,
          totalParticipants: draw.totalParticipants,
          totalEntries: draw.totalEntries,
          randomSeed: draw.randomSeed,
        });
      } catch (error) {
        console.error(`Error drawing giveaway ${giveaway.id}:`, error);
        results.push({
          giveawayId: giveaway.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processedCount: expiredGiveaways.length,
      results,
    });
  } catch (error) {
    console.error('Error in auto-draw:', error);
    return NextResponse.json({ error: 'Erreur lors du tirage automatique' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
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
