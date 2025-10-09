import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
              }
            }
          },
          orderBy: {
            enteredAt: 'asc'
          }
        }
      }
    });

    if (!giveaway) {
      return NextResponse.json(
        { error: 'Giveaway introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(giveaway);
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
              }
            }
          }
        }
      }
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.giveaway.delete({
      where: { id }
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