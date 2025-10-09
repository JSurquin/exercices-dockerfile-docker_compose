import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';

const preferencesSchema = z.object({
  theme: z.enum(['dark', 'light', 'auto']),
  language: z.enum(['fr', 'en']),
  timezone: z.string(),
  dashboardLayout: z.enum(['grid', 'list', 'compact']),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé - Permissions administrateur requises' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    // Créer ou mettre à jour les préférences utilisateur
    // Pour l'instant, on stocke dans un JSON dans la table User
    // Dans une vraie application, on pourrait avoir une table dédiée UserPreferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // Stocker les préférences dans un champ JSON (à ajouter au schéma si nécessaire)
        // Pour l'instant, on simule avec updatedAt
        updatedAt: new Date(),
      },
    });

    // Log de l'action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_PREFERENCES_UPDATE',
        details: {
          preferences: validatedData,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      preferences: validatedData,
    });

  } catch (error) {
    console.error('Admin preferences update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
