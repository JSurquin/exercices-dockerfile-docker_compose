import { prisma } from '~/prisma/prisma';
import type { Prisma } from '@prisma/client';

const AUDIT_ACTIONS = {
  ADMIN_IP_BLOCKED: 'ADMIN_IP_BLOCKED',
  ADMIN_IP_UNBLOCKED: 'ADMIN_IP_UNBLOCKED',
} as const;

const PRIVILEGED_ROLES = new Set(['ADMIN', 'MODERATOR']);

export function isPrivilegedRole(role: string | null | undefined): boolean {
  return !!role && PRIVILEGED_ROLES.has(role);
}

function normalizeIp(ip: string): string {
  return ip.trim();
}

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

/**
 * Vérifie si une IP est bloquée (expiration passée = non bloquée).
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const normalized = normalizeIp(ip);
  if (!normalized || normalized === 'unknown') {
    return false;
  }

  const entry = await prisma.blockedIp.findUnique({
    where: { ipAddress: normalized },
    select: { expiresAt: true },
  });

  if (!entry) {
    return false;
  }

  if (entry.expiresAt && entry.expiresAt < new Date()) {
    return false;
  }

  return true;
}

export async function blockIp(
  adminId: string,
  ipAddress: string,
  reason: string,
  expiresAt: Date | null,
  adminIp?: string
): Promise<{ id: string }> {
  const normalized = normalizeIp(ipAddress);
  if (!normalized || normalized === 'unknown') {
    throw new Error('Adresse IP invalide');
  }

  const entry = await prisma.blockedIp.upsert({
    where: { ipAddress: normalized },
    create: {
      ipAddress: normalized,
      reason: reason.trim(),
      createdBy: adminId,
      expiresAt,
    },
    update: {
      reason: reason.trim(),
      createdBy: adminId,
      expiresAt,
    },
    select: { id: true },
  });

  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_IP_BLOCKED,
    {
      blockedIp: normalized,
      reason: reason.trim(),
      expiresAt: expiresAt?.toISOString() ?? null,
    },
    adminIp
  );

  return entry;
}

export async function unblockIp(
  adminId: string,
  blockedIpId: string,
  adminIp?: string
): Promise<void> {
  const entry = await prisma.blockedIp.findUnique({
    where: { id: blockedIpId },
    select: { id: true, ipAddress: true },
  });

  if (!entry) {
    throw new Error('IP introuvable');
  }

  await prisma.blockedIp.delete({ where: { id: blockedIpId } });

  await auditLog(
    adminId,
    AUDIT_ACTIONS.ADMIN_IP_UNBLOCKED,
    { blockedIp: entry.ipAddress },
    adminIp
  );
}

export async function listBlockedIps(): Promise<
  Array<{
    id: string;
    ipAddress: string;
    reason: string;
    createdBy: string;
    expiresAt: Date | null;
    createdAt: Date;
  }>
> {
  return prisma.blockedIp.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      reason: true,
      createdBy: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}
