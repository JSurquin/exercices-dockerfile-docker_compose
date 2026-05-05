import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  affiliateCommissionsPostSchema,
  affiliateCommissionsQuerySchema,
} from '@/lib/validation/schemas/affiliate';

export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const q = safeParseSearchParams(searchParams, affiliateCommissionsQuerySchema, {
      errorStyle: 'affiliate',
    });
    if (!q.ok) {
      return q.response;
    }
    const { status } = q.data;
    
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
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    const raw = await request.json();
    const parsed = safeParseJson(raw, affiliateCommissionsPostSchema, { errorStyle: 'affiliate' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, commissionIds } = parsed.data;
    const affiliate = await AffiliateService.getAffiliateStats(userId);
    
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    if (action === 'request_payout' && commissionIds) {
      await AffiliateService.requestCommissionPayout(affiliate.id, commissionIds);
      
      return NextResponse.json({
        success: true,
        message: 'Demande de paiement envoyée — en attente de validation admin'
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