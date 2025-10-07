import { NextRequest, NextResponse } from 'next/server';
import { TradeHooks } from '@/lib/trade-hooks';
import { prisma } from '@/prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    // TODO: Vérifier les permissions admin
    
    const { action, affiliateId, tradeId } = await request.json();
    
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
            userId: 'admin', // TODO: ID admin réel
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
        
        await TradeHooks.onTradePaid(tradeId);
        
        await prisma.auditLog.create({
          data: {
            userId: 'admin',
            action: 'TRADE_COMMISSION_PROCESSED',
            details: { tradeId }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Trade traité pour les commissions'
        });
        
      case 'recalculate_all':
        // Recalculer pour tous les affiliés actifs
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
            userId: 'admin',
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