import type { BetterAuthPlugin } from 'better-auth';
import { AffiliateService } from '@/lib/affiliate-service';

/**
 * Rattache un filleul à son parrain dès l'inscription (cookie ?ref=) et à chaque session.
 * Le callback Steam passe aussi le cookie explicitement (idempotent).
 */
export function affiliateAttachPlugin(): BetterAuthPlugin {
  return {
    id: 'affiliate-attach',
    init() {
      return {
        options: {
          databaseHooks: {
            user: {
              create: {
                async after(user: { id?: string }) {
                  if (!user?.id) return;
                  try {
                    await AffiliateService.associateUserToAffiliate(user.id);
                  } catch (err) {
                    console.error('[affiliate-attach] attach on signup failed:', err);
                  }
                },
              },
            },
            session: {
              create: {
                async after(session: { userId?: string }) {
                  if (!session?.userId) return;
                  try {
                    await AffiliateService.associateUserToAffiliate(session.userId);
                  } catch (err) {
                    console.error('[affiliate-attach] attach on login failed:', err);
                  }
                },
              },
            },
          },
        },
      };
    },
  };
}
