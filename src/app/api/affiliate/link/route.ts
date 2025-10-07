import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, path = '' } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }
    
    // Récupérer le code d'affilié
    const affiliate = await AffiliateService.getAffiliateStats(userId);
    
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    const affiliateLink = AffiliateService.generateAffiliateLink(affiliate.code, path);
    
    return NextResponse.json({
      success: true,
      data: {
        link: affiliateLink,
        code: affiliate.code,
        shortLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cashtrade.fr'}?ref=${affiliate.code}`
      }
    });
    
  } catch (error) {
    console.error('Erreur génération lien affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}