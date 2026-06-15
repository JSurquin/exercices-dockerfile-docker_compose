import { prisma } from '~/prisma/prisma';
import type { Prisma } from '@prisma/client';
import { isUserBanned } from '@/lib/user-ban-logic';

const AUDIT_ACTIONS = {
  ADMIN_USER_BAN: 'ADMIN_USER_BAN',
  ADMIN_USER_UNBAN: 'ADMIN_USER_UNBAN',
} as const;

async function auditLog(
  adminId: string,
  action: string,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action,
      details: { ...details, severity: 'high' } as Prisma.InputJsonValue,
      ipAddress,
    },
  });
}

async function assertBanTargetAllowed(adminId: string, targetUserId: string) {
  if (adminId === targetUserId) {
    throw new Error('Vous ne pouvez pas bannir votre propre compte');
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!target) {
    throw new Error('Utilisateur introuvable');
  }

  if (target.role === 'ADMIN') {
    throw new Error('Impossible de bannir un administrateur');
  }
}

/**
 * Bannit un utilisateur avec motif et date d'expiration optionnelle.
 */
export async function banUser(
  adminId: string,
  targetUserId: string,
  reason: string,
  banExpires: Date | null,
  ipAddress?: string
): Promise<void> {
  await assertBanTargetAllowed(adminId, targetUserId);

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      banned: true,
      banReason: reason.trim(),
      banExpires,
    },
  });

  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_USER_BAN,
    {
      targetUserId,
      reason: reason.trim(),
      banExpires: banExpires?.toISOString() ?? null,
    },
    ipAddress
  );
}

export interface BulkBanResult {
  banned: number;
  skipped: number;
  errors: { userId: string; error: string }[];
}

/**
 * Bannit plusieurs utilisateurs avec le même motif et la même date d'expiration.
 */
export async function banUsers(
  adminId: string,
  targetUserIds: string[],
  reason: string,
  banExpires: Date | null,
  ipAddress?: string
): Promise<BulkBanResult> {
  const uniqueIds = [...new Set(targetUserIds.filter(Boolean))];
  const result: BulkBanResult = { banned: 0, skipped: 0, errors: [] };

  for (const targetUserId of uniqueIds) {
    try {
      await banUser(adminId, targetUserId, reason, banExpires, ipAddress);
      result.banned += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      result.errors.push({ userId: targetUserId, error: message });
      result.skipped += 1;
    }
  }

  return result;
}

/**
 * Lève le bannissement d'un utilisateur.
 */
export async function unbanUser(
  adminId: string,
  targetUserId: string,
  ipAddress?: string
): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, banned: true, banExpires: true },
  });

  if (!target) {
    throw new Error('Utilisateur introuvable');
  }

  if (!isUserBanned(target) && !target.banned) {
    throw new Error('Cet utilisateur n\'est pas banni');
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      banned: false,
      banReason: null,
      banExpires: null,
    },
  });

  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_USER_UNBAN,
    { targetUserId },
    ipAddress
  );
}
