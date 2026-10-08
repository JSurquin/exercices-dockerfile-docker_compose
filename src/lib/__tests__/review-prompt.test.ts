import { shouldAskForReview, REVIEW_PROMPT_COOLDOWN_MS } from '@/lib/review-prompt';

const eligibleUser = {
  reviewPromptSeenAt: null,
  reviewPromptAction: null,
  completedWithdrawals: 0,
};

describe('shouldAskForReview', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');

  it('refuse si l’utilisateur a déjà cliqué vers Trustpilot', () => {
    expect(
      shouldAskForReview(
        { ...eligibleUser, reviewPromptAction: 'clicked', completedWithdrawals: 3 },
        { type: 'withdrawal', amount: 5000 },
        now,
      ),
    ).toBe(false);
  });

  it('refuse si le bandeau a déjà été vu il y a moins de 90 jours', () => {
    const seenAt = new Date(now.getTime() - REVIEW_PROMPT_COOLDOWN_MS + 24 * 60 * 60 * 1000);
    expect(
      shouldAskForReview(
        { ...eligibleUser, reviewPromptSeenAt: seenAt, reviewPromptAction: 'dismissed' },
        { type: 'withdrawal', amount: 5000 },
        now,
      ),
    ).toBe(false);
  });

  it('accepte un retrait dès que l’utilisateur n’est pas bloqué par le cooldown', () => {
    expect(
      shouldAskForReview(eligibleUser, { type: 'withdrawal', amount: 12_500 }, now),
    ).toBe(true);
  });

  it('accepte un dépôt seulement si l’utilisateur a déjà cash-out au moins une fois', () => {
    expect(
      shouldAskForReview(
        { ...eligibleUser, completedWithdrawals: 1 },
        { type: 'deposit' },
        now,
      ),
    ).toBe(true);
  });

  it('refuse un dépôt sans cash-out préalable (et tout autre cas)', () => {
    expect(shouldAskForReview(eligibleUser, { type: 'deposit' }, now)).toBe(false);
  });
});
