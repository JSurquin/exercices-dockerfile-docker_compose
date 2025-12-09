import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '../../../../../prisma/prisma';
import { emailService } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // TODO: Vérifier les permissions admin
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;
    
    // Construire les filtres
    const where: any = {};
    
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    // Récupérer les demandes avec pagination
    const [applications, total] = await Promise.all([
      prisma.affiliateApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              steamUsername: true,
              steamAvatar: true,
              kycStatus: true,
              createdAt: true
            }
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              steamUsername: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.affiliateApplication.count({ where })
    ]);
    
    // Compter les demandes en attente
    const pendingCount = await prisma.affiliateApplication.count({
      where: { status: 'PENDING' }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        pendingCount
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération demandes affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Vérifier les permissions admin et récupérer l'ID de l'admin
    const adminId = 'admin'; // TODO: Récupérer l'ID réel de l'admin connecté
    
    const { action, applicationId, data } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'ID de demande requis' },
        { status: 400 }
      );
    }
    
    // Récupérer la demande
    const application = await prisma.affiliateApplication.findUnique({
      where: { id: applicationId },
      include: { user: true }
    });
    
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Demande introuvable' },
        { status: 404 }
      );
    }
    
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'approve':
        // Approuver la demande et créer le compte affilié
        let affiliateCode: string = '';
        
        await prisma.$transaction(async (tx) => {
          // Mettre à jour la demande
          await tx.affiliateApplication.update({
            where: { id: applicationId },
            data: {
              status: 'APPROVED',
              reviewedBy: adminId,
              reviewedAt: new Date()
            }
          });
          
          // Créer le compte affilié
          const affiliateStats = await AffiliateService.createAffiliateAccount(application.userId);
          affiliateCode = affiliateStats.code;
          
          // Log de l'audit
          await tx.auditLog.create({
            data: {
              userId: adminId,
              action: 'AFFILIATE_APPLICATION_APPROVED',
              details: {
                applicationId,
                userId: application.userId,
                affiliateCode
              }
            }
          });
        });
        
        // Envoyer notification email au user
        try {
          await emailService.sendAffiliateApplicationApproved(
            {
              email: application.user.email,
              steamUsername: application.user.steamUsername
            },
            affiliateCode
          );
        } catch (emailError) {
          console.error('Erreur envoi email approbation:', emailError);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Demande approuvée et compte affilié créé'
        });
        
      case 'reject':
        const rejectionReason = data?.rejectionReason || 'Non spécifié';
        
        // Rejeter la demande
        await prisma.$transaction(async (tx) => {
          await tx.affiliateApplication.update({
            where: { id: applicationId },
            data: {
              status: 'REJECTED',
              reviewedBy: adminId,
              reviewedAt: new Date(),
              rejectionReason
            }
          });
          
          // Log de l'audit
          await tx.auditLog.create({
            data: {
              userId: adminId,
              action: 'AFFILIATE_APPLICATION_REJECTED',
              details: {
                applicationId,
                userId: application.userId,
                rejectionReason
              }
            }
          });
        });
        
        // Envoyer notification email au user
        try {
          await emailService.sendAffiliateApplicationRejected(
            {
              email: application.user.email,
              steamUsername: application.user.steamUsername
            },
            rejectionReason
          );
        } catch (emailError) {
          console.error('Erreur envoi email rejet:', emailError);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Demande rejetée'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Erreur traitement demande affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

