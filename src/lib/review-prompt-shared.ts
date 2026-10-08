export const TRUSTPILOT_EVALUATE_URL = 'https://www.trustpilot.com/evaluate/moonskin.eu';

export const REVIEW_PROMPT_ACTIONS = ['clicked', 'dismissed'] as const;
export const REVIEW_PROMPT_TRIGGERS = ['withdrawal', 'deposit'] as const;

/** Statuts internes « Payé » (historique). Jamais `completed`. */
export const PAID_PAYOUT_STATUSES = ['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE'] as const;

export type PaidPayoutStatus = (typeof PAID_PAYOUT_STATUSES)[number];

export function isPaidPayoutStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (PAID_PAYOUT_STATUSES as readonly string[]).includes(status);
}

export type ReviewPromptAction = (typeof REVIEW_PROMPT_ACTIONS)[number];
export type ReviewPromptTrigger = (typeof REVIEW_PROMPT_TRIGGERS)[number];

export type ReviewPromptEvent = {
  type: ReviewPromptTrigger;
  amount?: number;
};

export type ReviewPromptUser = {
  reviewPromptSeenAt?: Date | string | null;
  reviewPromptAction?: string | null;
  completedWithdrawals?: number;
  latestPaidAt?: Date | string | null;
};

export function isReviewPromptAction(value: unknown): value is ReviewPromptAction {
  return value === 'clicked' || value === 'dismissed';
}

export function isReviewPromptTrigger(value: unknown): value is ReviewPromptTrigger {
  return value === 'withdrawal' || value === 'deposit';
}

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Éligibilité Trustpilot — calculée uniquement côté serveur.
 * Ne filtre jamais selon la satisfaction (pas de note interne).
 * Ne lève jamais : visiteur absent, champs manquants ou donnée invalide → false.
 *
 * Affichage à chaque retrait payé, sauf si l’utilisateur a déjà cliqué vers Trustpilot.
 * Un « Plus tard » n’empêche pas de redemander au prochain payout payé.
 */
export function shouldAskForReview(
  user: ReviewPromptUser | null | undefined,
  event?: ReviewPromptEvent | null,
  _now: Date = new Date(),
): boolean {
  try {
    if (!user || !event) {
      return false;
    }

    if (user.reviewPromptAction === 'clicked') {
      return false;
    }

    if ((user.completedWithdrawals ?? 0) <= 0) {
      return false;
    }

    const seenMs = toMs(user.reviewPromptSeenAt);
    if (seenMs !== null) {
      const paidMs = toMs(user.latestPaidAt);
      if (paidMs === null || paidMs <= seenMs) {
        return false;
      }
    }

    return event.type === 'withdrawal' || event.type === 'deposit';
  } catch {
    return false;
  }
}
