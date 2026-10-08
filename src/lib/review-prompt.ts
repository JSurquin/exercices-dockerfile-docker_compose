import { NextResponse } from 'next/server';
import type { PayoutStatus, TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  REVIEW_PROMPT_COOLDOWN_MS,
  shouldAskForReview,
  type ReviewPromptAction,
  type ReviewPromptEvent,
  type ReviewPromptTrigger,
} from '@/lib/review-prompt-shared';

export {
  TRUSTPILOT_EVALUATE_URL,
  REVIEW_PROMPT_COOLDOWN_MS,
  REVIEW_PROMPT_ACTIONS,
  REVIEW_PROMPT_TRIGGERS,
  isReviewPromptAction,
  isReviewPromptTrigger,
  shouldAskForReview,
} from '@/lib/review-prompt-shared';

export type {
  ReviewPromptAction,
  ReviewPromptTrigger,
  ReviewPromptEvent,
  ReviewPromptUser,
} from '@/lib/review-prompt-shared';

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

export function shouldEvaluateDepositReview(status: string): boolean {
  return DEPOSIT_REVIEW_STATUSES.has(status as TradeStatus);
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
 * Toute erreur (colonnes absentes, user introuvable, DB) → false.
 */
export async function resolveAndConsumeReviewPrompt(
  userId: string | null | undefined,
  event: ReviewPromptEvent,
  now: Date = new Date(),
): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

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
  } catch (error) {
    logger.error('Trustpilot review prompt resolution failed; skipping', error);
    return false;
  }
}

export async function recordReviewPromptAction(
  userId: string,
  action: ReviewPromptAction,
  trigger: ReviewPromptTrigger,
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        reviewPromptSeenAt: new Date(),
        reviewPromptAction: action,
        reviewPromptTrigger: trigger,
      },
    });
  } catch (error) {
    logger.error('Trustpilot review prompt action failed; ignoring', error);
  }
}

async function askReviewOrFalse(
  userId: string,
  event: ReviewPromptEvent,
): Promise<boolean> {
  try {
    return await resolveAndConsumeReviewPrompt(userId, event);
  } catch (error) {
    logger.error('Trustpilot review prompt call failed; askReview=false', error);
    return false;
  }
}

export async function jsonWithAskReview(
  userId: string,
  event: ReviewPromptEvent,
  body: object,
): Promise<NextResponse> {
  const record = body as Record<string, unknown>;
  try {
    const skip = record.pendingApproval === true;
    const askReview = skip ? false : await askReviewOrFalse(userId, event);
    return NextResponse.json({ ...record, askReview });
  } catch (error) {
    logger.error('Trustpilot review prompt call failed; askReview=false', error);
    return NextResponse.json({ ...record, askReview: false });
  }
}

export async function jsonWithDepositAskReview(
  userId: string,
  tradeStatus: string,
  body: object,
  enabled = true,
): Promise<NextResponse> {
  try {
    const askReview =
      enabled && shouldEvaluateDepositReview(tradeStatus)
        ? await askReviewOrFalse(userId, { type: 'deposit' })
        : false;
    return NextResponse.json({ ...body, askReview });
  } catch (error) {
    logger.error('Trustpilot deposit review prompt failed; askReview=false', error);
    return NextResponse.json({ ...body, askReview: false });
  }
}
