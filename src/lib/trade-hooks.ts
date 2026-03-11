import { AffiliateService } from '@/lib/affiliate-service';
import { creditBalance, creditPendingBalance, releasePendingToBalance, debitPendingBalance } from '@/lib/balance-service';
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
   * On crédite le solde EN ATTENTE (pendingBalanceCents) pour que l'utilisateur
   * voie que des fonds arrivent, sans pouvoir les retirer.
   * La libération vers le solde réel se fait à l'IPN #2 (protection_status=confirmed).
   */
  static async onTradeAccepted(userId: string, tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] IPN #1 — Trade ${tradeId} accepted, crediting pending balance`);

      const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
      if (!trade) throw new Error(`Trade ${tradeId} not found`);

      // Idempotence
      const alreadyPending = await prisma.auditLog.findFirst({
        where: {
          userId,
          action: 'TRADE_PENDING_BALANCE_CREDITED',
          details: { path: ['tradeId'], equals: tradeId },
        },
      });

      if (alreadyPending) {
        console.warn(`[TradeHooks] Pending balance already credited for trade ${tradeId}, skipping`);
        return;
      }

      await creditPendingBalance(
        userId,
        trade.netCents,
        `Trade ${tradeId} accepté — en attente de confirmation (~8j)`,
        { tradeId }
      );

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TRADE_PENDING_BALANCE_CREDITED',
          details: { tradeId, netCents: trade.netCents, source: 'skinplace_ipn1' },
        },
      });

      console.log(`[TradeHooks] Pending balance credited for trade ${tradeId}: ${trade.netCents} centimes`);
    } catch (error) {
      console.error(`[TradeHooks] Error in onTradeAccepted for trade ${tradeId}:`, error);
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
   * Hook appelé lors de l'IPN #2 avec protection_status=rollback.
   * Skinplace annule le trade (demande de remboursement Steam, fraude, etc.).
   * On décrémente le pendingBalanceCents crédité à l'IPN #1 pour remettre le solde à zéro.
   * Si le pending a déjà été libéré vers balanceCents (ne devrait pas arriver),
   * on débite le balanceCents en dernier recours.
   */
  static async onTradeRolledBack(userId: string, tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Rollback trade ${tradeId} — reverting pending balance`);

      const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
      if (!trade) throw new Error(`Trade ${tradeId} not found`);

      // Idempotence
      const alreadyReverted = await prisma.auditLog.findFirst({
        where: {
          userId,
          action: 'TRADE_PENDING_BALANCE_REVERTED',
          details: { path: ['tradeId'], equals: tradeId },
        },
      });

      if (alreadyReverted) {
        console.warn(`[TradeHooks] Pending balance already reverted for trade ${tradeId}, skipping`);
        return;
      }

      await debitPendingBalance(
        userId,
        trade.netCents,
        `Trade ${tradeId} annulé (rollback Skinplace) — solde en attente annulé`,
        { tradeId }
      );

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TRADE_PENDING_BALANCE_REVERTED',
          details: { tradeId, netCents: trade.netCents, source: 'skinplace_ipn2_rollback' },
        },
      });

      console.log(`[TradeHooks] Pending balance reverted for trade ${tradeId}: -${trade.netCents} centimes`);
    } catch (error) {
      console.error(`[TradeHooks] Error reverting pending balance for trade ${tradeId}:`, error);
      throw error;
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
   * Hook appelé lors de l'IPN #2 Skinplace : protection_status=confirmed.
   * Les fonds sont définitivement libérés chez Skinplace (~8 jours après l'échange).
   * C'est ICI et UNIQUEMENT ICI que l'on crédite la balance de l'utilisateur.
   * Cela empêche la fraude : accepter le trade → payout immédiat → remboursement Steam.
   */
  static async onTradeAvailable(tradeId: string): Promise<void> {
    try {
      console.log(`[TradeHooks] Trade ${tradeId} is now AVAILABLE — crediting balance`);

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: { user: true },
      });

      if (!trade) {
        throw new Error('Trade not found');
      }

      // Idempotence : ne pas créditer deux fois si le webhook est rejoué
      const alreadyCredited = await prisma.auditLog.findFirst({
        where: {
          userId: trade.userId,
          action: 'TRADE_BALANCE_CREDITED',
          details: { path: ['tradeId'], equals: tradeId },
        },
      });

      if (alreadyCredited) {
        console.warn(`[TradeHooks] Balance already credited for trade ${tradeId}, skipping`);
      } else {
        // Libère les fonds du solde en attente vers le solde disponible
        await releasePendingToBalance(
          trade.userId,
          trade.netCents,
          `Trade ${tradeId} confirmé — fonds libérés par Skinplace`,
          { tradeId }
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
              source: 'skinplace_ipn2_confirmed',
            },
          },
        });
        console.log(`[TradeHooks] Balance released from pending for trade ${tradeId}: ${trade.netCents} centimes`);
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