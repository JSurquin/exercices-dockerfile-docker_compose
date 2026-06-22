import type { BetterAuthPlugin } from 'better-auth';
import { AffiliateService } from '@/lib/affiliate-service';

/**
 * Rattache un filleul à son parrain dès la création de session (login Discord, email, etc.).
 * Le callback Steam appelle aussi associateUserToAffiliate (idempotent).
 */
export function affiliateAttachPlugin(): BetterAuthPlugin {
  return {
    id: 'affiliate-attach',
    init() {
      return {
        options: {
          databaseHooks: {
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
