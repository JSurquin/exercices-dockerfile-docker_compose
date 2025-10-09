import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
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
    const validatedData = changePasswordSchema.parse(body);

    // Utiliser l'API better-auth pour changer le mot de passe
    try {
      // Better-auth gère automatiquement la vérification du mot de passe actuel et le hachage
      const result = await auth.api.changePassword({
        body: {
          currentPassword: validatedData.currentPassword,
          newPassword: validatedData.newPassword,
        },
        headers: request.headers,
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Erreur lors du changement de mot de passe' },
          { status: 400 }
        );
      }

      // Log de l'action de sécurité
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_PASSWORD_CHANGE',
          details: {
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Mot de passe modifié avec succès.',
      });

    } catch (authError: any) {
      console.error('Better-auth password change error:', authError);
      
      // Gérer les erreurs spécifiques de better-auth
      if (authError.message?.includes('current password')) {
        return NextResponse.json(
          { error: 'Le mot de passe actuel est incorrect' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors du changement de mot de passe' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Admin password change error:', error);
    
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
