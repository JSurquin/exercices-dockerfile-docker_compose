import { cookies } from 'next/headers';
import { prisma } from '../../prisma/prisma';
import { AffiliateStats, AffiliateReferral, AffiliateCommission } from '@/lib/types';
import { computeSellPromoBonusCents as computeSellPromoBonusCentsPure } from '@/lib/affiliate-sell-promo';
import { getUserRewardFlags, isAffiliateRewardsBlocked } from '@/lib/user-rewards-guard';

export {
  AFFILIATE_SELL_PROMO_FRAGMENTS,
  AFFILIATE_SELL_PROMO_GROSS_RATE,
  computeSellPromoBonusCents,
} from '@/lib/affiliate-sell-promo';

export class AffiliateService {
  static computeSellPromoBonusCents(grossCents: number): number {
    return computeSellPromoBonusCentsPure(grossCents);
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

    const codeNormalized = refCode.trim().toLowerCase();
    const affiliate = await prisma.affiliateStats.findFirst({
      where: { code: codeNormalized, isActive: true },
    });
    if (!affiliate) return;
    if (affiliate.userId === userId) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliateId: true },
    });
    if (!user) return;

    if (user.referredByAffiliateId) {
      if (user.referredByAffiliateId !== affiliate.id) {
        return;
      }
      const existingRef = await prisma.affiliateReferral.findFirst({
        where: { affiliateId: affiliate.id, referredUserId: userId },
      });
      if (!existingRef) {
        await prisma.affiliateReferral.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: userId,
            volumeCents: 0,
            commissionCents: 0,
          },
        });
        await prisma.affiliateStats.update({
          where: { id: affiliate.id },
          data: { totalReferrals: { increment: 1 } },
        });
      }
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { referredByAffiliateId: affiliate.id },
    });
    await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: userId,
        volumeCents: 0,
        commissionCents: 0,
      },
    });
    await prisma.affiliateStats.update({
      where: { id: affiliate.id },
      data: { totalReferrals: { increment: 1 } },
    });
  }

  /**
   * Valide un code promo affilié pour la page vente (même code que le lien affilié).
   */
  static async validateAffiliateSellPromoCode(
    userId: string,
    rawCode: string
  ): Promise<
    | { ok: true; affiliateId: string; code: string }
    | { ok: false; error: 'invalid' | 'self' | 'other_affiliate' }
  > {
    const code = rawCode.trim().toLowerCase();
    if (!code) return { ok: false, error: 'invalid' };

    const affiliate = await prisma.affiliateStats.findFirst({
      where: { code, isActive: true },
    });
    if (!affiliate) return { ok: false, error: 'invalid' };
    if (affiliate.userId === userId) return { ok: false, error: 'self' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliateId: true },
    });
    if (user?.referredByAffiliateId && user.referredByAffiliateId !== affiliate.id) {
      return { ok: false, error: 'other_affiliate' };
    }

    return { ok: true, affiliateId: affiliate.id, code: affiliate.code };
  }

  /**
   * Rattache l’utilisateur à l’affilié du code promo (idempotent).
   */
  static async bindUserToAffiliateForSellPromo(
    userId: string,
    affiliateId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredByAffiliateId: true },
    });
    if (!user) return;

    if (user.referredByAffiliateId === affiliateId) {
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
          },
        });
        await prisma.affiliateStats.update({
          where: { id: affiliateId },
          data: { totalReferrals: { increment: 1 } },
        });
      }
      return;
    }

    if (user.referredByAffiliateId) {
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { referredByAffiliateId: affiliateId },
    });
    await prisma.affiliateReferral.create({
      data: {
        affiliateId,
        referredUserId: userId,
        volumeCents: 0,
        commissionCents: 0,
      },
    });
    await prisma.affiliateStats.update({
      where: { id: affiliateId },
      data: { totalReferrals: { increment: 1 } },
    });
  }
  
  /**
   * Calcule et enregistre les commissions pour un trade
   */
  static async calculateCommissionForTrade(tradeId: string): Promise<void> {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        user: {
          include: {
            affiliateStats: true
          }
        }
      }
    });
    
    if (!trade || !trade.user.referredByAffiliateId) return;

    const rewardFlags = await getUserRewardFlags(trade.userId);
    if (isAffiliateRewardsBlocked(rewardFlags)) {
      console.warn(
        `[AffiliateService] Skipping commission for trade ${tradeId} — affiliate rewards blocked for user ${trade.userId}`
      );
      return;
    }
    
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { id: trade.user.referredByAffiliateId, isActive: true }
    });
    
    if (!affiliate) return;
    
    // Calculer la commission (sur le volume brut)
    const commissionCents = Math.floor(trade.grossCents * affiliate.commissionRate);
    
    // Mettre à jour la référence avec le volume et la commission
    const referral = await prisma.affiliateReferral.findFirst({
      where: {
        affiliateId: affiliate.id,
        referredUserId: trade.userId
      }
    });
    
    if (referral) {
      await prisma.affiliateReferral.update({
        where: { id: referral.id },
        data: {
          tradeId: trade.id,
          volumeCents: { increment: trade.grossCents },
          commissionCents: { increment: commissionCents }
        }
      });
      
      // Créer une commission
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliate.id,
          referralId: referral.id,
          amountCents: commissionCents,
          status: 'PENDING'
        }
      });
      
      // Mettre à jour les statistiques de l'affilié
      await prisma.affiliateStats.update({
        where: { id: affiliate.id },
        data: {
          totalVolumeCents: { increment: trade.grossCents },
          totalCommissionCents: { increment: commissionCents }
        }
      });
    }
  }
  
  /**
   * Récupère les statistiques d'un affilié
   */
  static async getAffiliateStats(userId: string): Promise<AffiliateStats | null> {
    const stats = await prisma.affiliateStats.findUnique({
      where: { userId },
      include: {
        referrals: {
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
   * Récupère les commissions en attente d'un affilié
   */
  static async getPendingCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
    const commissions = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId,
        status: 'PENDING'
      },
      include: {
        referral: {
          include: {
            referredUser: {
              select: {
                steamUsername: true,
                steamAvatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return commissions as any;
  }
  
  /**
   * L'affilié demande un payout — passe en PAYOUT_REQUESTED (pas APPROVED).
   * L'approbation réelle reste une action admin.
   */
  static async requestCommissionPayout(affiliateId: string, commissionIds: string[]): Promise<void> {
    await prisma.affiliateCommission.updateMany({
      where: {
        id: { in: commissionIds },
        affiliateId,
        status: 'PENDING',
      },
      data: {
        status: 'PAYOUT_REQUESTED',
      },
    });
  }

  /**
   * Approuve les commissions d'un affilié pour paiement (ADMIN ONLY)
   */
  static async approveCommissions(affiliateId: string, commissionIds: string[]): Promise<void> {
    await prisma.affiliateCommission.updateMany({
      where: {
        id: { in: commissionIds },
        affiliateId,
        status: { in: ['PENDING', 'PAYOUT_REQUESTED'] },
      },
      data: {
        status: 'APPROVED',
      },
    });
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