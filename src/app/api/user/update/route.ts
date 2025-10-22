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
    
    // Validation du trade link si fourni
    if (updates.tradeLink) {
      const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
      if (!steamTradeUrlRegex.test(updates.tradeLink)) {
        return NextResponse.json(
          { error: 'Format de Trade Link Steam invalide' },
          { status: 400 }
        );
      }
    }
    
    // Validation du Steam ID si fourni
    if (updates.steamId64) {
      const steamId64Regex = /^7656119[0-9]{10}$/;
      if (!steamId64Regex.test(updates.steamId64)) {
        return NextResponse.json(
          { error: 'Format de Steam ID64 invalide' },
          { status: 400 }
        );
      }
    }
    
    // Filtrer les champs autorisés à être mis à jour
    const allowedFields = [
      'name', 'level', 'xp', 'tickets', 'totalVolume', 
      'kycStatus', 'acceptedTermsAt', 'tradeLink', 'steamId64'
    ];
    
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    // Mapper les champs pour Prisma
    const prismaUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filteredUpdates)) {
      if (key === 'steamId64') {
        prismaUpdates.steamId = value;
      } else {
        prismaUpdates[key] = value;
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: prismaUpdates,
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
      tradeLink: updatedUser.tradeLink,
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
