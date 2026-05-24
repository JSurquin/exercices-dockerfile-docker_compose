import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { TradeHooks } from '@/lib/trade-hooks';
import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '../../../../../../prisma/prisma';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminAffiliateRecalculateSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const adminUserId = session.user.id;
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminAffiliateRecalculateSchema, { errorStyle: 'successFalse' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, affiliateId, tradeId } = parsed.data;
    
    switch (action) {
      case 'recalculate_affiliate':
        if (!affiliateId) {
          return NextResponse.json(
            { success: false, error: 'ID affilié requis' },
            { status: 400 }
          );
        }
        
        await TradeHooks.recalculateAffiliateCommissions(affiliateId);
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'AFFILIATE_COMMISSIONS_RECALCULATED',
            details: { affiliateId }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Commissions recalculées avec succès'
        });
        
      case 'process_trade':
        if (!tradeId) {
          return NextResponse.json(
            { success: false, error: 'ID trade requis' },
            { status: 400 }
          );
        }
        
        await prisma.trade.update({
          where: { id: tradeId },
          data: { affiliateCommissionProcessedAt: null },
        });
        await AffiliateService.calculateCommissionForTrade(tradeId);
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'TRADE_COMMISSION_PROCESSED',
            details: { tradeId }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Trade traité pour les commissions'
        });
        
      case 'recalculate_all': {
        const activeAffiliates = await prisma.affiliateStats.findMany({
          where: { isActive: true },
          select: { id: true }
        });
        
        let processed = 0;
        for (const affiliate of activeAffiliates) {
          try {
            await TradeHooks.recalculateAffiliateCommissions(affiliate.id);
            processed++;
          } catch (error) {
            console.error(`Erreur recalcul affilié ${affiliate.id}:`, error);
          }
        }
        
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'ALL_AFFILIATE_COMMISSIONS_RECALCULATED',
            details: { 
              totalAffiliates: activeAffiliates.length,
              processed
            }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: `Commissions recalculées pour ${processed}/${activeAffiliates.length} affiliés`
        });
      }
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Erreur recalcul commissions:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
