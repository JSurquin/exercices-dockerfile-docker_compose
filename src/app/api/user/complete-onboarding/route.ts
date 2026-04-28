import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { safeParseJson } from '@/lib/validation/helpers';
import { emptyObjectBodySchema } from '@/lib/validation/schemas/user';

export async function POST(request: NextRequest) {
  let session: any = null;
  
  try {
    // Vérifier l'authentification
    session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    let raw: unknown = {};
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const bodyParsed = safeParseJson(raw, emptyObjectBodySchema);
    if (!bodyParsed.ok) {
      return bodyParsed.response;
    }

    // Marquer l'onboarding comme terminé
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        isFirstLogin: false
      },
      select: {
        id: true,
        isFirstLogin: true,
        email: true
      }
    });

    logger.info('Onboarding completed', {
      userId: session.user.id,
      email: updatedUser.email
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding terminé avec succès',
      user: {
        isFirstLogin: updatedUser.isFirstLogin
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la completion de l\'onboarding', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      userId: session?.user?.id
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
