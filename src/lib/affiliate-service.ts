import { cookies } from 'next/headers';
import { prisma } from '../../prisma/prisma';
import { AffiliateStats, AffiliateReferral, AffiliateCommission } from '@/lib/types';
import { computeSellPromoBonusCents as computeSellPromoBonusCentsPure } from '@/lib/affiliate-sell-promo';
import { getUserRewardFlags, isAffiliateRewardsBlocked } from '@/lib/user-rewards-guard';
import { creditBalance, forceDebitBalance } from '@/lib/balance-service';
import { currencyConverter } from '@/lib/currency-converter';
import {
  computeAffiliateCommissionCents,
  computeAffiliateCommissionEurCents,
  isAffiliateCommissionHoldComplete,
  isTradeEligibleForAffiliateCommission,
  affiliateCodeEqualsFilter,
  normalizeAffiliateCode,
} from '@/lib/affiliate-commission-logic';

export {
  AFFILIATE_SELL_PROMO_FRAGMENTS,
  AFFILIATE_SELL_PROMO_GROSS_RATE,
  computeSellPromoBonusCents,
} from '@/lib/affiliate-sell-promo';

export class AffiliateService {
  static computeSellPromoBonusCents(grossCents: number): number {
    return computeSellPromoBonusCentsPure(grossCents);
  }

  private static async findActiveAffiliateByCode(rawCode: string) {
    const code = normalizeAffiliateCode(rawCode);
    if (!code) return null;
    return prisma.affiliateStats.findFirst({
      where: { isActive: true, ...affiliateCodeEqualsFilter(code) },
      include: {
        user: { select: { steamUsername: true } },
      },
    });
  }

  private static affiliateDisplayName(affiliate: {
    code: string;
    user?: { steamUsername?: string | null } | null;
  }): string {
    return affiliate.user?.steamUsername?.trim() || affiliate.code;
  }

  /**
   * Assure qu'un filleul actif et une entrée d'historique existent pour l'affilié courant.
   */
  private static async ensureActiveReferral(
    userId: string,
    affiliateId: string,
    affiliateCode: string
  ): Promise<void> {
    const existingRef = await prisma.affiliateReferral.findFirst({
      where: { affiliateId, referredUserId: userId },
    });
    if (!existingRef) {
      await prisma.affiliateReferral.create({
        data: {
          affiliateId,
          referredUserId: userId,
          volumeCents: 0,
          commissionCents: 0,
          isActive: true,
        },
      });
      await prisma.affiliateStats.update({
        where: { id: affiliateId },
        data: { totalReferrals: { increment: 1 } },
      });
    } else if (!existingRef.isActive) {
      await prisma.affiliateReferral.update({
        where: { id: existingRef.id },
        data: { isActive: true, churnedAt: null },
      });
    }

    const activeHistory = await prisma.userAffiliateHistory.findFirst({
      where: { userId, affiliateId, isActive: true },
    });
    if (!activeHistory) {
      await prisma.userAffiliateHistory.create({
        data: { userId, affiliateId, affiliateCode, isActive: true },
      });
    }
  }

  /**
   * Remplace l'affilié du profil utilisateur par un nouveau code.
   * Les commissions passées restent chez l'ancien affilié.
   */
  static async switchUserToAffiliate(
    userId: string,
    affiliate: { id: string; code: string; user?: { steamUsername?: string | null } | null }
  ): Promise<{ replaced: boolean; affiliateName: string }> {
    const affiliateName = this.affiliateDisplayName(affiliate);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliateId: true },
    });
    if (!user) return { replaced: false, affiliateName };

    if (user.referredByAffiliateId === affiliate.id) {
      await this.ensureActiveReferral(userId, affiliate.id, affiliate.code);
      return { replaced: false, affiliateName };
    }

    const previousAffiliateId = user.referredByAffiliateId;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      if (previousAffiliateId) {
        await tx.affiliateReferral.updateMany({
          where: {
            affiliateId: previousAffiliateId,
            referredUserId: userId,
            isActive: true,
          },
          data: { isActive: false, churnedAt: now },
        });

        await tx.userAffiliateHistory.updateMany({
          where: {
            userId,
            affiliateId: previousAffiliateId,
            isActive: true,
          },
          data: { isActive: false, endedAt: now },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { referredByAffiliateId: affiliate.id },
      });

      const existingRef = await tx.affiliateReferral.findFirst({
        where: { affiliateId: affiliate.id, referredUserId: userId },
      });

      if (!existingRef) {
        await tx.affiliateReferral.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: userId,
            volumeCents: 0,
            commissionCents: 0,
            isActive: true,
          },
        });
        await tx.affiliateStats.update({
          where: { id: affiliate.id },
          data: { totalReferrals: { increment: 1 } },
        });
      } else if (!existingRef.isActive) {
        await tx.affiliateReferral.update({
          where: { id: existingRef.id },
          data: { isActive: true, churnedAt: null },
        });
      }

      await tx.userAffiliateHistory.create({
        data: {
          userId,
          affiliateId: affiliate.id,
          affiliateCode: affiliate.code,
          isActive: true,
        },
      });
    });

    return { replaced: !!previousAffiliateId, affiliateName };
  }
  /**
   * Génère un code d'affiliation unique pour un utilisateur
   */
  static async generateAffiliateCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, steamId: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Générer un code basé sur le nom d'utilisateur Steam ou l'ID
    const baseCode = user.steamUsername?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                   user.steamId?.slice(-8) || 
                   userId.slice(-8);
    
    // Vérifier l'unicité et ajouter un suffixe si nécessaire
    let code = baseCode;
    let counter = 1;
    
    while (await prisma.affiliateStats.findUnique({ where: { code } })) {
      code = `${baseCode}${counter}`;
      counter++;
    }
    
    return code;
  }
  
  /**
   * Crée un compte affilié pour un utilisateur
   */
  static async createAffiliateAccount(userId: string, commissionRate: number = 0.02): Promise<AffiliateStats> {
    const code = await this.generateAffiliateCode(userId);
    
    const affiliateStats = await prisma.affiliateStats.create({
      data: {
        userId,
        code,
        commissionRate,
        isActive: true
      }
    });
    
    // Mettre à jour le rôle de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'AFFILIATE' }
    });
    
    return affiliateStats as any;
  }
  
  /**
   * Récupère le code d'affiliation depuis les cookies
   */
  static async getAffiliateRefFromCookies(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('ctf_affiliate_ref')?.value || null;
  }
  
  /**
   * Associe un utilisateur à un affilié lors de l'inscription
   */
  static async associateUserToAffiliate(userId: string, affiliateCode?: string): Promise<void> {
    const refCode = affiliateCode || (await this.getAffiliateRefFromCookies());
    if (!refCode) return;

    const affiliate = await this.findActiveAffiliateByCode(refCode);
    if (!affiliate) return;
    if (affiliate.userId === userId) return;

    await this.switchUserToAffiliate(userId, affiliate);
  }

  /**
   * Valide un code promo affilié pour la page vente (même code que le lien affilié).
   */
  static async validateAffiliateSellPromoCode(
    userId: string,
    rawCode: string
  ): Promise<
    | {
        ok: true;
        affiliateId: string;
        code: string;
        willReplace: boolean;
        affiliateName: string;
      }
    | { ok: false; error: 'invalid' | 'self' }
  > {
    const code = normalizeAffiliateCode(rawCode);
    if (!code) return { ok: false, error: 'invalid' };

    const affiliate = await this.findActiveAffiliateByCode(rawCode);
    if (!affiliate) return { ok: false, error: 'invalid' };
    if (affiliate.userId === userId) return { ok: false, error: 'self' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliateId: true },
    });

    const willReplace = !!(
      user?.referredByAffiliateId && user.referredByAffiliateId !== affiliate.id
    );

    return {
      ok: true,
      affiliateId: affiliate.id,
      code: affiliate.code,
      willReplace,
      affiliateName: this.affiliateDisplayName(affiliate),
    };
  }

  /**
   * Rattache l’utilisateur à l’affilié du code promo (idempotent).
   */
  static async bindUserToAffiliateForSellPromo(
    userId: string,
    affiliateId: string
  ): Promise<{ replaced: boolean; affiliateName: string }> {
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { id: affiliateId, isActive: true },
      include: { user: { select: { steamUsername: true } } },
    });
    if (!affiliate || affiliate.userId === userId) {
      return { replaced: false, affiliateName: '' };
    }

    return this.switchUserToAffiliate(userId, affiliate);
  }
  
  /**
   * Calcule et enregistre les commissions pour un trade validé (statut AVAILABLE+).
   * Crédite automatiquement balanceCents de l'affilié (EUR) au moment de l'attribution.
   */
  static async calculateCommissionForTrade(
    tradeId: string,
    options?: { skipHoldCheck?: boolean }
  ): Promise<void> {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        user: {
          select: {
            id: true,
            referredByAffiliateId: true,
          },
        },
      },
    });

    if (!trade) return;

    if (!isTradeEligibleForAffiliateCommission(trade.status)) {
      return;
    }

    if (
      !options?.skipHoldCheck &&
      !isAffiliateCommissionHoldComplete(trade)
    ) {
      return;
    }

    const existingCommission = await prisma.affiliateCommission.findUnique({
      where: { tradeId: trade.id },
      include: { affiliate: { select: { userId: true } } },
    });

    if (existingCommission) {
      if (existingCommission.balanceCreditedAt) {
        if (!trade.affiliateCommissionProcessedAt) {
          await prisma.trade.update({
            where: { id: tradeId },
            data: { affiliateCommissionProcessedAt: new Date() },
          });
        }
        return;
      }
      await this.creditExistingCommissionToBalance(existingCommission, trade);
      await prisma.trade.update({
        where: { id: tradeId },
        data: { affiliateCommissionProcessedAt: new Date() },
      });
      return;
    }

    if (trade.affiliateCommissionProcessedAt) {
      return;
    }

    const affiliate = await this.resolveAffiliateForTrade(
      trade.affiliatePromoCode,
      trade.user.referredByAffiliateId,
      trade.user.id
    );
    if (!affiliate) return;

    const rewardFlags = await getUserRewardFlags(trade.userId);
    if (isAffiliateRewardsBlocked(rewardFlags)) {
      console.warn(
        `[AffiliateService] Skipping commission for trade ${tradeId} — affiliate rewards blocked for user ${trade.userId}`
      );
      await prisma.trade.update({
        where: { id: tradeId },
        data: { affiliateCommissionProcessedAt: new Date() },
      });
      return;
    }

    const commissionUsdCents = computeAffiliateCommissionCents(
      trade.grossCents,
      affiliate.commissionRate
    );
    if (commissionUsdCents <= 0) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: { affiliateCommissionProcessedAt: new Date() },
      });
      return;
    }

    const commissionEurCents = await this.resolveCommissionEurCents(
      trade.grossCents,
      affiliate.commissionRate,
      trade.usdToEurRate
    );
    if (commissionEurCents <= 0) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: { affiliateCommissionProcessedAt: new Date() },
      });
      return;
    }

    const lock = await prisma.trade.updateMany({
      where: { id: tradeId, affiliateCommissionProcessedAt: null },
      data: { affiliateCommissionProcessedAt: new Date() },
    });
    if (lock.count === 0) return;

    let referral = await prisma.affiliateReferral.findFirst({
      where: {
        affiliateId: affiliate.id,
        referredUserId: trade.userId,
      },
    });

    if (!referral) {
      referral = await prisma.affiliateReferral.create({
        data: {
          affiliateId: affiliate.id,
          referredUserId: trade.userId,
          volumeCents: 0,
          commissionCents: 0,
        },
      });
      await prisma.affiliateStats.update({
        where: { id: affiliate.id },
        data: { totalReferrals: { increment: 1 } },
      });
    }

    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: {
        tradeId: trade.id,
        volumeCents: { increment: trade.grossCents },
        commissionCents: { increment: commissionEurCents },
      },
    });

    const commission = await prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral.id,
        tradeId: trade.id,
        affiliateCode: affiliate.code,
        commissionRate: affiliate.commissionRate,
        amountCents: commissionEurCents,
        status: 'PENDING',
      },
    });

    await prisma.affiliateStats.update({
      where: { id: affiliate.id },
      data: {
        totalVolumeCents: { increment: trade.grossCents },
        totalCommissionCents: { increment: commissionEurCents },
      },
    });

    await this.creditCommissionToBalance(
      commission.id,
      affiliate.userId,
      commissionEurCents,
      tradeId
    );
  }

  private static async resolveCommissionEurCents(
    grossUsdCents: number,
    commissionRate: number,
    usdToEurRate: number | null
  ): Promise<number> {
    const rate = usdToEurRate ?? (await currencyConverter.getUsdToEurRate());
    return computeAffiliateCommissionEurCents(grossUsdCents, commissionRate, rate);
  }

  private static async creditExistingCommissionToBalance(
    commission: {
      id: string;
      affiliateId: string;
      amountCents: number;
      affiliate: { userId: string };
    },
    trade: { id: string; grossCents: number; usdToEurRate: number | null; affiliatePromoCode: string | null }
  ): Promise<void> {
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { id: commission.affiliateId },
    });
    if (!affiliate) return;

    const commissionEurCents = await this.resolveCommissionEurCents(
      trade.grossCents,
      affiliate.commissionRate,
      trade.usdToEurRate
    );
    const amountToCredit = commissionEurCents > 0 ? commissionEurCents : commission.amountCents;

    await this.creditCommissionToBalance(
      commission.id,
      commission.affiliate.userId,
      amountToCredit,
      trade.id
    );
  }

  private static async creditCommissionToBalance(
    commissionId: string,
    affiliateUserId: string,
    amountCents: number,
    tradeId: string
  ): Promise<void> {
    const lock = await prisma.affiliateCommission.updateMany({
      where: { id: commissionId, balanceCreditedAt: null },
      data: { balanceCreditedAt: new Date() },
    });
    if (lock.count === 0) return;

    try {
      await creditBalance(
        affiliateUserId,
        amountCents,
        `Affiliate commission — trade ${tradeId}`,
        {
          type: 'AFFILIATE_COMMISSION',
          tradeId,
          commissionId,
        }
      );

      await prisma.affiliateCommission.update({
        where: { id: commissionId },
        data: {
          status: 'CREDITED',
          amountCents,
        },
      });
    } catch (err) {
      await prisma.affiliateCommission.update({
        where: { id: commissionId },
        data: { balanceCreditedAt: null },
      });
      throw err;
    }
  }

  /**
   * Annule une commission (admin fraude) — débite le solde si déjà créditée.
   */
  static async cancelCommissionById(commissionId: string): Promise<void> {
    const commission = await prisma.affiliateCommission.findUnique({
      where: { id: commissionId },
      include: { affiliate: { select: { userId: true } } },
    });
    if (!commission || commission.status === 'CANCELLED') return;

    const trade = commission.tradeId
      ? await prisma.trade.findUnique({ where: { id: commission.tradeId } })
      : null;

    if (commission.balanceCreditedAt) {
      await forceDebitBalance(
        commission.affiliate.userId,
        commission.amountCents,
        `Affiliate commission reversed — commission ${commissionId} cancelled`,
        {
          type: 'AFFILIATE_COMMISSION',
          commissionId: commission.id,
          tradeId: commission.tradeId ?? undefined,
          reversal: true,
        }
      );
    }

    await prisma.affiliateCommission.update({
      where: { id: commissionId },
      data: { status: 'CANCELLED' },
    });

    if (commission.referralId && trade) {
      await prisma.affiliateReferral.update({
        where: { id: commission.referralId },
        data: {
          volumeCents: { decrement: trade.grossCents },
          commissionCents: { decrement: commission.amountCents },
        },
      });
    }

    if (trade) {
      await prisma.affiliateStats.update({
        where: { id: commission.affiliateId },
        data: {
          totalVolumeCents: { decrement: trade.grossCents },
          totalCommissionCents: { decrement: commission.amountCents },
        },
      });
    }
  }

  /**
   * Annule les commissions liées à un trade annulé / rollback.
   * Débite balanceCents si la commission avait déjà été créditée.
   */
  static async cancelCommissionsForTrade(tradeId: string): Promise<void> {
    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade) return;

    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        tradeId,
        status: { in: ['PENDING', 'PAYOUT_REQUESTED', 'APPROVED', 'CREDITED', 'PAID'] },
      },
      include: { affiliate: { select: { userId: true } } },
    });

    if (commissions.length === 0) return;

    for (const commission of commissions) {
      if (commission.balanceCreditedAt) {
        await forceDebitBalance(
          commission.affiliate.userId,
          commission.amountCents,
          `Affiliate commission reversed — trade ${tradeId} cancelled`,
          {
            type: 'AFFILIATE_COMMISSION',
            tradeId,
            commissionId: commission.id,
            reversal: true,
          }
        );
      }

      await prisma.affiliateCommission.update({
        where: { id: commission.id },
        data: { status: 'CANCELLED' },
      });

      if (commission.referralId) {
        await prisma.affiliateReferral.update({
          where: { id: commission.referralId },
          data: {
            volumeCents: { decrement: trade.grossCents },
            commissionCents: { decrement: commission.amountCents },
          },
        });
      }

      await prisma.affiliateStats.update({
        where: { id: commission.affiliateId },
        data: {
          totalVolumeCents: { decrement: trade.grossCents },
          totalCommissionCents: { decrement: commission.amountCents },
        },
      });
    }
  }

  private static async resolveAffiliateForTrade(
    affiliatePromoCode: string | null,
    referredByAffiliateId: string | null,
    sellerUserId: string
  ) {
    if (affiliatePromoCode) {
      const fromPromo = await this.findActiveAffiliateByCode(affiliatePromoCode);
      if (fromPromo && fromPromo.userId !== sellerUserId) {
        return fromPromo;
      }
    }

    if (referredByAffiliateId) {
      const fromReferral = await prisma.affiliateStats.findUnique({
        where: { id: referredByAffiliateId, isActive: true },
      });
      if (fromReferral && fromReferral.userId !== sellerUserId) {
        return fromReferral;
      }
    }

    return null;
  }
  
  /**
   * Récupère les statistiques d'un affilié
   */
  static async getAffiliateStats(userId: string): Promise<AffiliateStats | null> {
    const stats = await prisma.affiliateStats.findUnique({
      where: { userId },
      include: {
        referrals: {
          where: { isActive: true },
          include: {
            referredUser: {
              select: {
                id: true,
                steamUsername: true,
                steamAvatar: true,
                createdAt: true
              }
            },
            trade: {
              select: {
                id: true,
                grossCents: true,
                createdAt: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        commissions: {
          include: {
            payout: {
              select: {
                id: true,
                status: true,
                paidAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return stats as any;
  }
  
  /**
   * Récupère les commissions créditées sur le solde d'un affilié.
   */
  static async getCreditedCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId,
        status: 'CREDITED',
      },
      include: {
        referral: {
          include: {
            referredUser: {
              select: {
                steamUsername: true,
                steamAvatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return commissions as any;
  }

  /**
   * @deprecated Les commissions sont créditées automatiquement sur balanceCents.
   */
  static async requestCommissionPayout(_affiliateId: string, _commissionIds: string[]): Promise<void> {
    throw new Error('Commission payout requests are no longer supported — withdraw via your balance');
  }

  /**
   * @deprecated Les commissions sont créditées automatiquement sur balanceCents.
   */
  static async approveCommissions(_affiliateId: string, _commissionIds: string[]): Promise<void> {
    throw new Error('Manual commission approval is no longer supported');
  }
  
  /**
   * Génère un lien d'affiliation
   * 
   * SÉCURITÉ: Valide que le path est relatif pour éviter les open redirects.
   * Bloque les URLs absolues qui pointeraient vers des domaines externes.
   */
  static generateAffiliateLink(code: string, path: string = ''): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.fr';
    
    // SÉCURITÉ: Valider que path est relatif (commence par / ou est vide)
    // Bloquer les URLs absolues (http://, https://, //, etc.)
    const trimmedPath = path.trim();
    if (trimmedPath && !trimmedPath.startsWith('/')) {
      // Path ne commence pas par / → considéré comme invalide
      throw new Error('Invalid path: must be relative (start with /)');
    }
    
    // Bloquer les tentatives de protocol-relative URLs (//)
    if (trimmedPath.startsWith('//')) {
      throw new Error('Invalid path: protocol-relative URLs not allowed');
    }
    
    const url = new URL(trimmedPath || '/', baseUrl);
    url.searchParams.set('ref', code);
    return url.toString();
  }
  
  /**
   * Récupère le top des affiliés (pour l'admin)
   */
  static async getTopAffiliates(limit: number = 10): Promise<AffiliateStats[]> {
    const affiliates = await prisma.affiliateStats.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            steamUsername: true,
            steamAvatar: true,
            createdAt: true
          }
        }
      },
      orderBy: { totalCommissionCents: 'desc' },
      take: limit
    });
    
    return affiliates as any;
  }
}