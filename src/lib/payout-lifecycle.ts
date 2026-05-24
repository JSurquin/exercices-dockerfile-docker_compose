import { prisma } from '~/prisma/prisma';
import { debitBalance, unfreezeBalance } from '@/lib/balance-service';
import { TradeHooks } from '@/lib/trade-hooks';
import { AffiliateService } from '@/lib/affiliate-service';

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
    if (amountCents <= 0) throw new Error('onCreated: amountCents must be positive');
    await prisma.$transaction(async (tx) => {
      // Idempotence: skip if already frozen
      const lock = await tx.payout.updateMany({
        where: { id: payoutId, balanceFrozenAt: null },
        data: { balanceFrozenAt: new Date() },
      });
      if (lock.count === 0) return; // already frozen — idempotent no-op

      // SELECT ... FOR UPDATE to prevent concurrent freeze race condition
      const rows = await tx.$queryRaw<{ balanceCents: number; frozenBalanceCents: number }[]>`
        SELECT "balanceCents", "frozenBalanceCents" FROM "user" WHERE "id" = ${userId} FOR UPDATE
      `;
      if (!rows.length) throw new Error('User not found');
      const { balanceCents, frozenBalanceCents } = rows[0];
      const available = balanceCents - frozenBalanceCents;
      if (available < amountCents) {
        throw new Error('INSUFFICIENT_AVAILABLE_BALANCE');
      }
      await tx.user.update({
        where: { id: userId },
        data: { frozenBalanceCents: { increment: amountCents } },
      });
    });
  }

  /**
   * Débite la balance + dégèle après confirmation du paiement.
   * Idempotent : utilise balanceDebitedAt comme verrou atomique.
   *
   * @param options.tradeId   — si présent, marque le trade PAID + déclenche TradeHooks.onTradePaid
   * @param options.reason    — raison libre pour le log
   */
  static async onCompleted(
    userId: string,
    payoutId: string,
    amountCents: number,
    options: {
      tradeId?: string | null;
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
      console.error(`[PayoutLifecycle] debitBalance failed for ${payoutId}:`, err);
      // Unfreeze the funds so they aren't stuck forever
      if (pre?.balanceFrozenAt) {
        try {
          await unfreezeBalance(userId, amountCents);
        } catch (unfreezeErr) {
          console.error(`[PayoutLifecycle] CRITICAL: unfreezeBalance also failed for ${payoutId}, manual fix needed:`, unfreezeErr);
        }
      }
      const rollback: Record<string, unknown> = { balanceDebitedAt: null };
      if (options.finalStatus && pre) {
        rollback.status = pre.status;
        rollback.paidAt = pre.paidAt;
      }
      await prisma.payout.update({
        where: { id: payoutId },
        data: rollback,
      });
      return { debited: false };
    }

    // Debit succeeded — unfreeze the reserved amount
    if (pre?.balanceFrozenAt) {
      try {
        await unfreezeBalance(userId, amountCents);
      } catch (err) {
        console.error(`[PayoutLifecycle] CRITICAL: unfreezeBalance failed after debit for ${payoutId}, manual fix needed:`, err);
      }
    }

    if (options.tradeId) {
      try {
        await prisma.trade.update({
          where: { id: options.tradeId },
          data: { status: 'PAID' },
        });
        // Marque le trade comme traité post-PAID (commissions déjà attribuées à AVAILABLE)
        await TradeHooks.onTradePaid(options.tradeId);
      } catch (err) {
        console.error(`[PayoutLifecycle] trade.update PAID / onTradePaid failed for ${payoutId}:`, err);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PAYOUT_BALANCE_DEBITED',
          details: { payoutId, amountCents, reason },
        },
      });
    } catch (err) {
      console.error(`[PayoutLifecycle] auditLog failed for ${payoutId}:`, err);
    }

    return { debited: true };
  }

  /**
   * Dégèle le montant sans débiter (paiement échoué / rejeté).
   * Idempotent : utilise balanceDebitedAt comme verrou atomique (à ne pas confondre avec un succès :
   * ce champ est aussi posé ici pour marquer le payout comme traité après échec).
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
      try {
        await unfreezeBalance(userId, amountCents);
      } catch (err) {
        console.error(`[PayoutLifecycle] CRITICAL: unfreezeBalance failed for failed payout ${payoutId}, manual fix needed:`, err);
      }
    }

    if (options.tradeId) {
      try {
        const tradeBefore = await prisma.trade.findUnique({
          where: { id: options.tradeId },
          select: { status: true },
        });
        await prisma.trade.update({
          where: { id: options.tradeId },
          data: { status: 'FAILED' },
        });
        if (tradeBefore) {
          await TradeHooks.onTradeStatusChanged(
            options.tradeId,
            tradeBefore.status,
            'FAILED'
          );
        } else {
          await AffiliateService.cancelCommissionsForTrade(options.tradeId);
        }
      } catch (err) {
        console.error(`[PayoutLifecycle] trade.update FAILED failed for ${payoutId}:`, err);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PAYOUT_BALANCE_UNFROZEN',
          details: { payoutId, amountCents, reason: 'payout_failed' },
        },
      });
    } catch (err) {
      console.error(`[PayoutLifecycle] auditLog failed for failed payout ${payoutId}:`, err);
    }

    return { unfrozen: true };
  }
}
