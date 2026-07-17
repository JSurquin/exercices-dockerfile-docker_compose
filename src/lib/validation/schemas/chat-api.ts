import { z } from 'zod';

export const securityCheckPostSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('trade') }).strip(),
  z
    .object({
      type: z.literal('payout'),
      amountCents: z.coerce.number().int().positive(),
      paymentMethodId: z.string().min(1),
    })
    .strip(),
]);

export const steamEstimatePricesSchema = z
  .object({
    market_hash_names: z.array(z.string()),
  })
  .strip();

export const createConversationPostSchema = z
  .object({
    subject: z.string().optional(),
    category: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    initialMessage: z.string().min(1, 'Message initial requis'),
  })
  .strip();

export const createChatMessageSchema = z
  .object({
    conversationId: z.string().min(1, 'ID de conversation requis').optional(),
    content: z.string().trim().optional(),
    attachmentUrl: z.string().trim().max(512).optional(),
    senderType: z.enum(['USER', 'BOT', 'MODERATOR', 'SYSTEM']).optional(),
    category: z.string().max(64).optional(),
    forceNew: z.boolean().optional(),
    skipAi: z.boolean().optional(),
    replyContext: z.enum(['widget', 'moderation']).optional(),
    locale: z.enum(['fr', 'en', 'cn']).optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasContent = Boolean(data.content && data.content.length > 0);
    const hasAttachment = Boolean(data.attachmentUrl && data.attachmentUrl.length > 0);
    if (!hasContent && !hasAttachment) {
      ctx.addIssue({
        code: 'custom',
        message: 'Contenu du message ou image requis',
        path: ['content'],
      });
    }
  });

export const conversationMessagesQuerySchema = z
  .object({
    scope: z.enum(['widget', 'staff']).optional().default('widget'),
    /** Langue de l’interface du lecteur (traduction staff ↔ client). */
    locale: z.enum(['fr', 'en', 'cn']).optional(),
    cursor: z.string().max(128).optional(),
    /** true uniquement quand le client consulte activement le fil (évite de marquer lu en polling). */
    markRead: z
      .enum(['true', 'false'])
      .optional()
      .transform((s) => s === 'true'),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 30 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(100)),
  })
  .strip();

export const patchConversationSchema = z
  .object({
    status: z.enum(['ACTIVE', 'CLOSED', 'ARCHIVED', 'DELETED']),
    subject: z.string().max(200).optional(),
    conversationId: z.string().optional(),
  })
  .strip();

export const assignConversationPostSchema = z
  .object({
    moderatorId: z.string().min(1),
    conversationId: z.string().optional(),
  })
  .strip();

export const botSubcategoryPostSchema = z
  .object({
    subcategoryKey: z.string().min(1, 'subcategoryKey requis'),
  })
  .strip();

export const rateConversationPostSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    feedback: z.string().trim().max(2000).optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasRating = data.rating != null;
    const hasFeedback = data.feedback != null && data.feedback !== '';
    if (!hasRating && !hasFeedback) {
      ctx.addIssue({
        code: 'custom',
        message: 'Note ou commentaire requis',
        path: ['rating'],
      });
    }
  });

export const chatAccessScopeQuerySchema = z
  .object({
    /** widget = fil client (défaut) ; staff = backoffice modération */
    scope: z.enum(['widget', 'staff']).optional().default('widget'),
    /** Langue de l’interface du lecteur (traduction staff ↔ client). */
    locale: z.enum(['fr', 'en', 'cn']).optional(),
  })
  .strip();

/** GET /api/chat/conversations — filtres + pagination */
export const chatConversationsQuerySchema = z
  .object({
    scope: z.enum(['widget', 'staff']).optional().default('widget'),
    status: z.string().max(32).optional(),
    assignedTo: z.string().max(128).optional(),
    category: z.string().max(64).optional(),
    priority: z.string().max(32).optional(),
    userId: z.string().max(128).optional(),
    search: z.string().max(500).optional(),
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(100)),
    /** Invité : IDs locaux séparés par des virgules (max 20). */
    ids: z.string().max(2000).optional(),
  })
  .strip();

/** GET /api/chat/feedback — notes et commentaires clients */
export const chatFeedbackQuerySchema = z
  .object({
    /** mine = uniquement les conversations assignées (défaut modérateur) ; all = tout (admin) */
    scope: z.enum(['mine', 'all']).optional().default('all'),
    page: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 1 : parseInt(s, 10)))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === '' ? 20 : parseInt(s, 10)))
      .pipe(z.number().int().min(1).max(100)),
  })
  .strip();
