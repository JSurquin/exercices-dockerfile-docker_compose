import { NextResponse } from 'next/server';
import type { PayoutStatus, TradeStatus } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import {
  PAID_PAYOUT_STATUSES,
  shouldAskForReview,
  type ReviewPromptAction,
  type ReviewPromptEvent,
  type ReviewPromptTrigger,
} from '@/lib/review-prompt-shared';

export {
  TRUSTPILOT_EVALUATE_URL,
  REVIEW_PROMPT_ACTIONS,
  REVIEW_PROMPT_TRIGGERS,
  PAID_PAYOUT_STATUSES,
  isPaidPayoutStatus,
  isReviewPromptAction,
  isReviewPromptTrigger,
  shouldAskForReview,
} from '@/lib/review-prompt-shared';

export type {
  ReviewPromptAction,
  ReviewPromptTrigger,
  ReviewPromptEvent,
  ReviewPromptUser,
  PaidPayoutStatus,
} from '@/lib/review-prompt-shared';

export type ReviewPromptResolveResult = {
  askReview: boolean;
  amountCents: number | null;
};

const PAID_PAYOUT_STATUS_LIST: PayoutStatus[] = [...PAID_PAYOUT_STATUSES];

const DEPOSIT_REVIEW_STATUSES = new Set<TradeStatus>([
  'IN_TRADE_HOLD',
  'AVAILABLE',
  'PAID',
  'PAYOUT_PENDING',
]);

export function shouldEvaluateDepositReview(status: string): boolean {
  return DEPOSIT_REVIEW_STATUSES.has(status as TradeStatus);
}

function netPaidAmountCents(payout: {
  amountCents: number;
  processingFeeCents: number | null;
  networkFeeCents: number | null;
}): number {
  return Math.max(
    0,
    payout.amountCents - (payout.processingFeeCents ?? 0) - (payout.networkFeeCents ?? 0),
  );
}

export async function countCompletedWithdrawals(userId: string): Promise<number> {
  return prisma.payout.count({
    where: {
      userId,
      status: { in: PAID_PAYOUT_STATUS_LIST },
    },
  });
}

async function findLatestPaidPayout(userId: string) {
  return prisma.payout.findFirst({
    where: {
      userId,
      status: { in: PAID_PAYOUT_STATUS_LIST },
    },
    orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }],
    select: {
      amountCents: true,
      processingFeeCents: true,
      networkFeeCents: true,
      paidAt: true,
      updatedAt: true,
    },
  });
}

function payoutMoment(payout: { paidAt: Date | null; updatedAt: Date }): Date {
  return payout.paidAt ?? payout.updatedAt;
}

/**
 * Calcule l'éligibilité puis marque l'affichage en base (seenAt)
 * pour ne pas redemander le même payout sur un autre appareil.
 * Un nouveau retrait payé relance la demande, sauf si l’avis a déjà été cliqué.
 * Toute erreur (colonnes absentes, user introuvable, DB) → false.
 */
export async function resolveAndConsumeReviewPrompt(
  userId: string | null | undefined,
  event: ReviewPromptEvent,
  now: Date = new Date(),
): Promise<ReviewPromptResolveResult> {
  const none: ReviewPromptResolveResult = { askReview: false, amountCents: null };
  try {
    if (!userId) {
      return none;
    }

    const [row, paidPayout] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          reviewPromptSeenAt: true,
          reviewPromptAction: true,
        },
      }),
      findLatestPaidPayout(userId),
    ]);

    if (!row) {
      return none;
    }

    const amountCents = paidPayout ? netPaidAmountCents(paidPayout) : null;
    const latestPaidAt = paidPayout ? payoutMoment(paidPayout) : null;

    if (
      !shouldAskForReview(
        {
          reviewPromptSeenAt: row.reviewPromptSeenAt,
          reviewPromptAction: row.reviewPromptAction,
          completedWithdrawals: paidPayout ? 1 : 0,
          latestPaidAt,
        },
        event,
        now,
      )
    ) {
      return none;
    }

    const updated = await prisma.user.updateMany({
      where: {
        id: userId,
        AND: [
          {
            OR: [{ reviewPromptAction: null }, { reviewPromptAction: { not: 'clicked' } }],
          },
          latestPaidAt
            ? {
                OR: [
                  { reviewPromptSeenAt: null },
                  { reviewPromptSeenAt: { lt: latestPaidAt } },
                ],
              }
            : { reviewPromptSeenAt: null },
        ],
      },
      data: {
        reviewPromptSeenAt: now,
        reviewPromptTrigger: event.type,
        reviewPromptAction: null,
      },
    });

    if (updated.count !== 1) {
      return none;
    }

    return { askReview: true, amountCents };
  } catch (error) {
    logger.error('Trustpilot review prompt resolution failed; skipping', error);
    return none;
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
    const result = await resolveAndConsumeReviewPrompt(userId, event);
    return result.askReview;
  } catch (error) {
    logger.error('Trustpilot review prompt call failed; askReview=false', error);
    return false;
  }
}

/**
 * Conservé sur les routes de création de retrait pour le champ API `askReview`.
 * Le bandeau n'est plus consommé ici : un SEPA (et le crypto) passe à PAID
 * plus tard, hors page. L'évaluation se fait au chargement de /dashboard et /payout.
 */
export async function jsonWithAskReview(
  _userId: string,
  _event: ReviewPromptEvent,
  body: object,
): Promise<NextResponse> {
  const record = body as Record<string, unknown>;
  return NextResponse.json({ ...record, askReview: false });
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
