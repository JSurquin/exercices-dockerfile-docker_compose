import { prisma } from '~/prisma/prisma';
import { NotificationService } from '@/lib/notification-service';

export async function notifyAdminsPayoutPendingApproval(
  payoutId: string,
  userId: string,
  amountCents: number,
  method: string,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, name: true },
    });
    const username = user?.steamUsername || user?.name || 'Utilisateur';
    await NotificationService.notifyPayoutPendingApproval(
      payoutId,
      userId,
      username,
      amountCents,
      method,
    );
  } catch (error) {
    console.error('[notifyAdminsPayoutPendingApproval]', error);
  }
}

export async function notifyAdminsKycSubmitted(userId: string, kycType: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, name: true },
    });
    const username = user?.steamUsername || user?.name || 'Utilisateur';
    await NotificationService.notifyNewKYC(userId, username, kycType);
  } catch (error) {
    console.error('[notifyAdminsKycSubmitted]', error);
  }
}

export async function notifyAdminsKycResolved(
  userId: string,
  status: 'VERIFIED' | 'REJECTED',
  rejectionReason?: string,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, name: true },
    });
    const username = user?.steamUsername || user?.name || 'Utilisateur';

    if (status === 'VERIFIED') {
      await NotificationService.notifyKycApproved(userId, username);
    } else {
      await NotificationService.notifyKycRejected(userId, username, rejectionReason);
    }
  } catch (error) {
    console.error('[notifyAdminsKycResolved]', error);
  }
}

export async function notifyAdminsNewTrade(
  tradeId: string,
  userId: string,
  amountCents: number,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { steamUsername: true, name: true },
    });
    const username = user?.steamUsername || user?.name || 'Utilisateur';
    await NotificationService.notifyNewTrade(tradeId, userId, username, amountCents);
  } catch (error) {
    console.error('[notifyAdminsNewTrade]', error);
  }
}
