import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { emailService } from '@/lib/email';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseJson } from '@/lib/validation/helpers';
import { affiliateApplyPostSchema } from '@/lib/validation/schemas/affiliate';
import type { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    const raw = await request.json();
    const parsed = safeParseJson(raw, affiliateApplyPostSchema, { errorStyle: 'affiliate' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { motivation, socialLinks } = parsed.data;
    const socialLinksJson: Prisma.InputJsonValue =
      (socialLinks ?? {}) as Prisma.InputJsonValue;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        affiliateStats: true,
        affiliateApplications: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED']
            }
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    if (user.affiliateStats) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur déjà affilié' },
        { status: 409 }
      );
    }

    // Vérifier s'il y a déjà une demande en attente ou approuvée
    if (user.affiliateApplications.length > 0) {
      const existingApp = user.affiliateApplications[0];
      return NextResponse.json(
        { 
          success: false, 
          error: existingApp.status === 'PENDING' 
            ? 'Une demande est déjà en attente de validation'
            : 'Une demande a déjà été approuvée'
        },
        { status: 409 }
      );
    }
    
    // Vérifier le KYC
    if (user.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'KYC requis pour devenir affilié' },
        { status: 400 }
      );
    }
    
    // Créer la demande d'affiliation
    const application = await prisma.affiliateApplication.create({
      data: {
        userId,
        motivation,
        socialLinks: socialLinksJson,
        status: 'PENDING'
      }
    });
    
    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AFFILIATE_APPLICATION_SUBMITTED',
        details: {
          applicationId: application.id,
          motivation,
          socialLinks: socialLinksJson,
        } as Prisma.InputJsonValue,
      }
    });
    
    // Envoyer notification email à l'admin
    try {
      await emailService.sendNewAffiliateApplicationToAdmin({
        id: application.id,
        user: {
          email: user.email,
          steamUsername: user.steamUsername
        },
        motivation: application.motivation,
        createdAt: application.createdAt
      });
    } catch (emailError) {
      console.error('Erreur envoi email admin:', emailError);
      // Ne pas faire échouer la demande si l'email échoue
    }
    
    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        status: application.status,
        message: 'Votre demande a été soumise et sera examinée par notre équipe'
      }
    });
    
  } catch (error) {
    console.error('Erreur création demande affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    
    const applications = await prisma.affiliateApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      data: applications
    });
    
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}