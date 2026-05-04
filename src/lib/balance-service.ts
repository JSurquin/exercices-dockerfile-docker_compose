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

/**
 * Crédite le solde en attente (hold) lors de l'IPN #1 Skinplace.
 * Les fonds ne sont PAS encore disponibles pour un payout.
 * Ils seront libérés vers balanceCents à l'IPN #2 (protection_status=confirmed).
 */
export async function creditPendingBalance(
  userId: string,
  amountCents: number,
  reason: string | null,
  metadata: { tradeId: string; [key: string]: unknown } = { tradeId: '' }
): Promise<{ pendingBalanceCents: number }> {
  if (amountCents <= 0) throw new Error('creditPendingBalance: amountCents must be positive');
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { pendingBalanceCents: true } });
    if (!user) throw new Error('User not found');
    const pendingBalanceCents = user.pendingBalanceCents + amountCents;
    await tx.user.update({ where: { id: userId }, data: { pendingBalanceCents } });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: 'TRADE_PENDING_CREDIT',
        amountCents,
        balanceAfterCents: pendingBalanceCents,
        reason,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    return { pendingBalanceCents };
  });
}

/**
 * Annule un crédit en attente (rollback Skinplace).
 * Décrémente pendingBalanceCents sans toucher à balanceCents.
 * Sécurisé : ne descend jamais en dessous de 0 (protection contre les incohérences).
 */
export async function debitPendingBalance(
  userId: string,
  amountCents: number,
  reason: string | null,
  metadata: { tradeId: string; [key: string]: unknown } = { tradeId: '' }
): Promise<{ pendingBalanceCents: number }> {
  if (amountCents <= 0) throw new Error('debitPendingBalance: amountCents must be positive');
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { pendingBalanceCents: true } });
    if (!user) throw new Error('User not found');
    const pendingBalanceCents = Math.max(0, user.pendingBalanceCents - amountCents);
    await tx.user.update({ where: { id: userId }, data: { pendingBalanceCents } });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: 'TRADE_PENDING_CREDIT',
        amountCents: -amountCents,
        balanceAfterCents: pendingBalanceCents,
        reason,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    return { pendingBalanceCents };
  });
}

/**
 * Libère un montant du solde en attente vers le solde disponible (IPN #2 confirmed).
 * Décrémente pendingBalanceCents et incrémente balanceCents dans une seule transaction.
 */
export async function releasePendingToBalance(
  userId: string,
  amountCents: number,
  reason: string | null,
  metadata: { tradeId: string; [key: string]: unknown } = { tradeId: '' }
): Promise<{ balanceCents: number; pendingBalanceCents: number }> {
  if (amountCents <= 0) throw new Error('releasePendingToBalance: amountCents must be positive');
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balanceCents: true, pendingBalanceCents: true },
    });
    if (!user) throw new Error('User not found');

    // On ne peut libérer que ce qui est en pending (protection contre les incohérences)
    const releaseAmount = Math.min(amountCents, user.pendingBalanceCents);
    const balanceCents = user.balanceCents + releaseAmount;
    const pendingBalanceCents = user.pendingBalanceCents - releaseAmount;

    await tx.user.update({ where: { id: userId }, data: { balanceCents, pendingBalanceCents } });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: 'TRADE_PENDING_RELEASE',
        amountCents: releaseAmount,
        balanceAfterCents: balanceCents,
        reason,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    return { balanceCents, pendingBalanceCents };
  });
}

export async function freezeBalance(
  userId: string,
  amountCents: number,
): Promise<void> {
  if (amountCents <= 0) throw new Error('freezeBalance: amountCents must be positive');
  await prisma.user.update({
    where: { id: userId },
    data: { frozenBalanceCents: { increment: amountCents } },
  });
}

export async function unfreezeBalance(
  userId: string,
  amountCents: number,
): Promise<void> {
  if (amountCents <= 0) throw new Error('unfreezeBalance: amountCents must be positive');
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { frozenBalanceCents: true },
    });
    const currentFrozen = user?.frozenBalanceCents ?? 0;
    const decrementBy = Math.min(amountCents, currentFrozen);
    if (decrementBy <= 0) return;
    await tx.user.update({
      where: { id: userId },
      data: { frozenBalanceCents: { decrement: decrementBy } },
    });
  });
}

export function getAvailableBalanceCents(balanceCents: number, frozenBalanceCents: number): number {
  return Math.max(0, balanceCents - frozenBalanceCents);
}

export async function getBalance(userId: string): Promise<{
  balanceCents: number;
  pendingBalanceCents: number;
  frozenBalanceCents: number;
  availableCents: number;
  accountFrozen: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceCents: true, pendingBalanceCents: true, frozenBalanceCents: true, accountFrozen: true },
  });
  if (!user) throw new Error('User not found');
  const availableCents = getAvailableBalanceCents(user.balanceCents, user.frozenBalanceCents);
  return {
    balanceCents: user.balanceCents,
    pendingBalanceCents: user.pendingBalanceCents,
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
