import { prisma } from "~/prisma/prisma";
import { NotificationType, NotificationPriority, Prisma } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  titleFr: string;
  titleEn: string;
  messageFr: string;
  messageEn: string;
  titleCn?: string;
  messageCn?: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Service pour créer et gérer les notifications
 */
export class NotificationService {
  /**
   * Crée une notification pour un utilisateur spécifique
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      return await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          priority: params.priority ?? NotificationPriority.NORMAL,
          titleFr: params.titleFr,
          titleEn: params.titleEn,
          messageFr: params.messageFr,
          messageEn: params.messageEn,
          titleCn: params.titleCn,
          messageCn: params.messageCn,
          link: params.link,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  /**
   * Notifie tous les admins d'un événement
   */
  static async notifyAdmins(params: Omit<CreateNotificationParams, "userId">) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length === 0) return;

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: params.type,
          priority: params.priority ?? NotificationPriority.NORMAL,
          titleFr: params.titleFr,
          titleEn: params.titleEn,
          messageFr: params.messageFr,
          messageEn: params.messageEn,
          titleCn: params.titleCn,
          messageCn: params.messageCn,
          link: params.link,
          metadata: params.metadata,
        })),
      });
    } catch (error) {
      console.error("Error notifying admins:", error);
    }
  }

  /**
   * Notifie les admins d'un nouveau trade
   */
  static async notifyNewTrade(tradeId: string, userId: string, username: string, amount: number) {
    const amountEur = (amount / 100).toFixed(2);
    
    await this.notifyAdmins({
      type: NotificationType.TRADE_UPDATE,
      priority: amount > 100000 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      titleFr: "Nouveau trade créé",
      titleEn: "New trade created",
      titleCn: "新交易已创建",
      messageFr: `${username} a créé un trade de ${amountEur}€`,
      messageEn: `${username} created a trade of €${amountEur}`,
      messageCn: `${username} 创建了 ${amountEur}€ 的交易`,
      link: `/admin/dashboard?tab=trades`,
      metadata: { tradeId, userId, amount },
    });
  }

  /**
   * Notifie les admins d'un nouveau payout
   */
  static async notifyNewPayout(payoutId: string, userId: string, username: string, amount: number, method: string) {
    const amountEur = (amount / 100).toFixed(2);
    
    await this.notifyAdmins({
      type: NotificationType.PAYOUT_UPDATE,
      priority: amount > 50000 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      titleFr: "Nouvelle demande de paiement",
      titleEn: "New payout request",
      titleCn: "新的付款请求",
      messageFr: `${username} demande un retrait de ${amountEur}€ via ${method}`,
      messageEn: `${username} requests a withdrawal of €${amountEur} via ${method}`,
      messageCn: `${username} 请求通过 ${method} 提取 ${amountEur}€`,
      link: `/admin/dashboard?tab=payouts`,
      metadata: { payoutId, userId, amount, method },
    });
  }

  /**
   * Notifie les admins d'une nouvelle demande KYC
   */
  static async notifyNewKYC(userId: string, username: string, kycType: string) {
    await this.notifyAdmins({
      type: NotificationType.KYC_UPDATE,
      priority: NotificationPriority.HIGH,
      titleFr: "Nouvelle vérification KYC",
      titleEn: "New KYC verification",
      titleCn: "新的KYC验证",
      messageFr: `${username} a soumis une vérification KYC (${kycType})`,
      messageEn: `${username} submitted a KYC verification (${kycType})`,
      messageCn: `${username} 提交了KYC验证 (${kycType})`,
      link: `/admin/dashboard?tab=kyc`,
      metadata: { userId, kycType, event: "submitted" },
    });
  }

  static async notifyKycApproved(userId: string, username: string) {
    await this.notifyAdmins({
      type: NotificationType.KYC_UPDATE,
      priority: NotificationPriority.NORMAL,
      titleFr: "KYC approuvé",
      titleEn: "KYC approved",
      titleCn: "KYC已通过",
      messageFr: `Le dossier KYC de ${username} a été approuvé`,
      messageEn: `${username}'s KYC application was approved`,
      messageCn: `${username} 的KYC申请已通过`,
      link: `/admin/users/${userId}`,
      metadata: { userId, event: "approved" },
    });
  }

  static async notifyKycRejected(userId: string, username: string, reason?: string) {
    await this.notifyAdmins({
      type: NotificationType.KYC_UPDATE,
      priority: NotificationPriority.HIGH,
      titleFr: "KYC refusé",
      titleEn: "KYC rejected",
      titleCn: "KYC被拒绝",
      messageFr: reason
        ? `Le dossier KYC de ${username} a été refusé : ${reason}`
        : `Le dossier KYC de ${username} a été refusé`,
      messageEn: reason
        ? `${username}'s KYC application was rejected: ${reason}`
        : `${username}'s KYC application was rejected`,
      messageCn: reason
        ? `${username} 的KYC申请被拒绝：${reason}`
        : `${username} 的KYC申请被拒绝`,
      link: `/admin/dashboard?tab=kyc`,
      metadata: { userId, event: "rejected", reason },
    });
  }

  static async notifyPayoutPendingApproval(
    payoutId: string,
    userId: string,
    username: string,
    amount: number,
    method: string,
  ) {
    const amountEur = (amount / 100).toFixed(2);

    await this.notifyAdmins({
      type: NotificationType.PAYOUT_UPDATE,
      priority: NotificationPriority.HIGH,
      titleFr: "Retrait en attente d'approbation",
      titleEn: "Withdrawal pending approval",
      titleCn: "提现待批准",
      messageFr: `${username} demande un retrait de ${amountEur}€ via ${method} — approbation requise`,
      messageEn: `${username} requests a withdrawal of €${amountEur} via ${method} — approval required`,
      messageCn: `${username} 请求通过 ${method} 提取 ${amountEur}€ — 需要批准`,
      link: method === 'SEPA FR' ? '/admin/sepa-requests' : '/admin/dashboard?tab=payouts',
      metadata: { payoutId, userId, amount, method, event: "pending_approval" },
    });
  }

  /**
   * Notifie les admins d'une nouvelle demande d'affiliation
   */
  static async notifyNewAffiliateApplication(applicationId: string, userId: string, username: string) {
    await this.notifyAdmins({
      type: NotificationType.ADMIN_MESSAGE,
      priority: NotificationPriority.NORMAL,
      titleFr: "Nouvelle demande d'affiliation",
      titleEn: "New affiliate application",
      titleCn: "新的推广申请",
      messageFr: `${username} a soumis une demande d'affiliation`,
      messageEn: `${username} submitted an affiliate application`,
      messageCn: `${username} 提交了推广申请`,
      link: `/admin/affiliate-applications`,
      metadata: { applicationId, userId },
    });
  }

  /**
   * Notifie les admins d'un paiement échoué
   */
  static async notifyPayoutFailed(payoutId: string, userId: string, username: string, amount: number, reason: string) {
    const amountEur = (amount / 100).toFixed(2);
    
    await this.notifyAdmins({
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.URGENT,
      titleFr: "Échec de paiement",
      titleEn: "Payout failed",
      titleCn: "付款失败",
      messageFr: `Échec du paiement de ${amountEur}€ pour ${username}: ${reason}`,
      messageEn: `Payout of €${amountEur} failed for ${username}: ${reason}`,
      messageCn: `${username} 的 ${amountEur}€ 付款失败: ${reason}`,
      link: `/admin/dashboard?tab=payouts`,
      metadata: { payoutId, userId, amount, reason },
    });
  }

  /**
   * Notifie les admins d'une activité suspecte
   */
  static async notifySuspiciousActivity(userId: string, username: string, activityType: string, details: string) {
    await this.notifyAdmins({
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.URGENT,
      titleFr: "Activité suspecte détectée",
      titleEn: "Suspicious activity detected",
      titleCn: "检测到可疑活动",
      messageFr: `${username}: ${activityType} - ${details}`,
      messageEn: `${username}: ${activityType} - ${details}`,
      messageCn: `${username}: ${activityType} - ${details}`,
      link: `/admin/users/${userId}`,
      metadata: { userId, activityType, details },
    });
  }

  /**
   * Notifie les admins d'un giveaway terminé
   */
  static async notifyGiveawayEnded(giveawayId: string, giveawayName: string, winnersCount: number) {
    await this.notifyAdmins({
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      priority: NotificationPriority.LOW,
      titleFr: "Giveaway terminé",
      titleEn: "Giveaway ended",
      titleCn: "抽奖结束",
      messageFr: `Le giveaway "${giveawayName}" est terminé avec ${winnersCount} gagnant(s)`,
      messageEn: `Giveaway "${giveawayName}" ended with ${winnersCount} winner(s)`,
      messageCn: `抽奖 "${giveawayName}" 已结束，有 ${winnersCount} 位获胜者`,
      link: `/admin/giveaways`,
      metadata: { giveawayId, winnersCount },
    });
  }

  /**
   * Notifie l'utilisateur d'une mise à jour de son trade
   */
  static async notifyUserTradeUpdate(userId: string, tradeId: string, status: string, message: string) {
    await this.createNotification({
      userId,
      type: NotificationType.TRADE_UPDATE,
      priority: status === "PAID" ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      titleFr: "Mise à jour de votre trade",
      titleEn: "Trade update",
      titleCn: "交易更新",
      messageFr: message,
      messageEn: message,
      messageCn: message,
      link: `/dashboard`,
      metadata: { tradeId, status },
    });
  }

  /**
   * Notifie l'utilisateur d'une mise à jour de son payout
   */
  static async notifyUserPayoutUpdate(userId: string, payoutId: string, status: string, message: string) {
    await this.createNotification({
      userId,
      type: NotificationType.PAYOUT_UPDATE,
      priority: status === "PAID" ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      titleFr: "Mise à jour de votre paiement",
      titleEn: "Payout update",
      titleCn: "付款更新",
      messageFr: message,
      messageEn: message,
      messageCn: message,
      link: `/dashboard`,
      metadata: { payoutId, status },
    });
  }
}
