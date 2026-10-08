jest.mock('~/prisma/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    payout: {
      count: jest.fn(),
      findFirst: jest.fn(),
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
  PAID_PAYOUT_STATUSES,
  isPaidPayoutStatus,
  resolveAndConsumeReviewPrompt,
  jsonWithAskReview,
  jsonWithDepositAskReview,
  recordReviewPromptAction,
} from '@/lib/review-prompt';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdateMany = prisma.user.updateMany as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockPayoutCount = prisma.payout.count as jest.Mock;
const mockPayoutFindFirst = prisma.payout.findFirst as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const eligibleUser = {
  reviewPromptSeenAt: null,
  reviewPromptAction: null,
  completedWithdrawals: 1,
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

  it('refuse si déjà montré pour ce même retrait payé', () => {
    const paidAt = new Date('2026-09-01T12:00:00.000Z');
    const seenAt = new Date('2026-09-01T12:05:00.000Z');
    expect(
      shouldAskForReview(
        {
          ...eligibleUser,
          reviewPromptSeenAt: seenAt,
          reviewPromptAction: 'dismissed',
          latestPaidAt: paidAt,
        },
        { type: 'withdrawal', amount: 5000 },
        now,
      ),
    ).toBe(false);
  });

  it('accepte un nouveau retrait payé même après un « Plus tard »', () => {
    const seenAt = new Date('2026-09-01T12:00:00.000Z');
    const latestPaidAt = new Date('2026-10-01T12:00:00.000Z');
    expect(
      shouldAskForReview(
        {
          ...eligibleUser,
          reviewPromptSeenAt: seenAt,
          reviewPromptAction: 'dismissed',
          latestPaidAt,
        },
        { type: 'withdrawal', amount: 5000 },
        now,
      ),
    ).toBe(true);
  });

  it('refuse un nouveau retrait si l’utilisateur a déjà cliqué vers Trustpilot', () => {
    expect(
      shouldAskForReview(
        {
          ...eligibleUser,
          reviewPromptAction: 'clicked',
          latestPaidAt: now,
          completedWithdrawals: 4,
        },
        { type: 'withdrawal', amount: 5000 },
        now,
      ),
    ).toBe(false);
  });

  it('aligne les statuts payés sur PAID / FLEXIFY_PAID / WHITEPAY_COMPLETE, jamais completed', () => {
    expect([...PAID_PAYOUT_STATUSES]).toEqual(['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE']);
    expect(isPaidPayoutStatus('PAID')).toBe(true);
    expect(isPaidPayoutStatus('FLEXIFY_PAID')).toBe(true);
    expect(isPaidPayoutStatus('WHITEPAY_COMPLETE')).toBe(true);
    expect(isPaidPayoutStatus('completed')).toBe(false);
    expect(isPaidPayoutStatus('COMPLETED')).toBe(false);
    expect(isPaidPayoutStatus('PROCESSING')).toBe(false);
  });

  it('accepte un retrait dès qu’au moins un payout est payé', () => {
    expect(
      shouldAskForReview(eligibleUser, { type: 'withdrawal', amount: 12_500 }, now),
    ).toBe(true);
  });

  it('refuse un retrait s’il n’y a aucun payout au statut payé', () => {
    expect(
      shouldAskForReview(
        { ...eligibleUser, completedWithdrawals: 0 },
        { type: 'withdrawal', amount: 12_500 },
        now,
      ),
    ).toBe(false);
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
    expect(
      shouldAskForReview({ ...eligibleUser, completedWithdrawals: 0 }, { type: 'deposit' }, now),
    ).toBe(false);
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
  const none = { askReview: false, amountCents: null };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPayoutCount.mockResolvedValue(0);
    mockPayoutFindFirst.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue({
      reviewPromptSeenAt: null,
      reviewPromptAction: null,
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockUpdate.mockResolvedValue({ id: 'u1' });
  });

  it('retourne false sans lever si userId est absent', async () => {
    await expect(resolveAndConsumeReviewPrompt(null, { type: 'withdrawal' })).resolves.toEqual(
      none,
    );
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('retourne false et log si les colonnes avis sont absentes en base', async () => {
    mockFindUnique.mockRejectedValue(missingColumnError);

    await expect(
      resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' }),
    ).resolves.toEqual(none);
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('consomme le bandeau seulement si un retrait est réellement payé (PAID)', async () => {
    mockPayoutFindFirst.mockResolvedValue({
      amountCents: 10_000,
      processingFeeCents: 50,
      networkFeeCents: 0,
      paidAt: new Date('2026-10-08T10:00:00.000Z'),
      updatedAt: new Date('2026-10-08T10:00:00.000Z'),
    });

    await expect(resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' })).resolves.toEqual({
      askReview: true,
      amountCents: 9950,
    });
    expect(mockPayoutFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u1',
          status: { in: ['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE'] },
        },
      }),
    );
    expect(mockUpdateMany).toHaveBeenCalled();
    const updateArg = mockUpdateMany.mock.calls[0][0] as {
      where: { AND: unknown[] };
    };
    expect(JSON.stringify(updateArg.where)).not.toContain('lte');
  });

  it('ne consomme pas s’il n’y a aucun payout PAID / FLEXIFY_PAID / WHITEPAY_COMPLETE', async () => {
    await expect(resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' })).resolves.toEqual(
      none,
    );
    expect(mockUpdateMany).not.toHaveBeenCalled();
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

  it('redemande après un nouveau payout payé si l’action précédente était dismissed', async () => {
    const previousSeenAt = new Date('2026-09-01T12:00:00.000Z');
    const newPaidAt = new Date('2026-10-08T10:00:00.000Z');
    mockFindUnique.mockResolvedValue({
      reviewPromptSeenAt: previousSeenAt,
      reviewPromptAction: 'dismissed',
    });
    mockPayoutFindFirst.mockResolvedValue({
      amountCents: 8000,
      processingFeeCents: 0,
      networkFeeCents: 0,
      paidAt: newPaidAt,
      updatedAt: newPaidAt,
    });

    await expect(resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' })).resolves.toEqual({
      askReview: true,
      amountCents: 8000,
    });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'u1',
        }),
      }),
    );
  });

  it('ne redemande pas le même payout après un « Plus tard »', async () => {
    const paidAt = new Date('2026-09-01T12:00:00.000Z');
    mockFindUnique.mockResolvedValue({
      reviewPromptSeenAt: new Date('2026-09-01T12:05:00.000Z'),
      reviewPromptAction: 'dismissed',
    });
    mockPayoutFindFirst.mockResolvedValue({
      amountCents: 8000,
      processingFeeCents: 0,
      networkFeeCents: 0,
      paidAt,
      updatedAt: paidAt,
    });

    await expect(resolveAndConsumeReviewPrompt('u1', { type: 'withdrawal' })).resolves.toEqual(
      none,
    );
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it('ne consomme plus le bandeau à la création du retrait (SEPA payé plus tard)', async () => {
    mockPayoutFindFirst.mockResolvedValue({
      amountCents: 5000,
      processingFeeCents: 0,
      networkFeeCents: 0,
      paidAt: new Date('2026-10-08T10:00:00.000Z'),
      updatedAt: new Date('2026-10-08T10:00:00.000Z'),
    });

    const res = await jsonWithAskReview('u1', { type: 'withdrawal', amount: 5000 }, {
      success: true,
      payout: { id: 'p1', status: 'PROCESSING' },
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      payout: { id: 'p1', status: 'PROCESSING' },
      askReview: false,
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it('recordReviewPromptAction n’explose pas si la colonne manque', async () => {
    mockUpdate.mockRejectedValue(missingColumnError);
    await expect(
      recordReviewPromptAction('u1', 'clicked', 'withdrawal'),
    ).resolves.toBeUndefined();
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
