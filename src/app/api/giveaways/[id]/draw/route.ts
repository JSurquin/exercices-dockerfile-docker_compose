import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { executeGiveawayDraw } from '@/lib/execute-giveaway-draw';
import { prisma } from '~/prisma/prisma';
import { emailService } from '@/lib/email';
import { scheduleNextSpawnAfterDraw } from '@/lib/giveaway-recurrence';
import { requireCronSecret } from '@/lib/cron-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdminSessionWithDbCheck(request);
    const isAdmin = !!adminSession;
    
    const cronAuth = requireCronSecret(request);
    const isAuthorizedCron = cronAuth.ok;

    if (!isAdmin && !isAuthorizedCron) {
      return NextResponse.json(
        { error: 'Accès refusé — admin ou cron authentifié requis' },
        { status: 403 }
      );
    }

    const { id } = await Promise.resolve(params);
    const result = await executeGiveawayDraw(id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Notification email aux gagnants (best-effort, sans bloquer la réponse)
    try {
      const winnerIds = result.winners.map((w) => w.userId);
      const winnerUsers = await prisma.user.findMany({
        where: { id: { in: winnerIds } },
        select: { id: true, email: true, contactEmail: true, steamUsername: true },
      });

      const giveaway = result.giveaway;

      for (const winner of winnerUsers) {
        const email = winner.contactEmail ?? winner.email;
        if (!email) continue;

        await emailService.sendEmail({
          to: email,
          subject: `🎉 Tu as gagné — ${giveaway.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h1 style="color: #f97316;">🎉 Félicitations !</h1>
              <p>Bonjour <strong>${winner.steamUsername ?? 'joueur'}</strong>,</p>
              <p>Tu es l'un des gagnants du giveaway <strong>${giveaway.title}</strong> !</p>
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Lot :</strong> ${giveaway.prize}</p>
              </div>
              <p>L'équipe MoonSkin te contactera prochainement pour te remettre ton gain.</p>
              <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
                Seed de vérification : <code>${result.randomSeed.slice(0, 20)}…</code>
              </p>
              <p style="color: #6b7280; font-size: 12px;">MoonSkin — La plateforme CS2 de confiance</p>
            </div>
          `,
          text: `Félicitations ! Tu as gagné le giveaway ${giveaway.title}. Lot : ${giveaway.prize}. L'équipe te contactera bientôt.`,
        });
      }
    } catch (emailErr) {
      console.error('[draw] Erreur envoi email gagnant:', emailErr);
    }

    if (result.giveaway.seriesId) {
      await scheduleNextSpawnAfterDraw(result.giveaway.seriesId, new Date());
    }

    return NextResponse.json({
      giveaway: result.giveaway,
      winners: result.winners,
      winner: result.winners[0]?.user,
      totalParticipants: result.totalParticipants,
      totalTickets: result.totalEntries,
      totalEntries: result.totalEntries,
      randomSeed: result.randomSeed,
    });
  } catch (error) {
    console.error('Error drawing giveaway:', error);
    return NextResponse.json({ error: 'Erreur lors du tirage' }, { status: 500 });
  }
}
