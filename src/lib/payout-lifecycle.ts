import { prisma } from '~/prisma/prisma';
import { debitBalance, freezeBalance, unfreezeBalance } from '@/lib/balance-service';

/**
 * Service centralisé pour le cycle de vie des payouts.
 * Gère le gel/dégel/débit de la balance avec idempotence atomique.
 *
 * Utilisation :
 *   - onCreated()   → à appeler juste après prisma.payout.create
 *   - onCompleted() → webhook succès / admin approve / polling rattrapage
 *   - onFailed()    → webhook échec / admin reject / erreur provider
 */
export class PayoutLifecycle {
  /**
   * Gèle le montant du payout sur la balance utilisateur.
   * À appeler immédiatement après le prisma.payout.create.
   */
  static async onCreated(userId: string, payoutId: string, amountCents: number): Promise<void> {
    await prisma.payout.update({
      where: { id: payoutId },
      data: { balanceFrozenAt: new Date() },
    });
    await freezeBalance(userId, amountCents);
  }

  /**
   * Débite la balance + dégèle après confirmation du paiement.
   * Idempotent : utilise balanceDebitedAt comme verrou atomique.
   *
   * @param options.tradeId   — si présent, marque le trade PAID
   * @param options.updateXp  — si true, incrémente totalVolumeCents et xp
   * @param options.reason    — raison libre pour le log
   */
  static async onCompleted(
    userId: string,
    payoutId: string,
    amountCents: number,
    options: {
      tradeId?: string | null;
      updateXp?: boolean;
      reason?: string;
      finalStatus?: string;
      paidAt?: Date;
    } = {},
  ): Promise<{ debited: boolean }> {
    const pre = await prisma.payout.findUnique({
      where: { id: payoutId },
      select: { status: true, paidAt: true, balanceFrozenAt: true },
    });

    const now = new Date();
    const lockData: Record<string, unknown> = { balanceDebitedAt: now };
    if (options.finalStatus) lockData.status = options.finalStatus;
    if (options.paidAt) lockData.paidAt = options.paidAt;

    const lock = await prisma.payout.updateMany({
      where: { id: payoutId, balanceDebitedAt: null },
      data: lockData,
    });

    if (lock.count === 0) return { debited: false };

    const reason = options.reason ?? `Payout ${payoutId} complété`;

    try {
      await debitBalance(userId, amountCents, reason, {
        type: 'WITHDRAWAL',
        payoutId,
      });
    } catch (err) {
      const rollback: Record<string, unknown> = { balanceDebitedAt: null };
      if (options.finalStatus && pre) {
        rollback.status = pre.status;
        rollback.paidAt = pre.paidAt;
      }
      await prisma.payout.update({
        where: { id: payoutId },
        data: rollback,
      });
      console.error(`[PayoutLifecycle] debitBalance failed, lock rolled back for ${payoutId}:`, err);
      return { debited: false };
    }

    if (pre?.balanceFrozenAt) {
      await unfreezeBalance(userId, amountCents);
    }

    if (options.tradeId) {
      await prisma.trade.update({
        where: { id: options.tradeId },
        data: { status: 'PAID' },
      });
    }

    if (options.updateXp) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalVolumeCents: { increment: amountCents },
          xp: { increment: Math.floor(amountCents / 100) },
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYOUT_BALANCE_DEBITED',
        details: { payoutId, amountCents, reason },
      },
    });

    return { debited: true };
  }

  /**
   * Dégèle le montant sans débiter (paiement échoué / rejeté).
   * Idempotent : utilise balanceDebitedAt comme verrou atomique.
   */
  static async onFailed(
    userId: string,
    payoutId: string,
    amountCents: number,
    options: { tradeId?: string | null; finalStatus?: string } = {},
  ): Promise<{ unfrozen: boolean }> {
    const lockData: Record<string, unknown> = { balanceDebitedAt: new Date() };
    if (options.finalStatus) lockData.status = options.finalStatus;

    const lock = await prisma.payout.updateMany({
      where: { id: payoutId, balanceDebitedAt: null },
      data: lockData,
    });

    if (lock.count === 0) return { unfrozen: false };

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      select: { balanceFrozenAt: true },
    });

    if (payout?.balanceFrozenAt) {
      await unfreezeBalance(userId, amountCents);
    }

    if (options.tradeId) {
      await prisma.trade.update({
        where: { id: options.tradeId },
        data: { status: 'FAILED' },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYOUT_BALANCE_UNFROZEN',
        details: { payoutId, amountCents, reason: 'payout_failed' },
      },
    });

    return { unfrozen: true };
  }
}
