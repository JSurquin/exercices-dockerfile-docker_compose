import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'PENDING';
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }
    
    // Récupérer l'affilié
    const affiliate = await AffiliateService.getAffiliateStats(userId);
    
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    // Filtrer les commissions par statut
    const commissions = affiliate.commissions?.filter(c => c.status === status) || [];
    
    return NextResponse.json({
      success: true,
      data: {
        commissions,
        totalAmount: commissions.reduce((sum, c) => sum + c.amountCents, 0),
        count: commissions.length
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération commissions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, commissionIds } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Paramètres requis manquants' },
        { status: 400 }
      );
    }
    
    // Récupérer l'affilié
    const affiliate = await AffiliateService.getAffiliateStats(userId);
    
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    if (action === 'request_payout' && commissionIds) {
      // Demander un paiement pour les commissions sélectionnées
      await AffiliateService.approveCommissions(affiliate.id, commissionIds);
      
      return NextResponse.json({
        success: true,
        message: 'Demande de paiement envoyée'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Action non reconnue' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Erreur traitement commissions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}