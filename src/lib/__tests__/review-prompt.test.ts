jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    payout: {
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  shouldAskForReview,
  REVIEW_PROMPT_COOLDOWN_MS,
  resolveAndConsumeReviewPrompt,
  jsonWithAskReview,
  jsonWithDepositAskReview,
  recordReviewPromptAction,
} from '@/lib/review-prompt';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdateMany = prisma.user.updateMany as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockPayoutCount = prisma.payout.count as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const eligibleUser = {
  reviewPromptSeenAt: null,
  reviewPromptAction: null,
  completedWithdrawals: 0,
};

const missingColumnError = Object.assign(
  new Error('The column `user.reviewPromptSeenAt` does not exist in the current database.'),
  { code: 'P2022' },
);

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

  it('retourne false si l’utilisateur est absent', () => {
    expect(shouldAskForReview(null, { type: 'withdrawal' }, now)).toBe(false);
    expect(shouldAskForReview(undefined, { type: 'deposit' }, now)).toBe(false);
  });

  it('retourne false si l’événement ou les champs nécessaires manquent', () => {
    expect(shouldAskForReview(eligibleUser, null, now)).toBe(false);
    expect(shouldAskForReview({}, { type: 'deposit' }, now)).toBe(false);
  });
});

describe('resolveAndConsumeReviewPrompt / jsonWithAskReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayoutCount.mockResolvedValue(0);
    mockFindUnique.mockResolvedValue({
      reviewPromptSeenAt: null,
      reviewPromptAction: null,
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockUpdate.mockResolvedValue({ id: 'u1' });
  });

  it('retourne false sans lever si userId est absent', async () => {
    await expect(resolveAndConsumeReviewPrompt(null, { type: 'withdrawal' })).resolves.toBe(
      false,
    );
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('retourne false et log si les colonnes avis sont absentes en base', async () => {
    mockFindUnique.mockRejectedValue(missingColumnError);

    await expect(
      resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' }),
    ).resolves.toBe(false);
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('jsonWithAskReview retombe sur askReview=false si Prisma lève', async () => {
    mockFindUnique.mockRejectedValue(missingColumnError);

    const res = await jsonWithAskReview('u1', { type: 'withdrawal', amount: 5000 }, {
      success: true,
      payout: { id: 'p1' },
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      payout: { id: 'p1' },
      askReview: false,
    });
  });

  it('jsonWithDepositAskReview retombe sur askReview=false si Prisma lève', async () => {
    mockFindUnique.mockRejectedValue(missingColumnError);

    const res = await jsonWithDepositAskReview(
      'u1',
      'IN_TRADE_HOLD',
      { success: true, trade: { id: 't1', status: 'IN_TRADE_HOLD' } },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      trade: { id: 't1', status: 'IN_TRADE_HOLD' },
      askReview: false,
    });
  });

  it('n’exige pas askReview dans le corps métier (pendingApproval saute le prompt)', async () => {
    const res = await jsonWithAskReview('u1', { type: 'withdrawal' }, {
      success: true,
      pendingApproval: true,
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      pendingApproval: true,
      askReview: false,
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('recordReviewPromptAction n’explose pas si la colonne manque', async () => {
    mockUpdate.mockRejectedValue(missingColumnError);
    await expect(
      recordReviewPromptAction('u1', 'clicked', 'withdrawal'),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
