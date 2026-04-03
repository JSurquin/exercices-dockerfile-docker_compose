import type { FragmentTransactionType, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/prisma';

export async function grantFragments(
  userId: string,
  amount: number,
  type: FragmentTransactionType,
  reason?: string,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  if (amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.fragmentTransaction.create({
      data: {
        userId,
        type,
        amount,
        reason: reason ?? null,
        metadata: metadata ?? undefined,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { fragments: { increment: amount } },
    });
  });
}

/** Fragments brûlés (montant positif enregistré, solde décrémenté). */
export async function spendFragments(
  userId: string,
  amount: number,
  type: FragmentTransactionType,
  reason?: string,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  if (amount <= 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.fragmentTransaction.create({
      data: {
        userId,
        type,
        amount: -amount,
        reason: reason ?? null,
        metadata: metadata ?? undefined,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { fragments: { decrement: amount } },
    });
  });
}
