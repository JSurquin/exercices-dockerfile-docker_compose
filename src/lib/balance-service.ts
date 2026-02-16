import { prisma } from '~/prisma/prisma';
import type { BalanceTransactionType, Prisma } from '@prisma/client';

/**
 * Service de gestion du solde utilisateur.
 * Tous les montants en centimes. Transactions DB obligatoires.
 */

export async function creditBalance(
  userId: string,
  amountCents: number,
  reason: string | null,
  metadata: { type: BalanceTransactionType; createdBy?: string; [key: string]: unknown } = { type: 'ADMIN_ADJUSTMENT' }
): Promise<{ balanceAfterCents: number }> {
  if (amountCents <= 0) {
    throw new Error('creditBalance: amountCents must be positive');
  }
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { balanceCents: true } });
    if (!user) throw new Error('User not found');
    const balanceAfterCents = user.balanceCents + amountCents;
    await tx.user.update({
      where: { id: userId },
      data: { balanceCents: balanceAfterCents },
    });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: metadata.type,
        amountCents,
        balanceAfterCents,
        reason,
        createdBy: metadata.createdBy ?? undefined,
        metadata: metadata ? (Object.keys(metadata).length > 1 ? (metadata as Prisma.InputJsonValue) : undefined) : undefined,
      },
    });
    return { balanceAfterCents };
  });
}

export async function debitBalance(
  userId: string,
  amountCents: number,
  reason: string | null,
  metadata: { type: BalanceTransactionType; createdBy?: string; [key: string]: unknown } = { type: 'WITHDRAWAL' }
): Promise<{ balanceAfterCents: number }> {
  if (amountCents <= 0) {
    throw new Error('debitBalance: amountCents must be positive');
  }
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { balanceCents: true } });
    if (!user) throw new Error('User not found');
    const balanceAfterCents = user.balanceCents - amountCents;
    if (balanceAfterCents < 0) {
      throw new Error('Insufficient balance');
    }
    await tx.user.update({
      where: { id: userId },
      data: { balanceCents: balanceAfterCents },
    });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: metadata.type,
        amountCents: -amountCents,
        balanceAfterCents,
        reason,
        createdBy: metadata.createdBy ?? undefined,
        metadata: metadata ? (Object.keys(metadata).length > 1 ? (metadata as Prisma.InputJsonValue) : undefined) : undefined,
      },
    });
    return { balanceAfterCents };
  });
}

export function getAvailableBalanceCents(balanceCents: number, frozenBalanceCents: number): number {
  return Math.max(0, balanceCents - frozenBalanceCents);
}

export async function getBalance(userId: string): Promise<{
  balanceCents: number;
  frozenBalanceCents: number;
  availableCents: number;
  accountFrozen: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceCents: true, frozenBalanceCents: true, accountFrozen: true },
  });
  if (!user) throw new Error('User not found');
  const availableCents = getAvailableBalanceCents(user.balanceCents, user.frozenBalanceCents);
  return {
    balanceCents: user.balanceCents,
    frozenBalanceCents: user.frozenBalanceCents,
    availableCents: user.accountFrozen ? 0 : availableCents,
    accountFrozen: user.accountFrozen,
  };
}

/** Montant déjà retiré ce mois (payouts payés) en centimes */
export async function getMonthlyWithdrawalUsedCents(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.payout.aggregate({
    where: {
      userId,
      status: { in: ['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE'] },
      paidAt: { gte: startOfMonth },
    },
    _sum: { amountCents: true },
  });
  return result._sum.amountCents ?? 0;
}

/** Plafond mensuel en centimes (null = pas de limite) */
export async function getMonthlyWithdrawalLimitCents(userId: string): Promise<number | null> {
  const limit = await prisma.withdrawalLimit.findUnique({
    where: { userId },
    select: { monthlyLimitCents: true },
  });
  return limit?.monthlyLimitCents ?? null;
}

export async function checkWithdrawalLimit(
  userId: string,
  amountCents: number
): Promise<{ allowed: boolean; usedCents: number; limitCents: number | null; reason?: string }> {
  const limitCents = await getMonthlyWithdrawalLimitCents(userId);
  if (limitCents == null) {
    return { allowed: true, usedCents: 0, limitCents: null };
  }
  const usedCents = await getMonthlyWithdrawalUsedCents(userId);
  const afterWithdrawal = usedCents + amountCents;
  if (afterWithdrawal > limitCents) {
    return {
      allowed: false,
      usedCents,
      limitCents,
      reason: `Plafond mensuel dépassé (utilisé: ${usedCents / 100}€, limite: ${limitCents / 100}€)`,
    };
  }
  return { allowed: true, usedCents, limitCents };
}

export async function getRecentBalanceTransactions(
  userId: string,
  limit = 50
): Promise<
  { id: string; type: string; amountCents: number; balanceAfterCents: number; reason: string | null; createdAt: Date }[]
> {
  const rows = await prisma.balanceTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, type: true, amountCents: true, balanceAfterCents: true, reason: true, createdAt: true },
  });
  return rows;
}
