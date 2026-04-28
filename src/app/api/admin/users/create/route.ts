import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { emailService } from '@/lib/email';
import { AuditLogger, AuditAction } from '@/lib/security/audit-logger';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminUserCreateSchema } from '@/lib/validation/schemas/admin-bodies';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier que l'utilisateur est admin
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Récupérer les données de la requête
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminUserCreateSchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { email, name, role = 'USER', sendEmail = true } = parsed.data;

    // 3. Valider les données
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validation du rôle
    const validRoles = ['USER', 'ADMIN', 'MODERATOR', 'AFFILIATE'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // 4. Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // 5. Créer le compte utilisateur (sans mot de passe, il sera défini via le lien email)
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: role || 'USER',
        emailVerified: false,
        isFirstLogin: true,
      },
    });

    // 6. Utiliser Better Auth pour générer un token de réinitialisation et envoyer l'email
    let emailSent = false;
    if (sendEmail) {
      try {
        // Appeler l'API forget-password de Better Auth pour générer un token valide
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/forget-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/password/reset-password`,
          }),
        });

        if (response.ok) {
          emailSent = true;
          console.log('Password reset email sent via Better Auth');
        } else {
          console.error('Failed to send password reset via Better Auth:', await response.text());
        }
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // On continue même si l'email échoue
      }
    }

    // 8. Logger dans AuditLog
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';

    await AuditLogger.log({
      userId: session.user.id,
      ipAddress,
      action: AuditAction.USER_CREATED_BY_ADMIN,
      details: {
        createdUserId: newUser.id,
        createdUserEmail: email,
        createdUserRole: role || 'USER',
        emailSent,
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
      severity: 'high',
    });

    // 9. Retourner la réponse
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        emailSent,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
