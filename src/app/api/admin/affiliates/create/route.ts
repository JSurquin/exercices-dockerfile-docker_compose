import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { emailService } from '@/lib/email';
import { AffiliateService } from '@/lib/affiliate-service';
import { AuditLogger, AuditAction } from '@/lib/security/audit-logger';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { getPlatformConfig } from '@/lib/platform-config-service';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminAffiliateCreateBodySchema } from '@/lib/validation/schemas/admin-bodies';

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
    const parsed = safeParseJson(raw, adminAffiliateCreateBodySchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const platformConfig = await getPlatformConfig();
    const { 
      email, 
      name, 
      code, 
      commissionRate = platformConfig.affiliateCommissionRate,
      sendEmail = true 
    } = parsed.data;

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

    // Validation du taux de commission
    const commissionRateDecimal = commissionRate / 100;
    if (commissionRateDecimal < 0 || commissionRateDecimal > 1) {
      return NextResponse.json(
        { success: false, error: 'Commission rate must be between 0 and 100%' },
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

    // 5. Vérifier l'unicité du code d'affiliation si fourni
    if (code) {
      const existingAffiliate = await prisma.affiliateStats.findUnique({
        where: { code },
      });

      if (existingAffiliate) {
        return NextResponse.json(
          { success: false, error: 'Affiliate code already exists' },
          { status: 409 }
        );
      }
    }

    // 6. Créer l'utilisateur (sans mot de passe, il sera défini via le lien email)
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: 'AFFILIATE',
        emailVerified: false,
        isFirstLogin: true,
      },
    });

    // 7. Créer l'AffiliateStats avec le code personnalisé ou auto-généré
    let affiliateCode: string;
    
    if (code) {
      // Utiliser le code fourni
      affiliateCode = code;
      await prisma.affiliateStats.create({
        data: {
          userId: newUser.id,
          code: affiliateCode,
          commissionRate: commissionRateDecimal,
          isActive: true,
        },
      });
    } else {
      // Générer un code automatiquement via le service
      const affiliateStats = await AffiliateService.createAffiliateAccount(
        newUser.id,
        commissionRateDecimal
      );
      affiliateCode = affiliateStats.code;
    }

    // 8. Utiliser Better Auth pour générer un token de réinitialisation et envoyer l'email
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
          console.log('Password reset email sent via Better Auth for affiliate');
        } else {
          console.error('Failed to send password reset via Better Auth:', await response.text());
        }
      } catch (error) {
        console.error('Failed to send affiliate welcome email:', error);
        // On continue même si l'email échoue
      }
    }

    // 10. Logger dans AuditLog
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';

    await AuditLogger.log({
      userId: session.user.id,
      ipAddress,
      action: AuditAction.AFFILIATE_CREATED_BY_ADMIN,
      details: {
        createdUserId: newUser.id,
        createdUserEmail: email,
        affiliateCode,
        commissionRate: commissionRateDecimal,
        emailSent,
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
      severity: 'high',
    });

    // 11. Retourner la réponse
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
        affiliate: {
          code: affiliateCode,
          commissionRate: commissionRateDecimal,
        },
        emailSent,
      },
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
