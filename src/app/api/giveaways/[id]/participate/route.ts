import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { safeParseJson } from '@/lib/validation/helpers';
import { giveawayParticipateBodySchema } from '@/lib/validation/schemas/integrations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: giveawayId } = await Promise.resolve(params);
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, giveawayParticipateBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const rawCount = parsed.data.entriesToBuy ?? parsed.data.ticketsUsed ?? 1;
    const entriesToBuy = Math.floor(Number(rawCount));
    if (!Number.isFinite(entriesToBuy) || entriesToBuy < 1) {
      return NextResponse.json({ error: "Nombre d'entrées invalide" }, { status: 400 });
    }

    const userId = session.user.id;

    // Lire le code affilié depuis le cookie ou le query param
    const cookieHeader = request.headers.get('cookie') ?? '';
    const affiliateCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
      ?.split('=')[1]
      ?.trim();
    const { searchParams } = new URL(request.url);
    const affiliateRef = searchParams.get('ref') ?? affiliateCookie ?? null;

    // Early-exit rapide hors transaction (non-ACTIVE ou inexistant)
    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway introuvable' }, { status: 404 });
    }
    if (giveaway.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: giveaway.status === 'PAUSED' ? 'Ce giveaway est en pause' : "Ce giveaway n'est plus actif" },
        { status: 400 }
      );
    }
    if (new Date() > giveaway.endDate) {
      return NextResponse.json({ error: 'Ce giveaway est terminé' }, { status: 400 });
    }
    
    // SÉCURITÉ: Vérifier l'accès aux giveaways privés avec code affilié requis
    if (giveaway.isPrivate && giveaway.requiredAffiliateCode) {
      if (!affiliateRef || affiliateRef !== giveaway.requiredAffiliateCode) {
        return NextResponse.json(
          { 
            error: 'Accès refusé : ce giveaway est réservé aux membres avec un code affilié spécifique',
            code: 'PRIVATE_GIVEAWAY_ACCESS_DENIED' 
          },
          { status: 403 }
        );
      }
    }

    const costPerEntry = giveaway.ticketPrice;
    const totalCost = entriesToBuy * costPerEntry;
    const meta: Prisma.InputJsonValue = { giveawayId, entriesToBuy, costPerEntry, totalCost };

    let newFragmentBalance = 0;

    // Toutes les vérifications concurrentes (places, fragments, limite) se font
    // DANS la transaction pour éliminer les race conditions.
    const entry = await prisma.$transaction(async (tx) => {
      const [liveGiveaway, liveUser, existingEntry] = await Promise.all([
        tx.giveaway.findUnique({ where: { id: giveawayId } }),
        tx.user.findUnique({ where: { id: userId } }),
        tx.giveawayEntry.findUnique({ where: { userId_giveawayId: { userId, giveawayId } } }),
      ]);

      if (!liveGiveaway || liveGiveaway.status !== 'ACTIVE') {
        throw new Error("Ce giveaway n'est plus actif");
      }
      if (new Date() > liveGiveaway.endDate) {
        throw new Error('Ce giveaway est terminé');
      }
      if (liveGiveaway.soldTickets + entriesToBuy > liveGiveaway.maxTickets) {
        throw new Error('Pas assez de places disponibles');
      }
      if (!liveUser) throw new Error('Utilisateur introuvable');
      if (liveUser.fragments < totalCost) {
        throw new Error('Pas assez de fragments');
      }

      const nextUserEntries = (existingEntry?.ticketsUsed ?? 0) + entriesToBuy;
      if (liveGiveaway.maxEntriesPerUser != null && nextUserEntries > liveGiveaway.maxEntriesPerUser) {
        throw new Error(`Limite d'entrées par utilisateur (${liveGiveaway.maxEntriesPerUser})`);
      }

      const e = existingEntry
        ? await tx.giveawayEntry.update({
            where: { userId_giveawayId: { userId, giveawayId } },
            data: { ticketsUsed: { increment: entriesToBuy } },
          })
        : await tx.giveawayEntry.create({
            data: { userId, giveawayId, ticketsUsed: entriesToBuy },
          });

      await tx.fragmentTransaction.create({
        data: {
          userId,
          type: 'SPENT_GIVEAWAY',
          amount: -totalCost,
          reason: `Entrées giveaway (${entriesToBuy} × ${costPerEntry})`,
          metadata: meta,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { fragments: { decrement: totalCost } },
      });

      await tx.giveaway.update({
        where: { id: giveawayId },
        data: { soldTickets: { increment: entriesToBuy } },
      });

      newFragmentBalance = updatedUser.fragments;
      return e;
    });

    return NextResponse.json({
      ticketsUsed: entry.ticketsUsed,
      fragmentsSpent: totalCost,
      entriesAdded: entriesToBuy,
      newFragmentBalance,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur lors de la participation';
    const knownErrors = [
      "Ce giveaway n'est plus actif",
      'Ce giveaway est terminé',
      'Pas assez de places disponibles',
      'Pas assez de fragments',
      'Utilisateur introuvable',
    ];
    const status = knownErrors.some((e) => msg.startsWith(e)) ? 400 : 500;
    if (status === 500) console.error('Error participating in giveaway:', error);
    return NextResponse.json({ error: msg }, { status });
  }
}
