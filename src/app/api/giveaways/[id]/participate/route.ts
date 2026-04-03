import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: giveawayId } = await Promise.resolve(params);
    const body = await request.json().catch(() => ({}));
    const raw = body.entriesToBuy ?? body.ticketsUsed ?? 1;
    const entriesToBuy = Math.floor(Number(raw));
    if (!Number.isFinite(entriesToBuy) || entriesToBuy < 1) {
      return NextResponse.json({ error: 'Nombre d’entrées invalide' }, { status: 400 });
    }

    const userId = session.user.id;

    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
    });

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway introuvable' }, { status: 404 });
    }

    if (giveaway.status !== 'ACTIVE') {
      return NextResponse.json({ error: "Ce giveaway n'est plus actif" }, { status: 400 });
    }

    if (new Date() > giveaway.endDate) {
      return NextResponse.json({ error: 'Ce giveaway est terminé' }, { status: 400 });
    }

    const costPerEntry = giveaway.ticketPrice;
    const totalCost = entriesToBuy * costPerEntry;

    if (giveaway.soldTickets + entriesToBuy > giveaway.maxTickets) {
      return NextResponse.json({ error: 'Pas assez de places disponibles' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (user.fragments < totalCost) {
      return NextResponse.json({ error: 'Pas assez de fragments' }, { status: 400 });
    }

    const existingEntry = await prisma.giveawayEntry.findUnique({
      where: {
        userId_giveawayId: { userId, giveawayId },
      },
    });

    const nextUserEntries = (existingEntry?.ticketsUsed ?? 0) + entriesToBuy;
    if (giveaway.maxEntriesPerUser != null && nextUserEntries > giveaway.maxEntriesPerUser) {
      return NextResponse.json(
        { error: `Limite d’entrées par utilisateur (${giveaway.maxEntriesPerUser})` },
        { status: 400 }
      );
    }

    const meta: Prisma.InputJsonValue = { giveawayId, entriesToBuy, costPerEntry, totalCost };

    const entry = await prisma.$transaction(async (tx) => {
      const e = existingEntry
        ? await tx.giveawayEntry.update({
            where: { userId_giveawayId: { userId, giveawayId } },
            data: { ticketsUsed: { increment: entriesToBuy } },
          })
        : await tx.giveawayEntry.create({
            data: {
              userId,
              giveawayId,
              ticketsUsed: entriesToBuy,
            },
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

      await tx.user.update({
        where: { id: userId },
        data: { fragments: { decrement: totalCost } },
      });

      await tx.giveaway.update({
        where: { id: giveawayId },
        data: { soldTickets: { increment: entriesToBuy } },
      });

      return e;
    });

    return NextResponse.json({
      entry,
      fragmentsSpent: totalCost,
      entriesAdded: entriesToBuy,
      newFragmentBalance: user.fragments - totalCost,
    });
  } catch (error) {
    console.error('Error participating in giveaway:', error);
    return NextResponse.json({ error: 'Erreur lors de la participation' }, { status: 500 });
  }
}
