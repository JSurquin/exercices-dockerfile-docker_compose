import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { 
  getRequestContext, 
  logUnauthorizedAccess, 
  logUserAction,
  logValidationFailure,
  logSensitiveDataChange,
  logSystemError
} from '@/lib/security/audit-helpers';
import { AuditAction } from '@/lib/security';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      await logUnauthorizedAccess(context, '/api/user/update', 'No valid session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    context.userId = session.user.id;

    const updates = await request.json();
    
    // Validation du trade link si fourni
    if (updates.tradeLink) {
      const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
      if (!steamTradeUrlRegex.test(updates.tradeLink)) {
        await logValidationFailure(
          context,
          'tradeLink',
          updates.tradeLink,
          'Invalid Steam trade URL format'
        );
        return NextResponse.json(
          { error: 'Format de Trade Link Steam invalide' },
          { status: 400 }
        );
      }
    }
    
    // Validation du Steam ID si fourni
    if (updates.steamId64 || updates.steamId) {
      const steamIdValue = updates.steamId64 || updates.steamId;
      const steamId64Regex = /^7656119[0-9]{10}$/;
      if (!steamId64Regex.test(steamIdValue)) {
        return NextResponse.json(
          { error: 'Format de Steam ID64 invalide' },
          { status: 400 }
        );
      }
      
      // Vérifier si le Steam ID est déjà utilisé par un autre utilisateur
      const existingUser = await prisma.user.findUnique({
        where: { steamId: steamIdValue },
        select: { id: true }
      });
      
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Ce Steam ID est déjà utilisé par un autre compte' },
          { status: 409 }
        );
      }
    }
    
    // Filtrer les champs autorisés à être mis à jour
    const allowedFields = [
      'name', 'level', 'xp', 'tickets', 'totalVolume', 
      'kycStatus', 'acceptedTermsAt', 'tradeLink', 'steamId64', 'steamId'
    ];
    
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Normaliser steamId64 vers steamId pour Prisma
        if (key === 'steamId64') {
          filteredUpdates['steamId'] = value;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    // Récupérer l'utilisateur actuel pour comparer les changements
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Log des changements de données sensibles
    if (currentUser && updates.tradeLink && currentUser.tradeLink !== updates.tradeLink) {
      await logSensitiveDataChange(
        context,
        'tradeLink',
        currentUser.tradeLink,
        updates.tradeLink,
        AuditAction.PAYMENT_METHOD_UPDATED
      );
    }

    // Mettre à jour l'utilisateur
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: filteredUpdates,
      });
    } catch (error: any) {
      // Gérer l'erreur de contrainte unique si elle arrive quand même
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'champ';
        return NextResponse.json(
          { error: `Ce ${field} est déjà utilisé par un autre compte` },
          { status: 409 }
        );
      }
      throw error;
    }

    // Log de la mise à jour du profil
    await logUserAction(
      context,
      AuditAction.PAYMENT_METHOD_UPDATED,
      {
        type: 'profile_updated',
        updatedFields: Object.keys(filteredUpdates),
        timestamp: new Date().toISOString(),
      },
      'low'
    );

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
    
    // Log de l'erreur système
    await logSystemError(context, error, 'user_update');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
