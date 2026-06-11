import { GiveawayDurationType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { getBalance, getAvailableBalanceCents } from '@/lib/balance-service';
import {
  AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS,
  canApproveGiveawayRequest,
  canSubmitGiveawayRequest,
  giveawayRequestErrorMessage,
  validateGiveawayRequestInput,
} from '@/lib/affiliate-giveaway-request-logic';
import {
  GIVEAWAY_DEFAULT_MAX_TICKETS,
  GIVEAWAY_DEFAULT_TICKET_PRICE,
  GIVEAWAY_DEFAULT_WINNER_COUNT,
} from '@/lib/admin-constants';
import { NotificationService } from '@/lib/notification-service';
import { getPointsConfig } from '@/lib/points-service';

export class AffiliateGiveawayRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = 'AffiliateGiveawayRequestError';
  }
}

export interface SubmitGiveawayRequestInput {
  startDate: Date;
  endDate: Date;
  winnerCount: number;
  costCents: number;
  adminMessage?: string | null;
}

export interface ApproveGiveawayRequestInput {
  title: string;
  description: string;
  prize: string;
  prizeImageUrl?: string | null;
  steamMarketHashName?: string | null;
  rewardValueCents?: number;
  ticketPrice?: number;
  maxTickets?: number;
}

async function getActiveAffiliate(userId: string) {
  const affiliate = await prisma.affiliateStats.findUnique({
    where: { userId },
    select: { id: true, code: true, isActive: true, userId: true },
  });
  if (!affiliate?.isActive) {
    throw new AffiliateGiveawayRequestError(
      giveawayRequestErrorMessage('AFFILIATE_INACTIVE'),
      'AFFILIATE_INACTIVE',
      403
    );
  }
  return affiliate;
}

export class AffiliateGiveawayRequestService {
  static async listForUser(userId: string) {
    const affiliate = await prisma.affiliateStats.findUnique({
      where: { userId },
      select: { id: true, isActive: true },
    });
    if (!affiliate?.isActive) {
      throw new AffiliateGiveawayRequestError(
        giveawayRequestErrorMessage('AFFILIATE_INACTIVE'),
        'AFFILIATE_INACTIVE',
        403
      );
    }

    const [requests, balance] = await Promise.all([
      prisma.affiliateGiveawayRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          giveaway: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      getBalance(userId),
    ]);

    return { requests, balance, maxPending: AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS };
  }

  static async submitRequest(userId: string, input: SubmitGiveawayRequestInput) {
    const affiliate = await getActiveAffiliate(userId);

    const validation = validateGiveawayRequestInput({
      startDate: input.startDate,
      endDate: input.endDate,
      winnerCount: input.winnerCount,
      costCents: input.costCents,
    });
    if (!validation.ok) {
      throw new AffiliateGiveawayRequestError(
        giveawayRequestErrorMessage(validation.error),
        validation.error,
        400
      );
    }

    const [pendingCount, balance] = await Promise.all([
      prisma.affiliateGiveawayRequest.count({
        where: { affiliateId: affiliate.id, status: 'PENDING' },
      }),
      getBalance(userId),
    ]);

    const eligibility = canSubmitGiveawayRequest({
      pendingCount,
      maxPending: AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS,
      affiliateActive: true,
      availableCents: balance.availableCents,
      costCents: input.costCents,
      accountFrozen: balance.accountFrozen,
    });
    if (!eligibility.ok) {
      throw new AffiliateGiveawayRequestError(
        giveawayRequestErrorMessage(eligibility.error),
        eligibility.error,
        eligibility.error === 'INSUFFICIENT_BALANCE' ? 409 : 400
      );
    }

    const request = await prisma.affiliateGiveawayRequest.create({
      data: {
        affiliateId: affiliate.id,
        userId,
        startDate: input.startDate,
        endDate: input.endDate,
        winnerCount: input.winnerCount,
        costCents: input.costCents,
        adminMessage: input.adminMessage?.trim() || null,
        status: 'PENDING',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AFFILIATE_GIVEAWAY_REQUEST_SUBMITTED',
        details: {
          requestId: request.id,
          costCents: input.costCents,
          winnerCount: input.winnerCount,
        },
      },
    });

    await NotificationService.notifyAdmins({
      type: 'ADMIN_MESSAGE',
      priority: 'NORMAL',
      titleFr: 'Nouvelle demande de giveaway affilié',
      titleEn: 'New affiliate giveaway request',
      messageFr: `Un affilié a soumis une demande de giveaway (${(input.costCents / 100).toFixed(2)} €)`,
      messageEn: `An affiliate submitted a giveaway request (${(input.costCents / 100).toFixed(2)} EUR)`,
      link: '/admin/affiliate-giveaway-requests',
      metadata: { requestId: request.id, affiliateId: affiliate.id },
    });

    return request;
  }

  static async listForAdmin(options: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'all';
    page?: number;
    limit?: number;
  }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where =
      options.status && options.status !== 'all' ? { status: options.status } : {};

    const [requests, total, pendingCount] = await Promise.all([
      prisma.affiliateGiveawayRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              steamUsername: true,
              steamAvatar: true,
              email: true,
              balanceCents: true,
              frozenBalanceCents: true,
              accountFrozen: true,
            },
          },
          affiliate: { select: { id: true, code: true } },
          giveaway: { select: { id: true, title: true, status: true } },
          reviewer: {
            select: { id: true, steamUsername: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.affiliateGiveawayRequest.count({ where }),
      prisma.affiliateGiveawayRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      requests: requests.map((r) => ({
        ...r,
        availableCents: r.user.accountFrozen
          ? 0
          : Math.max(0, r.user.balanceCents - r.user.frozenBalanceCents),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      pendingCount,
    };
  }

  static async approveRequest(
    adminId: string,
    requestId: string,
    input: ApproveGiveawayRequestInput
  ) {
    const existing = await prisma.affiliateGiveawayRequest.findUnique({
      where: { id: requestId },
      include: {
        affiliate: { select: { code: true } },
      },
    });

    if (!existing) {
      throw new AffiliateGiveawayRequestError('Demande introuvable', 'NOT_FOUND', 404);
    }

    const balance = await getBalance(existing.userId);
    const approvalCheck = canApproveGiveawayRequest({
      status: existing.status,
      availableCents: balance.availableCents,
      costCents: existing.costCents,
      accountFrozen: balance.accountFrozen,
    });

    if (!approvalCheck.ok) {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'AFFILIATE_GIVEAWAY_APPROVAL_BLOCKED',
          details: {
            requestId,
            reason: approvalCheck.error,
            availableCents: balance.availableCents,
            costCents: existing.costCents,
          },
        },
      });
      throw new AffiliateGiveawayRequestError(
        giveawayRequestErrorMessage(approvalCheck.error),
        approvalCheck.error,
        approvalCheck.error === 'INSUFFICIENT_BALANCE' ? 409 : 400
      );
    }

    const pointsConfig = await getPointsConfig();
    const ticketPrice =
      typeof input.ticketPrice === 'number' && input.ticketPrice > 0
        ? input.ticketPrice
        : pointsConfig.giveawayCosts.CUSTOM ?? GIVEAWAY_DEFAULT_TICKET_PRICE;
    const maxTickets =
      typeof input.maxTickets === 'number' && input.maxTickets > 0
        ? input.maxTickets
        : GIVEAWAY_DEFAULT_MAX_TICKETS;

    const rewardValueCents =
      typeof input.rewardValueCents === 'number' && input.rewardValueCents >= 0
        ? Math.floor(input.rewardValueCents)
        : 0;

    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.affiliateGiveawayRequest.findUnique({
        where: { id: requestId },
      });
      if (!locked || locked.status !== 'PENDING') {
        throw new AffiliateGiveawayRequestError(
          giveawayRequestErrorMessage('INVALID_STATUS'),
          'INVALID_STATUS',
          400
        );
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: locked.userId },
        select: { balanceCents: true, frozenBalanceCents: true, accountFrozen: true },
      });
      const availableCents = user.accountFrozen
        ? 0
        : getAvailableBalanceCents(user.balanceCents, user.frozenBalanceCents);

      if (availableCents < locked.costCents) {
        throw new AffiliateGiveawayRequestError(
          giveawayRequestErrorMessage('INSUFFICIENT_BALANCE'),
          'INSUFFICIENT_BALANCE',
          409
        );
      }

      const debitResult = await tx.user.updateMany({
        where: { id: locked.userId, balanceCents: { gte: locked.costCents } },
        data: { balanceCents: { decrement: locked.costCents } },
      });
      if (debitResult.count === 0) {
        throw new AffiliateGiveawayRequestError(
          giveawayRequestErrorMessage('INSUFFICIENT_BALANCE'),
          'INSUFFICIENT_BALANCE',
          409
        );
      }

      const debitedUser = await tx.user.findUniqueOrThrow({
        where: { id: locked.userId },
        select: { balanceCents: true },
      });

      await tx.balanceTransaction.create({
        data: {
          userId: locked.userId,
          type: 'AFFILIATE_GIVEAWAY',
          amountCents: -locked.costCents,
          balanceAfterCents: debitedUser.balanceCents,
          reason: `Affiliate giveaway request ${requestId}`,
          createdBy: adminId,
          metadata: { requestId, adminId } as Prisma.InputJsonValue,
        },
      });

      const giveaway = await tx.giveaway.create({
        data: {
          title: input.title.trim(),
          description: input.description.trim(),
          prize: input.prize.trim(),
          prizeImageUrl: input.prizeImageUrl ?? null,
          steamMarketHashName: input.steamMarketHashName ?? null,
          ticketPrice,
          maxTickets,
          startDate: locked.startDate,
          endDate: locked.endDate,
          winnerCount: locked.winnerCount || GIVEAWAY_DEFAULT_WINNER_COUNT,
          rewardValueCents,
          durationType: GiveawayDurationType.CUSTOM,
          isPrivate: true,
          requiredAffiliateCode: existing.affiliate.code,
          status: 'ACTIVE',
        },
      });

      const updatedRequest = await tx.affiliateGiveawayRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          giveawayId: giveaway.id,
          prize: input.prize.trim(),
          prizeImageUrl: input.prizeImageUrl ?? null,
          steamMarketHashName: input.steamMarketHashName ?? null,
          rewardValueCents,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        include: {
          giveaway: { select: { id: true, title: true, status: true } },
        },
      });

      return { updatedRequest, giveaway };
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'AFFILIATE_GIVEAWAY_REQUEST_APPROVED',
        details: {
          requestId,
          giveawayId: result.giveaway.id,
          costCents: existing.costCents,
        },
      },
    });

    await NotificationService.createNotification({
      userId: existing.userId,
      type: 'ADMIN_MESSAGE',
      titleFr: 'Giveaway approuvé',
      titleEn: 'Giveaway approved',
      messageFr: `Votre demande de giveaway a été approuvée. Budget débité : ${(existing.costCents / 100).toFixed(2)} €`,
      messageEn: `Your giveaway request was approved. Debited: ${(existing.costCents / 100).toFixed(2)} EUR`,
      link: `/giveaways/${result.giveaway.id}`,
      metadata: { requestId, giveawayId: result.giveaway.id },
    });

    return result;
  }

  static async rejectRequest(adminId: string, requestId: string, rejectionReason?: string) {
    const existing = await prisma.affiliateGiveawayRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new AffiliateGiveawayRequestError('Demande introuvable', 'NOT_FOUND', 404);
    }

    if (existing.status !== 'PENDING') {
      throw new AffiliateGiveawayRequestError(
        giveawayRequestErrorMessage('INVALID_STATUS'),
        'INVALID_STATUS',
        400
      );
    }

    const updated = await prisma.affiliateGiveawayRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'AFFILIATE_GIVEAWAY_REQUEST_REJECTED',
        details: { requestId, rejectionReason: rejectionReason ?? null },
      },
    });

    await NotificationService.createNotification({
      userId: existing.userId,
      type: 'ADMIN_MESSAGE',
      titleFr: 'Demande de giveaway refusée',
      titleEn: 'Giveaway request rejected',
      messageFr: rejectionReason?.trim()
        ? `Votre demande de giveaway a été refusée : ${rejectionReason.trim()}`
        : 'Votre demande de giveaway a été refusée.',
      messageEn: rejectionReason?.trim()
        ? `Your giveaway request was rejected: ${rejectionReason.trim()}`
        : 'Your giveaway request was rejected.',
      link: '/affiliate/giveaway-request',
      metadata: { requestId },
    });

    return updated;
  }
}
