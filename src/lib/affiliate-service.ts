import { cookies } from 'next/headers';
import { prisma } from '@/prisma/prisma';
import { AffiliateStats, AffiliateReferral, AffiliateCommission } from '@/lib/types';

export class AffiliateService {
  /**
   * Génère un code d'affiliation unique pour un utilisateur
   */
  static async generateAffiliateCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, steamId: true }
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Générer un code basé sur le nom d'utilisateur Steam ou l'ID
    let baseCode = user.steamUsername?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
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
    
    return affiliateStats as AffiliateStats;
  }
  
  /**
   * Récupère le code d'affiliation depuis les cookies
   */
  static getAffiliateRefFromCookies(): string | null {
    const cookieStore = cookies();
    return cookieStore.get('ctf_affiliate_ref')?.value || null;
  }
  
  /**
   * Associe un utilisateur à un affilié lors de l'inscription
   */
  static async associateUserToAffiliate(userId: string, affiliateCode?: string): Promise<void> {
    const refCode = affiliateCode || this.getAffiliateRefFromCookies();
    
    if (!refCode) return;
    
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { code: refCode, isActive: true }
    });
    
    if (!affiliate) return;
    
    // Éviter l'auto-référencement
    if (affiliate.userId === userId) return;
    
    // Mettre à jour l'utilisateur avec la référence d'affilié
    await prisma.user.update({
      where: { id: userId },
      data: { referredByAffiliateId: affiliate.id }
    });
    
    // Créer un enregistrement de référence
    await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: userId,
        volumeCents: 0,
        commissionCents: 0
      }
    });
    
    // Mettre à jour les statistiques de l'affilié
    await prisma.affiliateStats.update({
      where: { id: affiliate.id },
      data: {
        totalReferrals: { increment: 1 }
      }
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
    
    return stats as AffiliateStats | null;
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
    
    return commissions as AffiliateCommission[];
  }
  
  /**
   * Approuve les commissions d'un affilié pour paiement
   */
  static async approveCommissions(affiliateId: string, commissionIds: string[]): Promise<void> {
    await prisma.affiliateCommission.updateMany({
      where: {
        id: { in: commissionIds },
        affiliateId,
        status: 'PENDING'
      },
      data: {
        status: 'APPROVED'
      }
    });
  }
  
  /**
   * Génère un lien d'affiliation
   */
  static generateAffiliateLink(code: string, path: string = ''): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cashtrade.fr';
    const url = new URL(path, baseUrl);
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
    
    return affiliates as AffiliateStats[];
  }
}