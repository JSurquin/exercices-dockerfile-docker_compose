import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '~/prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Filtrer les champs autorisés à être mis à jour
    const allowedFields = [
      'name', 'level', 'xp', 'tickets', 'totalVolume', 
      'kycStatus', 'acceptedTermsAt'
    ];
    
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: filteredUpdates,
    });

    // Convertir vers le format attendu par le frontend
    const responseUser = {
      id: updatedUser.id,
      steamId64: updatedUser.steamId || '',
      username: updatedUser.name || updatedUser.steamUsername || 'User',
      avatar: updatedUser.image || updatedUser.steamAvatar || '',
      level: updatedUser.level,
      xp: updatedUser.xp,
      tickets: updatedUser.tickets,
      totalVolume: updatedUser.totalVolumeCents,
      kycStatus: updatedUser.kycStatus,
      acceptedTermsAt: updatedUser.acceptedTermsAt,
      joinedAt: updatedUser.createdAt,
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
