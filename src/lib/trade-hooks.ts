import { AffiliateService } from '@/lib/affiliate-service';
import { creditBalance } from '@/lib/balance-service';
import { awardTradePoints } from '@/lib/points-service';
import { prisma } from '../../prisma/prisma';

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
   * Hook appelé lors de la CRÉATION du trade (avant l'échange Steam).
   * Associe l'utilisateur à un affilié si nécessaire.
   * Ne pas créditer la balance ici — l'échange n'est pas encore réalisé.
   */
  static async onTradeCreated(userId: string, tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Processing new trade ${tradeId} for user ${userId}`);
      await AffiliateService.associateUserToAffiliate(userId);
      console.log(`[TradeHooks] Successfully processed new trade ${tradeId}`);
    } catch (error) {
      console.error(`[TradeHooks] Error processing new trade ${tradeId}:`, error);
    }
  }

  /**
   * Hook appelé lors de l'IPN #1 Skinplace : l'échange Steam est ACCEPTÉ.
   * C'est le moment exact où l'on crédite la balance de l'utilisateur sur notre site.
   * Les fonds sont en "hold balance" chez Skinplace (~8 jours) mais on crédite
   * immédiatement pour que l'utilisateur voie son solde disponible.
   */
  static async onTradeAccepted(userId: string, tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] IPN #1 — Trade ${tradeId} accepted by Steam, crediting balance`);

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: { user: true },
      });

      if (!trade) {
        throw new Error(`Trade ${tradeId} not found`);
      }

      // Vérifier qu'on n'a pas déjà crédité (idempotence)
      const alreadyCredited = await prisma.auditLog.findFirst({
        where: {
          userId,
          action: 'TRADE_BALANCE_CREDITED',
          details: { path: ['tradeId'], equals: tradeId },
        },
      });

      if (alreadyCredited) {
        console.warn(`[TradeHooks] Balance already credited for trade ${tradeId}, skipping`);
        return;
      }

      // Créditer le solde utilisateur dès l'IPN #1 (échange Steam réussi)
      await creditBalance(
        userId,
        trade.netCents,
        `Trade ${tradeId} accepté — fonds en cours de libération (8j)`,
        { type: 'TRADE_CREDIT', tradeId }
      );

      // Mettre à jour XP et tickets (la vente est confirmée)
      await this.updateUserExperience(tradeId);

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TRADE_BALANCE_CREDITED',
          details: {
            tradeId,
            netCents: trade.netCents,
            grossCents: trade.grossCents,
            source: 'skinplace_ipn1',
          },
        },
      });

      console.log(`[TradeHooks] Balance credited for trade ${tradeId}: ${trade.netCents} centimes`);
    } catch (error) {
      console.error(`[TradeHooks] Error crediting balance for trade ${tradeId}:`, error);
      throw error;
    }
  }
  
  /**
   * Met à jour l'expérience, les points et le niveau de l'utilisateur basé sur le trade.
   * Utilise le service de points configurable par l'admin.
   */
  private static async updateUserExperience(tradeId: string): Promise<void> {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: true }
    });
    
    if (!trade) return;

    // Attribution des points via le service configurable
    const { points: xpGained } = await awardTradePoints(
      trade.userId,
      tradeId,
      trade.grossCents
    );

    // Mettre à jour le volume total
    const updatedUser = await prisma.user.update({
      where: { id: trade.userId },
      data: { totalVolumeCents: { increment: trade.grossCents } }
    });
    
    // Calculer le nouveau niveau (racine carrée de XP / 100)
    const currentXp = updatedUser.xp;
    const newLevel = Math.floor(Math.sqrt(currentXp / 100)) + 1;
    
    if (newLevel > updatedUser.level) {
      await prisma.user.update({
        where: { id: trade.userId },
        data: { level: newLevel }
      });

      await prisma.pointTransaction.create({
        data: {
          userId: trade.userId,
          type: 'LEVEL_UP',
          points: 500,
          tickets: 0,
          reason: `Passage au niveau ${newLevel}`,
          metadata: { oldLevel: updatedUser.level, newLevel, tradeId },
        },
      });

      await prisma.user.update({
        where: { id: trade.userId },
        data: { xp: { increment: 500 } },
      });
      
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
      
      // Si le trade devient AVAILABLE après le hold, créer le payout
      if (newStatus === 'AVAILABLE' && oldStatus === 'IN_TRADE_HOLD') {
        await this.onTradeAvailable(tradeId);
      }
      
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
   * Hook appelé quand un trade est AVAILABLE (items dans l'inventaire Skinplace,
   * cas sans hold ou après la période de hold).
   *
   * La balance a déjà été créditée lors de l'IPN #1 (onTradeAccepted).
   * Ici on met juste à jour le statut du trade pour indiquer que le payout
   * peut maintenant être déclenché par l'utilisateur.
   */
  static async onTradeAvailable(tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Trade ${tradeId} is now AVAILABLE`);

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: { user: true },
      });

      if (!trade) {
        throw new Error('Trade not found');
      }

      // Si la balance n'a pas encore été créditée (cas où onTradeAccepted n'a pas été appelé,
      // ex: trade qui passe directement de CREATED à AVAILABLE sans passer par ACCEPTED_BY_BOT)
      const alreadyCredited = await prisma.auditLog.findFirst({
        where: {
          userId: trade.userId,
          action: 'TRADE_BALANCE_CREDITED',
          details: { path: ['tradeId'], equals: tradeId },
        },
      });

      if (!alreadyCredited) {
        console.log(`[TradeHooks] Balance not yet credited for trade ${tradeId}, crediting now`);
        await creditBalance(
          trade.userId,
          trade.netCents,
          `Trade ${tradeId} disponible`,
          { type: 'TRADE_CREDIT', tradeId }
        );
        await this.updateUserExperience(tradeId);
        await prisma.auditLog.create({
          data: {
            userId: trade.userId,
            action: 'TRADE_BALANCE_CREDITED',
            details: {
              tradeId,
              netCents: trade.netCents,
              grossCents: trade.grossCents,
              source: 'skinplace_available',
            },
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: trade.userId,
          action: 'TRADE_AVAILABLE_FOR_PAYOUT',
          details: { tradeId, amountCents: trade.netCents },
        },
      });

      console.log(`[TradeHooks] Trade ${tradeId} ready for payout`);
    } catch (error) {
      console.error(`[TradeHooks] Error processing available trade ${tradeId}:`, error);
      throw error;
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