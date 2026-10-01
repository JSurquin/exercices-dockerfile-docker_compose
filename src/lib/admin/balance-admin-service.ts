import { prisma } from '~/prisma/prisma';
import {
  creditBalance,
  debitBalance,
  forceDebitBalance,
  getBalance,
  getRecentBalanceTransactions,
  getMonthlyWithdrawalLimitCents,
  getMonthlyWithdrawalUsedCents,
  checkWithdrawalLimit,
} from '@/lib/balance-service';
import type { BalanceTransactionType, Prisma } from '@prisma/client';

const AUDIT_ACTIONS = {
  ADMIN_BALANCE_ADJUSTMENT: 'ADMIN_BALANCE_ADJUSTMENT',
  ADMIN_ACCOUNT_FREEZE: 'ADMIN_ACCOUNT_FREEZE',
  ADMIN_ACCOUNT_UNFREEZE: 'ADMIN_ACCOUNT_UNFREEZE',
  ADMIN_WITHDRAWAL_LIMIT_UPDATE: 'ADMIN_WITHDRAWAL_LIMIT_UPDATE',
  ADMIN_PAYOUT_CANCELLED: 'ADMIN_PAYOUT_CANCELLED',
} as const;

async function auditLog(
  userId: string,
  action: string,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: { userId, action, details: details as Prisma.InputJsonValue, ipAddress },
  });
}

/**
 * Ajuste le solde d'un utilisateur (crédit ou débit).
 * amountCents: positif = crédit, négatif = débit
 */
export async function adjustUserBalance(
  adminId: string,
  userId: string,
  amountCents: number,
  reason: string,
  ipAddress?: string
): Promise<{ balanceAfterCents: number }> {
  const type: BalanceTransactionType = 'ADMIN_ADJUSTMENT';
  const metadata = { type, createdBy: adminId };
  if (amountCents > 0) {
    const result = await creditBalance(userId, amountCents, reason, metadata);
    await auditLog(
      adminId,
      AUDIT_ACTIONS.ADMIN_BALANCE_ADJUSTMENT,
      { targetUserId: userId, amountCents, reason, balanceAfterCents: result.balanceAfterCents },
      ipAddress
    );
    return result;
  }
  if (amountCents < 0) {
    const result = await forceDebitBalance(userId, -amountCents, reason, metadata);
    await auditLog(
      adminId,
      AUDIT_ACTIONS.ADMIN_BALANCE_ADJUSTMENT,
      { targetUserId: userId, amountCents, reason, balanceAfterCents: result.balanceAfterCents },
      ipAddress
    );
    return result;
  }
  const balance = await getBalance(userId);
  return { balanceAfterCents: balance.balanceCents };
}

/**
 * Gèle le compte utilisateur (bloque les virements / retraits).
 */
export async function freezeAccount(
  adminId: string,
  userId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { accountFrozen: true },
  });
  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_ACCOUNT_FREEZE,
    { targetUserId: userId, reason },
    ipAddress
  );
}

/**
 * Dégèle le compte utilisateur.
 */
export async function unfreezeAccount(
  adminId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { accountFrozen: false },
  });
  await auditLog(adminId, AUDIT_ACTIONS.ADMIN_ACCOUNT_UNFREEZE, { targetUserId: userId }, ipAddress);
}

/**
 * Met à jour le plafond de retrait mensuel (en centimes).
 * Passer null pour supprimer la limite (stocke 0 = illimité).
 * Passer un nombre > 0 pour fixer un plafond personnalisé.
 */
export async function updateWithdrawalLimit(
  adminId: string,
  userId: string,
  monthlyLimitCents: number | null,
  ipAddress?: string
): Promise<void> {
  const valueToStore = monthlyLimitCents === null ? 0 : monthlyLimitCents;
  await prisma.withdrawalLimit.upsert({
    where: { userId },
    create: { userId, monthlyLimitCents: valueToStore, updatedBy: adminId },
    update: { monthlyLimitCents: valueToStore, updatedBy: adminId },
  });
  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_WITHDRAWAL_LIMIT_UPDATE,
    { targetUserId: userId, monthlyLimitCents },
    ipAddress
  );
}

/**
 * Annule un payout (statut -> CANCELLED) et dégèle la balance si elle avait été gelée.
 */
export async function cancelPayout(
  adminId: string,
  payoutId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      userId: true,
      status: true,
      amountCents: true,
      balanceFrozenAt: true,
      balanceDebitedAt: true,
      gateFiOrderId: true,
      user: { select: { name: true, email: true, contactEmail: true } },
    },
  });
  if (!payout) throw new Error('Payout not found');
  const cancellable = [
    'PENDING',
    'PENDING_APPROVAL',
    'VERIFICATION_REQUIRED',
    'VERIFIED',
    'SCHEDULED',
    'FLEXIFY_PENDING',
    'WHITEPAY_WAITING_CONFIRMATION',
    'WHITEPAY_PENDING_WITHDRAWAL',
  ];
  if (!cancellable.includes(payout.status)) {
    throw new Error(`Payout cannot be cancelled (status: ${payout.status})`);
  }

  const cancelReason = reason.trim() || 'Annulé par l’admin';

  if (payout.balanceFrozenAt && !payout.balanceDebitedAt) {
    const { PayoutLifecycle } = await import('@/lib/payout-lifecycle');
    await PayoutLifecycle.onFailed(payout.userId, payout.id, payout.amountCents, {
      finalStatus: 'CANCELLED',
    });
    await prisma.payout.update({
      where: { id: payoutId },
      data: { errorMessage: cancelReason },
    });
  } else {
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'CANCELLED', errorMessage: cancelReason },
    });
  }

  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_PAYOUT_CANCELLED,
    { payoutId, targetUserId: payout.userId, reason: cancelReason, amountCents: payout.amountCents, balanceUnfrozen: !!payout.balanceFrozenAt },
    ipAddress
  );

  const { isSepaFrPayout, notifySepaFrRejected } = await import('@/lib/sepa-fr-notify');
  if (isSepaFrPayout(payout.gateFiOrderId)) {
    try {
      await notifySepaFrRejected({
        user: payout.user,
        amountCents: payout.amountCents,
        reason: cancelReason,
      });
    } catch (err) {
      console.error('[cancelPayout] SEPA FR rejection email failed', payoutId, err);
    }
  }
}

/**
 * Récupère tout le contexte balance pour un utilisateur (admin).
 */
export async function getBalanceContext(userId: string): Promise<{
  balanceCents: number;
  pendingBalanceCents: number;
  frozenBalanceCents: number;
  availableCents: number;
  accountFrozen: boolean;
  monthlyLimitCents: number | null;
  monthlyUsedCents: number;
  transactions: { id: string; type: string; amountCents: number; balanceAfterCents: number; reason: string | null; createdAt: Date }[];
}> {
  const [balance, limitCents, usedCents, transactions] = await Promise.all([
    getBalance(userId),
    getMonthlyWithdrawalLimitCents(userId),
    getMonthlyWithdrawalUsedCents(userId),
    getRecentBalanceTransactions(userId, 50),
  ]);
  return {
    ...balance,
    monthlyLimitCents: limitCents,
    monthlyUsedCents: usedCents,
    transactions,
  };
}
