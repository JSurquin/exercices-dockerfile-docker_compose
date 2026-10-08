export const TRUSTPILOT_EVALUATE_URL = 'https://www.trustpilot.com/evaluate/moonskin.eu';

export const REVIEW_PROMPT_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export const REVIEW_PROMPT_ACTIONS = ['clicked', 'dismissed'] as const;
export const REVIEW_PROMPT_TRIGGERS = ['withdrawal', 'deposit'] as const;

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
};

export function isReviewPromptAction(value: unknown): value is ReviewPromptAction {
  return value === 'clicked' || value === 'dismissed';
}

export function isReviewPromptTrigger(value: unknown): value is ReviewPromptTrigger {
  return value === 'withdrawal' || value === 'deposit';
}

/**
 * Éligibilité Trustpilot — calculée uniquement côté serveur.
 * Ne filtre jamais selon la satisfaction (pas de note interne).
 * Ne lève jamais : visiteur absent, champs manquants ou donnée invalide → false.
 */
export function shouldAskForReview(
  user: ReviewPromptUser | null | undefined,
  event?: ReviewPromptEvent | null,
  now: Date = new Date(),
): boolean {
  try {
    if (!user || !event) {
      return false;
    }

    if (user.reviewPromptAction === 'clicked') {
      return false;
    }

    if (user.reviewPromptSeenAt) {
      const seenAt = new Date(user.reviewPromptSeenAt);
      const seenMs = seenAt.getTime();
      if (Number.isFinite(seenMs) && now.getTime() - seenMs < REVIEW_PROMPT_COOLDOWN_MS) {
        return false;
      }
    }

    if (event.type === 'withdrawal') {
      return true;
    }

    if (event.type === 'deposit') {
      return (user.completedWithdrawals ?? 0) > 0;
    }

    return false;
  } catch {
    return false;
  }
}
