import { prisma } from '~/prisma/prisma';

/**
 * Système d'idempotence pour les webhooks.
 * Empêche le traitement multiple d'un même événement webhook.
 * 
 * Utilisation:
 * ```typescript
 * const allowed = await ensureWebhookIdempotency('flexify-tx-12345', 'flexify_payout');
 * if (!allowed) {
 *   return NextResponse.json({ message: 'Already processed' }, { status: 200 });
 * }
 * // ... traiter le webhook
 * await markWebhookProcessed('flexify-tx-12345', 'flexify_payout', { success: true });
 * ```
 */

export interface WebhookIdempotencyResult {
  allowed: boolean;
  existingEvent?: {
    id: string;
    processedAt: Date | null;
    status: string;
  };
}

/**
 * Vérifie si un webhook peut être traité (idempotence).
 * Crée un enregistrement avec status="processing" si nouveau.
 * 
 * @param webhookId - Identifiant unique du webhook (ex: transaction ID externe)
 * @param handler - Type de handler (ex: 'flexify_payout', 'skinplace_ipn')
 * @returns Promise<WebhookIdempotencyResult>
 */
export async function ensureWebhookIdempotency(
  webhookId: string,
  handler: string
): Promise<WebhookIdempotencyResult> {
  try {
    // Vérifier si déjà traité
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        webhookId_handler: {
          webhookId,
          handler,
        },
      },
      select: {
        id: true,
        processedAt: true,
        status: true,
      },
    });

    // Si déjà traité avec succès, bloquer
    if (existing && existing.processedAt && existing.status === 'completed') {
      return {
        allowed: false,
        existingEvent: existing,
      };
    }

    // Si en cours de traitement depuis > 5 minutes, permettre retry
    if (existing && existing.status === 'processing') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existing.processedAt && existing.processedAt < fiveMinutesAgo) {
        // Timeout, autoriser retry
        return { allowed: true, existingEvent: existing };
      }
      // Encore en cours, bloquer
      return { allowed: false, existingEvent: existing };
    }

    // Si échec précédent, autoriser retry
    if (existing && existing.status === 'failed') {
      return { allowed: true, existingEvent: existing };
    }

    // Nouveau webhook, créer l'enregistrement
    if (!existing) {
      await prisma.webhookEvent.create({
        data: {
          webhookId,
          handler,
          status: 'processing',
          receivedAt: new Date(),
        },
      });
    }

    return { allowed: true, existingEvent: existing ?? undefined };
  } catch (error) {
    console.error('Error in ensureWebhookIdempotency:', error);
    // En cas d'erreur, bloquer par sécurité
    return { allowed: false };
  }
}

/**
 * Marque un webhook comme traité avec succès ou échec.
 * 
 * @param webhookId - Identifiant unique du webhook
 * @param handler - Type de handler
 * @param result - Résultat du traitement (success, error, data)
 */
export async function markWebhookProcessed(
  webhookId: string,
  handler: string,
  result: {
    success: boolean;
    error?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await prisma.webhookEvent.upsert({
      where: {
        webhookId_handler: {
          webhookId,
          handler,
        },
      },
      create: {
        webhookId,
        handler,
        status: result.success ? 'completed' : 'failed',
        processedAt: new Date(),
        receivedAt: new Date(),
        errorMessage: result.error || null,
        metadata: result.data as object || null,
      },
      update: {
        status: result.success ? 'completed' : 'failed',
        processedAt: new Date(),
        errorMessage: result.error || null,
        metadata: result.data as object || null,
      },
    });
  } catch (error) {
    console.error('Error in markWebhookProcessed:', error);
    // Ne pas faire échouer le traitement principal
  }
}

/**
 * Nettoie les anciens événements webhook (> 90 jours).
 * À appeler périodiquement dans un cron de maintenance.
 */
export async function cleanupOldWebhookEvents(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.webhookEvent.deleteMany({
      where: {
        receivedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error in cleanupOldWebhookEvents:', error);
    return 0;
  }
}
