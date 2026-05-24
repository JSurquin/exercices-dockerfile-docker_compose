import {
  AffiliateService,
  AFFILIATE_SELL_PROMO_FRAGMENTS,
} from '@/lib/affiliate-service';
import { creditBalance, creditPendingBalance, releasePendingToBalance, debitPendingBalance } from '@/lib/balance-service';
import { awardTradePoints } from '@/lib/points-service';
import { grantFragments } from '@/lib/fragment-service';
import { currencyConverter } from '@/lib/currency-converter';
import { prisma } from '../../prisma/prisma';
import { logger } from '@/lib/logger';
import { getUserRewardFlags, isAffiliateRewardsBlocked } from '@/lib/user-rewards-guard';

/**
 * Service pour gérer les hooks et événements liés aux trades.
 * Les montants grossCents/netCents sont recalculés côté serveur dans create-trade/route.ts
 * à partir de la somme des price_centimes des items (pas le montant client brut).
 */
export class TradeHooks {
  /**
   * Hook legacy post-PAID (retrait utilisateur).
   * Les commissions affilié sont désormais attribuées dans onTradeAvailable (après validation ~7j).
   */
  static async onTradePaid(tradeId: string): Promise<void> {
    try {
      const lock = await prisma.trade.updateMany({
        where: { id: tradeId, paidProcessedAt: null },
        data: { paidProcessedAt: new Date() },
      });
      if (lock.count === 0) {
        logger.warn(`[TradeHooks] onTradePaid already processed for trade ${tradeId}`);
        return;
      }
      logger.info(`[TradeHooks] Trade ${tradeId} marked PAID (affiliate commission handled at AVAILABLE)`);
    } catch (error) {
      logger.error(`[TradeHooks] Error processing trade ${tradeId}`, error);
      try {
        await prisma.trade.update({ where: { id: tradeId }, data: { paidProcessedAt: null } });
      } catch (rollbackErr) {
        logger.error(`[TradeHooks] CRITICAL: Failed to rollback paidProcessedAt for trade ${tradeId}`, rollbackErr);
      }
    }
  }
  
  /**
   * Hook appelé lors de la CRÉATION du trade (avant l'échange Steam).
   * Associe l'utilisateur à un affilié si nécessaire.
   * Ne pas créditer la balance ici — l'échange n'est pas encore réalisé.
   */
  static async onTradeCreated(userId: string, tradeId: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] Processing new trade ${tradeId}`);
      await AffiliateService.associateUserToAffiliate(userId);
      logger.info(`[TradeHooks] Successfully processed new trade ${tradeId}`);
    } catch (error) {
      logger.error(`[TradeHooks] Error processing new trade ${tradeId}`, error);
    }
  }

  /**
   * Hook appelé lors de l'IPN #1 Skinplace : l'échange Steam est ACCEPTÉ.
   *
   * Deux modes :
   *   - Mode normal : crédite pendingBalanceCents (fonds bloqués 7j).
   *   - Mode Instant Credit (admin) : crédite directement balanceCents + pose
   *     instantCreditedAt pour que onTradeAvailable ne re-crédite pas.
   *
   * Idempotence : pendingCreditedAt sert de verrou atomique.
   */
  static async onTradeAccepted(userId: string, tradeId: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] IPN #1 — Trade ${tradeId} accepted`);

      const { trade, locked } = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.findUnique({
          where: { id: tradeId },
          include: { user: { select: { instantCreditEnabled: true } } },
        });
        if (!t) throw new Error(`Trade ${tradeId} not found`);

        const lockResult = await tx.trade.updateMany({
          where: { id: tradeId, pendingCreditedAt: null },
          data: { pendingCreditedAt: new Date() },
        });

        return { trade: t, locked: lockResult.count > 0 };
      });

      if (!locked) {
        logger.warn(`[TradeHooks] Pending balance already credited for trade ${tradeId}`);
        return;
      }

      const eurCents = await currencyConverter.convertUsdCentsToEurCents(trade.netCents);
      const rate = await currencyConverter.getUsdToEurRate();

      await prisma.trade.update({
        where: { id: tradeId },
        data: { eurCentsAtCredit: eurCents, usdToEurRate: rate },
      });

      if (trade.user.instantCreditEnabled) {
        await creditBalance(
          userId,
          eurCents,
          `Trade ${tradeId} accepted — instant credit`,
          { type: 'TRADE_CREDIT', tradeId }
        );
        const now = new Date();
        await prisma.trade.update({
          where: { id: tradeId },
          data: {
            instantCreditedAt: now,
            balanceCreditedAt: now,
            status: 'AVAILABLE',
            availableAt: now,
          },
        });
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'TRADE_INSTANT_CREDIT',
            details: { tradeId, netCentsUsd: trade.netCents, eurCents, usdToEurRate: rate, source: 'instant_credit_ipn1' },
          },
        });
        logger.info(`[TradeHooks] INSTANT CREDIT applied for trade ${tradeId} — status forced to AVAILABLE`);
      } else {
        await creditPendingBalance(
          userId,
          eurCents,
          `Trade ${tradeId} accepted — awaiting confirmation (~8d)`,
          { tradeId }
        );
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'TRADE_PENDING_BALANCE_CREDITED',
            details: { tradeId, netCentsUsd: trade.netCents, eurCents, usdToEurRate: rate, source: 'skinplace_ipn1' },
          },
        });
        logger.info(`[TradeHooks] Pending balance credited for trade ${tradeId}`);
      }
    } catch (error) {
      logger.error(`[TradeHooks] Error in onTradeAccepted for trade ${tradeId}`, error);
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
          reason: `Reached level ${newLevel}`,
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
   *
   * Deux chemins :
   *   - Instant Credit : on force-debit balanceCents (le trade avait crédité directement)
   *   - Normal : on décrémente pendingBalanceCents
   *
   * Idempotence : pendingRevertedAt sert de verrou atomique.
   */
  static async onTradeRolledBack(userId: string, tradeId: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] Rollback trade ${tradeId}`);

      const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
      if (!trade) throw new Error(`Trade ${tradeId} not found`);

      const lockResult = await prisma.trade.updateMany({
        where: { id: tradeId, pendingRevertedAt: null },
        data: { pendingRevertedAt: new Date() },
      });

      if (lockResult.count === 0) {
        logger.warn(`[TradeHooks] Pending balance already reverted for trade ${tradeId}`);
        return;
      }

      const eurCents = trade.eurCentsAtCredit ?? await currencyConverter.convertUsdCentsToEurCents(trade.netCents);

      if (trade.instantCreditedAt) {
        const { forceDebitBalance } = await import('@/lib/balance-service');
        const { balanceAfterCents } = await forceDebitBalance(
          userId,
          eurCents,
          `Trade ${tradeId} cancelled (Skinplace rollback) — instant credit reverted`,
          { type: 'ADMIN_ADJUSTMENT', tradeId }
        );
        if (balanceAfterCents < 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { accountFrozen: true },
          });
          await prisma.auditLog.create({
            data: {
              userId,
              action: 'ACCOUNT_AUTO_FROZEN_NEGATIVE_BALANCE',
              details: { tradeId, balanceAfterCents, debitedCents: eurCents, source: 'instant_credit_rollback' },
            },
          });
          logger.error(`[TradeHooks] CRITICAL: User balance went negative after rollback of trade ${tradeId} — account FROZEN`);
        }
        logger.info(`[TradeHooks] Instant credit reverted for trade ${tradeId}`);
      } else {
        await debitPendingBalance(
          userId,
          eurCents,
          `Trade ${tradeId} cancelled (Skinplace rollback) — pending balance reverted`,
          { tradeId }
        );
        logger.info(`[TradeHooks] Pending balance reverted for trade ${tradeId}`);
      }

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TRADE_PENDING_BALANCE_REVERTED',
          details: {
            tradeId,
            netCentsUsd: trade.netCents,
            eurCents,
            wasInstantCredit: !!trade.instantCreditedAt,
            source: 'skinplace_ipn2_rollback',
          },
        },
      });

      await AffiliateService.cancelCommissionsForTrade(tradeId);
    } catch (error) {
      logger.error(`[TradeHooks] Error reverting balance for trade ${tradeId}`, error);
      throw error;
    }
  }

  /**
   * Hook appelé lors du changement de statut d'un trade
   */
  static async onTradeStatusChanged(tradeId: string, oldStatus: string, newStatus: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] Trade ${tradeId} status: ${oldStatus} -> ${newStatus}`);
      
      // Si le trade devient AVAILABLE après le hold, créer le payout
      if (newStatus === 'AVAILABLE' && oldStatus === 'IN_TRADE_HOLD') {
        await this.onTradeAvailable(tradeId);
      }
      
      // Si le trade passe à "PAID", journaliser (commissions déjà traitées à AVAILABLE)
      if (newStatus === 'PAID' && oldStatus !== 'PAID') {
        await this.onTradePaid(tradeId);
      }

      if (newStatus === 'FAILED' && oldStatus !== 'FAILED') {
        await AffiliateService.cancelCommissionsForTrade(tradeId);
      }

      if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        await AffiliateService.cancelCommissionsForTrade(tradeId);
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
      logger.error(`[TradeHooks] Error processing status change for trade ${tradeId}`, error);
    }
  }
  
  /**
   * Hook appelé lors de l'IPN #2 Skinplace : protection_status=confirmed,
   * ou par le polling quand on rattrape un trade confirmé.
   *
   * C'est ICI et UNIQUEMENT ICI que l'on crédite la balance de l'utilisateur.
   *
   * Deux chemins possibles :
   *   A) Le flux normal (IPN #1 puis IPN #2) : onTradeAccepted a déjà crédité
   *      le pendingBalance → on fait releasePendingToBalance.
   *   B) Le rattrapage (polling/IPN #1 raté) : pendingCreditedAt est null, donc
   *      pendingBalanceCents = 0 → on fait un creditBalance direct.
   *
   * Idempotence : balanceCreditedAt sert de verrou atomique via updateMany.
   */
  static async onTradeAvailable(tradeId: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] Trade ${tradeId} is now AVAILABLE`);

      // Verrou atomique : read + lock dans une seule transaction pour éviter le double-crédit
      const { trade, locked } = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.findUnique({
          where: { id: tradeId },
          include: { user: true },
        });
        if (!t) throw new Error('Trade not found');

        const lockResult = await tx.trade.updateMany({
          where: { id: tradeId, balanceCreditedAt: null },
          data: { balanceCreditedAt: new Date() },
        });

        return { trade: t, locked: lockResult.count > 0 };
      });

      if (!locked) {
        logger.warn(`[TradeHooks] Balance already credited for trade ${tradeId}`);
      } else if (trade.instantCreditedAt) {
        // Instant Credit : la balance a déjà été créditée à l'IPN #1
        // On doit seulement supprimer le pending (qui n'a pas été crédité en mode instant)
        // Aucun crédit supplémentaire — le verrou balanceCreditedAt est déjà posé
        logger.info(`[TradeHooks] Trade ${tradeId} was instant-credited — skipping balance credit`);
        await prisma.auditLog.create({
          data: {
            userId: trade.userId,
            action: 'TRADE_BALANCE_CREDITED',
            details: {
              tradeId,
              netCentsUsd: trade.netCents,
              grossCents: trade.grossCents,
              source: 'instant_credit_already_done',
            },
          },
        });
      } else {
        const storedEurCents = trade.eurCentsAtCredit;
        const eurCents = storedEurCents ?? await currencyConverter.convertUsdCentsToEurCents(trade.netCents);
        const rate = trade.usdToEurRate ?? await currencyConverter.getUsdToEurRate();

        if (trade.pendingCreditedAt) {
          await releasePendingToBalance(
            trade.userId,
            eurCents,
            `Trade ${tradeId} confirmed — funds released by Skinplace`,
            { tradeId }
          );
          logger.info(`[TradeHooks] Balance released from pending for trade ${tradeId}`);
        } else {
          logger.warn(`[TradeHooks] No pending credit found for trade ${tradeId} — direct credit`);
          await creditBalance(
            trade.userId,
            eurCents,
            `Trade ${tradeId} confirmed — direct credit (polling catchup)`,
            { type: 'TRADE_CREDIT', tradeId }
          );
          logger.info(`[TradeHooks] Balance directly credited for trade ${tradeId}`);
        }

        await prisma.auditLog.create({
          data: {
            userId: trade.userId,
            action: 'TRADE_BALANCE_CREDITED',
            details: {
              tradeId,
              netCentsUsd: trade.netCents,
              eurCents,
              usdToEurRate: rate,
              usedStoredRate: !!storedEurCents,
              grossCents: trade.grossCents,
              hadPendingCredit: !!trade.pendingCreditedAt,
              source: trade.pendingCreditedAt ? 'release_pending' : 'direct_credit_catchup',
            },
          },
        });
      }

      // XP + totalVolumeCents : une seule fois quand le lock balance est acquis
      if (locked) {
        await this.updateUserExperience(tradeId);
      }

      if (trade.affiliatePromoCode && !trade.affiliatePromoFragmentsGrantedAt) {
        const promoFlags = await getUserRewardFlags(trade.userId);
        if (isAffiliateRewardsBlocked(promoFlags)) {
          logger.warn(
            `[TradeHooks] Skipping affiliate promo fragments for trade ${tradeId} — rewards blocked`
          );
        } else {
          try {
            await grantFragments(
              trade.userId,
              AFFILIATE_SELL_PROMO_FRAGMENTS,
              'GENERATED_EVENT',
              `Affiliate promo bonus — trade ${tradeId}`,
              { tradeId, source: 'affiliate_sell_promo' }
            );
            await prisma.trade.update({
              where: { id: tradeId },
              data: { affiliatePromoFragmentsGrantedAt: new Date() },
            });
          } catch (fragErr) {
            logger.error(`[TradeHooks] Promo fragments error for trade ${tradeId}`, fragErr);
          }
        }
      }

      await this.processAffiliateCommission(tradeId);

      logger.info(`[TradeHooks] Trade ${tradeId} ready for payout`);
    } catch (error) {
      logger.error(`[TradeHooks] Error processing available trade ${tradeId}`, error);
      throw error;
    }
  }
  
  /**
   * Attribution commission affilié — toujours passer par ce hook (pas d'appel direct Prisma ailleurs).
   */
  static async processAffiliateCommission(
    tradeId: string,
    options?: { skipHoldCheck?: boolean }
  ): Promise<void> {
    try {
      await AffiliateService.calculateCommissionForTrade(tradeId, options);
    } catch (commissionErr) {
      logger.error(`[TradeHooks] Affiliate commission error for trade ${tradeId}`, commissionErr);
      await prisma.trade.update({
        where: { id: tradeId },
        data: { affiliateCommissionProcessedAt: null },
      }).catch(() => undefined);
    }
  }

  /**
   * Recalcule les commissions pour tous les trades d'un affilié
   * Utile pour les ajustements de taux de commission
   */
  static async recalculateAffiliateCommissions(affiliateId: string): Promise<void> {
    try {
      logger.info(`[TradeHooks] Recalculating commissions for affiliate ${affiliateId}`);
      
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
      
      // Supprimer les commissions en attente et annuler leurs effets sur les stats
      const pendingToRemove = await prisma.affiliateCommission.findMany({
        where: { affiliateId, status: 'PENDING' },
        include: { trade: { select: { grossCents: true } } },
      });

      for (const commission of pendingToRemove) {
        if (commission.tradeId && commission.trade) {
          if (commission.referralId) {
            await prisma.affiliateReferral.update({
              where: { id: commission.referralId },
              data: {
                volumeCents: { decrement: commission.trade.grossCents },
                commissionCents: { decrement: commission.amountCents },
              },
            });
          }
          await prisma.affiliateStats.update({
            where: { id: affiliateId },
            data: {
              totalVolumeCents: { decrement: commission.trade.grossCents },
              totalCommissionCents: { decrement: commission.amountCents },
            },
          });
        }
      }

      await prisma.affiliateCommission.deleteMany({
        where: { affiliateId, status: 'PENDING' },
      });
      
      const referredUserIds = affiliate.referrals.map((r) => r.referredUserId);
      const eligibleTrades = await prisma.trade.findMany({
        where: {
          userId: { in: referredUserIds },
          status: { in: ['AVAILABLE', 'PAYOUT_PENDING', 'PAID'] },
        },
        select: { id: true },
      });

      for (const { id } of eligibleTrades) {
        await prisma.trade.update({
          where: { id },
          data: { affiliateCommissionProcessedAt: null },
        });
        await this.processAffiliateCommission(id, { skipHoldCheck: true });
      }
      
      logger.info(`[TradeHooks] Successfully recalculated commissions for affiliate ${affiliateId}`);
    } catch (error) {
      logger.error(`[TradeHooks] Error recalculating commissions for affiliate ${affiliateId}`, error);
      throw error;
    }
  }
}