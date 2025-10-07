import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';

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
    
    const stats = await AffiliateService.getAffiliateStats(userId);
    
    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    // Calculer les métriques additionnelles
    const totalPendingCommissions = stats.commissions?.reduce((sum, commission) => {
      return commission.status === 'PENDING' ? sum + commission.amountCents : sum;
    }, 0) || 0;
    
    const totalPaidCommissions = stats.commissions?.reduce((sum, commission) => {
      return commission.status === 'PAID' ? sum + commission.amountCents : sum;
    }, 0) || 0;
    
    const recentReferrals = stats.referrals?.slice(0, 10) || [];
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        metrics: {
          totalPendingCommissions,
          totalPaidCommissions,
          conversionRate: stats.totalReferrals > 0 
            ? (stats.referrals?.filter(r => r.volumeCents > 0).length || 0) / stats.totalReferrals 
            : 0,
          averageOrderValue: stats.totalReferrals > 0 
            ? stats.totalVolumeCents / stats.totalReferrals 
            : 0
        },
        recentReferrals
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération stats affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}