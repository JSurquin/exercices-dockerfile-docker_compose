import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '../../../../../prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, motivation, socialLinks } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'utilisateur existe et n'est pas déjà affilié
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { affiliateStats: true }
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
    
    // Vérifier le KYC
    if (user.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'KYC requis pour devenir affilié' },
        { status: 400 }
      );
    }
    
    // Créer le compte affilié
    const affiliateStats = await AffiliateService.createAffiliateAccount(userId);
    
    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AFFILIATE_ACCOUNT_CREATED',
        details: {
          code: affiliateStats.code,
          motivation,
          socialLinks
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        code: affiliateStats.code,
        commissionRate: affiliateStats.commissionRate,
        isActive: affiliateStats.isActive
      }
    });
    
  } catch (error) {
    console.error('Erreur création compte affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}