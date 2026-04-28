import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '../../../../../prisma/prisma';
import { emailService } from '@/lib/email';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  adminAffiliateApplicationPostSchema,
  adminAffiliateApplicationsListQuerySchema,
} from '@/lib/validation/schemas/admin-bodies';

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminSessionWithDbCheck(request))) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsedQ = safeParseSearchParams(searchParams, adminAffiliateApplicationsListQuerySchema, {
      errorStyle: 'successFalse',
    });
    if (!parsedQ.ok) {
      return parsedQ.response;
    }
    const page = parsedQ.data.page;
    const limit = parsedQ.data.limit;
    const status = parsedQ.data.status ?? 'all';
    
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
    const adminSession = await requireAdminSessionWithDbCheck(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    const adminId = adminSession.user.id;

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminAffiliateApplicationPostSchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, applicationId, data } = parsed.data;
    
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

