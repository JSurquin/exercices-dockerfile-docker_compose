import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { enrichGiveawayForViewer } from '@/lib/giveaway-public';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);

    const giveaway = await prisma.giveaway.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
          orderBy: {
            enteredAt: 'asc',
          },
        },
        winners: {
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!giveaway) {
      return NextResponse.json({ error: 'Giveaway introuvable' }, { status: 404 });
    }

    // Vérifier l'accès aux giveaways privés
    if (giveaway.isPrivate && giveaway.requiredAffiliateCode) {
      const cookieHeader = request.headers.get('cookie') ?? '';
      const affiliateCookie = cookieHeader
        .split(';')
        .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
        ?.split('=')[1]
        ?.trim();
      const refParam = new URL(request.url).searchParams.get('ref');
      const affiliateRef = refParam ?? affiliateCookie ?? null;

      if (affiliateRef !== giveaway.requiredAffiliateCode) {
        return NextResponse.json({ error: 'Accès non autorisé à ce giveaway' }, { status: 403 });
      }
    }

    const session = await auth.api.getSession({ headers: request.headers });
    const viewerId = session?.user?.id ?? null;

    return NextResponse.json(enrichGiveawayForViewer(giveaway, viewerId));
  } catch (error) {
    console.error('Error fetching giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du giveaway' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();

    const giveaway = await prisma.giveaway.update({
      where: { id },
      data: body,
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(giveaway);
  } catch (error) {
    console.error('Error updating giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du giveaway' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);

    await prisma.giveaway.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting giveaway:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du giveaway' },
      { status: 500 }
    );
  }
}
