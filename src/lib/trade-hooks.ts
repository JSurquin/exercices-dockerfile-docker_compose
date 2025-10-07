import { AffiliateService } from '@/lib/affiliate-service';
import { prisma } from '@/prisma/prisma';

/**
 * Service pour gérer les hooks et événements liés aux trades
 */
export class TradeHooks {
  /**
   * Hook appelé après qu'un trade soit marqué comme "PAID"
   * Calcule et enregistre les commissions d'affiliation
   */
  static async onTradePaid(tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Processing trade ${tradeId} for affiliate commissions`);
      
      // Calculer les commissions d'affiliation
      await AffiliateService.calculateCommissionForTrade(tradeId);
      
      // Mettre à jour les XP et niveaux de l'utilisateur
      await this.updateUserExperience(tradeId);
      
      console.log(`[TradeHooks] Successfully processed trade ${tradeId}`);
    } catch (error) {
      console.error(`[TradeHooks] Error processing trade ${tradeId}:`, error);
      // Ne pas faire échouer le trade si le calcul des commissions échoue
    }
  }
  
  /**
   * Hook appelé lors de la création d'un trade
   * Associe l'utilisateur à un affilié si nécessaire
   */
  static async onTradeCreated(userId: string, tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Processing new trade ${tradeId} for user ${userId}`);
      
      // Associer l'utilisateur à un affilié s'il y a un code de référence
      await AffiliateService.associateUserToAffiliate(userId);
      
      console.log(`[TradeHooks] Successfully processed new trade ${tradeId}`);
    } catch (error) {
      console.error(`[TradeHooks] Error processing new trade ${tradeId}:`, error);
    }
  }
  
  /**
   * Met à jour l'expérience et le niveau de l'utilisateur basé sur le trade
   */
  private static async updateUserExperience(tradeId: string): Promise<void> {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true }
    });
    
    if (!trade) return;
    
    // Calculer l'XP basé sur le volume (1 XP par euro de volume brut)
    const xpGained = Math.floor(trade.grossCents / 100);
    
    // Calculer les tickets basés sur le volume (1 ticket par 10 euros)
    const ticketsGained = Math.floor(trade.grossCents / 1000);
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: trade.userId },
      data: {
        xp: { increment: xpGained },
        tickets: { increment: ticketsGained },
        totalVolumeCents: { increment: trade.grossCents }
      }
    });
    
    // Calculer le nouveau niveau (exemple: niveau = racine carrée de XP / 100)
    const newLevel = Math.floor(Math.sqrt(updatedUser.xp / 100)) + 1;
    
    if (newLevel > updatedUser.level) {
      await prisma.user.update({
        where: { id: trade.userId },
        data: { level: newLevel }
      });
      
      // Log de l'audit pour le changement de niveau
      await prisma.auditLog.create({
        data: {
          userId: trade.userId,
          action: 'LEVEL_UP',
          details: {
            oldLevel: updatedUser.level,
            newLevel,
            tradeId,
            xpGained
          }
        }
      });
    }
  }
  
  /**
   * Hook appelé lors du changement de statut d'un trade
   */
  static async onTradeStatusChanged(tradeId: string, oldStatus: string, newStatus: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Trade ${tradeId} status changed from ${oldStatus} to ${newStatus}`);
      
      // Si le trade passe à "PAID", calculer les commissions
      if (newStatus === 'PAID' && oldStatus !== 'PAID') {
        await this.onTradePaid(tradeId);
      }
      
      // Log de l'audit
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'TRADE_STATUS_CHANGED',
          details: {
            tradeId,
            oldStatus,
            newStatus
          }
        }
      });
      
    } catch (error) {
      console.error(`[TradeHooks] Error processing status change for trade ${tradeId}:`, error);
    }
  }
  
  /**
   * Recalcule les commissions pour tous les trades d'un affilié
   * Utile pour les ajustements de taux de commission
   */
  static async recalculateAffiliateCommissions(affiliateId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Recalculating commissions for affiliate ${affiliateId}`);
      
      const affiliate = await prisma.affiliateStats.findUnique({
        where: { id: affiliateId },
        include: {
          referrals: {
            include: {
              trade: true
            }
          }
        }
      });
      
      if (!affiliate) {
        throw new Error('Affiliate not found');
      }
      
      // Supprimer les anciennes commissions non payées
      await prisma.affiliateCommission.deleteMany({
        where: {
          affiliateId,
          status: 'PENDING'
        }
      });
      
      // Recalculer pour chaque trade payé
      for (const referral of affiliate.referrals) {
        if (referral.trade && referral.trade.status === 'PAID') {
          await AffiliateService.calculateCommissionForTrade(referral.trade.id);
        }
      }
      
      console.log(`[TradeHooks] Successfully recalculated commissions for affiliate ${affiliateId}`);
    } catch (error) {
      console.error(`[TradeHooks] Error recalculating commissions for affiliate ${affiliateId}:`, error);
      throw error;
    }
  }
}