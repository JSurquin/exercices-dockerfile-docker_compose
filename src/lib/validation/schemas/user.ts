import { z } from 'zod';
import { steamId64Schema } from '@/lib/validation/schemas/common';

const steamTradeOfferNew = z
  .string()
  .regex(
    /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/,
    'Format de Trade Link Steam invalide'
  );

/**
 * Corps POST /api/user/update — inconnu ignoré (.strip équivalent comportement précédent).
 * Au moins un champ doit être présent pour coller au message métier historique.
 */
export const userUpdateBodySchema = z
  .object({
    name: z.string().optional(),
    tradeLink: z.union([z.literal(''), steamTradeOfferNew, z.null()]).optional(),
    steamId64: steamId64Schema.optional(),
    steamId: steamId64Schema.optional(),
  })
  .strip()
  .refine(
    (data) =>
      Object.keys(data).some((key) => {
        const v = data[key as keyof typeof data];
        return v !== undefined;
      }),
    { message: 'Aucun champ autorisé à mettre à jour' }
  );

export const notificationMarkReadSchema = z
  .object({
    notificationId: z.string().min(1, 'notificationId requis'),
  })
  .strip();

export const notificationPreferencesPutSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    tradeAlerts: z.boolean().optional(),
    payoutAlerts: z.boolean().optional(),
    kycAlerts: z.boolean().optional(),
    giveawayAlerts: z.boolean().optional(),
    missionAlerts: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    systemAnnouncements: z.boolean().optional(),
  })
  .strip();

/** POST sans corps exploitable — bloque mass assignment */
export const emptyObjectBodySchema = z.object({}).strict();
