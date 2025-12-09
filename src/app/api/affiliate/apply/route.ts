import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../prisma/prisma';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { userId, motivation, socialLinks } = await request.json();
    
    if (!userId || !motivation) {
      return NextResponse.json(
        { success: false, error: 'Données requises manquantes' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'utilisateur existe et n'est pas déjà affilié
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
        socialLinks: socialLinks || {},
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
          socialLinks
        }
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }
    
    // Récupérer les demandes de l'utilisateur
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