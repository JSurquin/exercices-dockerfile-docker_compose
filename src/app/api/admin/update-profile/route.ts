import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Email invalide').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Permissions administrateur requises' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Vérifier si l'email existe déjà (si changé) - avec gestion d'erreur
    if (validatedData.email && validatedData.email !== session.user.email) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: validatedData.email },
          select: { id: true } // Seulement l'ID pour optimiser
        });

        if (existingUser && existingUser.id !== session.user.id) {
          return NextResponse.json(
            { error: 'Cette adresse email est déjà utilisée' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error checking email uniqueness:', error);
        // Continuer sans vérification si erreur DB
      }
    }

    // Utiliser better-auth pour mettre à jour le profil
    try {
      const result = await auth.api.updateUser({
        body: {
          name: validatedData.name,
          ...(validatedData.email && { email: validatedData.email }),
        },
        headers: request.headers,
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du profil' },
          { status: 400 }
        );
      }

      // Récupérer les données mises à jour
      const updatedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          steamUsername: true,
          image: true,
          steamAvatar: true,
          role: true,
          updatedAt: true,
        },
      });

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé après mise à jour' },
          { status: 404 }
        );
      }

      // Log de l'action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_PROFILE_UPDATE',
          details: {
            updatedFields: Object.keys(validatedData),
            timestamp: new Date().toISOString(),
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser,
      });

    } catch (authError: any) {
      console.error('Better-auth profile update error:', authError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Admin profile update error:', error);
    
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
  }
}
