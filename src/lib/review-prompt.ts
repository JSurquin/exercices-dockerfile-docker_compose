import { NextResponse } from 'next/server';
import type { PayoutStatus, TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';

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
  reviewPromptSeenAt: Date | string | null;
  reviewPromptAction: string | null;
  completedWithdrawals: number;
};

const COMPLETED_PAYOUT_STATUSES: PayoutStatus[] = [
  'PAID',
  'FLEXIFY_PAID',
  'WHITEPAY_COMPLETE',
];

const DEPOSIT_REVIEW_STATUSES = new Set<TradeStatus>([
  'IN_TRADE_HOLD',
  'AVAILABLE',
  'PAID',
  'PAYOUT_PENDING',
]);

export function isReviewPromptAction(value: unknown): value is ReviewPromptAction {
  return value === 'clicked' || value === 'dismissed';
}

export function isReviewPromptTrigger(value: unknown): value is ReviewPromptTrigger {
  return value === 'withdrawal' || value === 'deposit';
}

export function shouldEvaluateDepositReview(status: string): boolean {
  return DEPOSIT_REVIEW_STATUSES.has(status as TradeStatus);
}

/**
 * Éligibilité Trustpilot — calculée uniquement côté serveur.
 * Ne filtre jamais selon la satisfaction (pas de note interne).
 */
export function shouldAskForReview(
  user: ReviewPromptUser,
  event: ReviewPromptEvent,
  now: Date = new Date(),
): boolean {
  if (user.reviewPromptAction === 'clicked') {
    return false;
  }

  if (user.reviewPromptSeenAt) {
    const seenAt = new Date(user.reviewPromptSeenAt);
    if (now.getTime() - seenAt.getTime() < REVIEW_PROMPT_COOLDOWN_MS) {
      return false;
    }
  }

  if (event.type === 'withdrawal') {
    return true;
  }

  if (event.type === 'deposit') {
    return user.completedWithdrawals > 0;
  }

  return false;
}

export async function countCompletedWithdrawals(userId: string): Promise<number> {
  return prisma.payout.count({
    where: {
      userId,
      status: { in: COMPLETED_PAYOUT_STATUSES },
    },
  });
}

/**
 * Calcule l'éligibilité puis marque l'affichage en base (seenAt)
 * pour qu'il ne se reproduise pas sur un autre appareil pendant 90 jours.
 */
export async function resolveAndConsumeReviewPrompt(
  userId: string,
  event: ReviewPromptEvent,
  now: Date = new Date(),
): Promise<boolean> {
  const [row, completedWithdrawals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        reviewPromptSeenAt: true,
        reviewPromptAction: true,
      },
    }),
    countCompletedWithdrawals(userId),
  ]);

  if (!row) {
    return false;
  }

  if (
    !shouldAskForReview(
      {
        reviewPromptSeenAt: row.reviewPromptSeenAt,
        reviewPromptAction: row.reviewPromptAction,
        completedWithdrawals,
      },
      event,
      now,
    )
  ) {
    return false;
  }

  const cooldownAgo = new Date(now.getTime() - REVIEW_PROMPT_COOLDOWN_MS);

  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      AND: [
        {
          OR: [{ reviewPromptAction: null }, { reviewPromptAction: { not: 'clicked' } }],
        },
        {
          OR: [{ reviewPromptSeenAt: null }, { reviewPromptSeenAt: { lte: cooldownAgo } }],
        },
      ],
    },
    data: {
      reviewPromptSeenAt: now,
      reviewPromptTrigger: event.type,
      reviewPromptAction: null,
    },
  });

  return updated.count === 1;
}

export async function recordReviewPromptAction(
  userId: string,
  action: ReviewPromptAction,
  trigger: ReviewPromptTrigger,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      reviewPromptSeenAt: new Date(),
      reviewPromptAction: action,
      reviewPromptTrigger: trigger,
    },
  });
}

export async function jsonWithAskReview(
  userId: string,
  event: ReviewPromptEvent,
  body: object,
): Promise<NextResponse> {
  const record = body as Record<string, unknown>;
  const skip = record.pendingApproval === true;
  const askReview = skip ? false : await resolveAndConsumeReviewPrompt(userId, event);
  return NextResponse.json({ ...record, askReview });
}

export async function jsonWithDepositAskReview(
  userId: string,
  tradeStatus: string,
  body: object,
  enabled = true,
): Promise<NextResponse> {
  const askReview =
    enabled && shouldEvaluateDepositReview(tradeStatus)
      ? await resolveAndConsumeReviewPrompt(userId, { type: 'deposit' })
      : false;
  return NextResponse.json({ ...body, askReview });
}
