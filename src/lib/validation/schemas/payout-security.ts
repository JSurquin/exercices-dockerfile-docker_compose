import { z } from 'zod';

/** POST enable/disable 2FA — mot de passe optionnel selon résolution Steam */
export const twoFactorPasswordBodySchema = z
  .object({
    password: z.union([z.string(), z.number(), z.null()]).optional(),
  })
  .strip();

export const verifyTotpBodySchema = z
  .object({
    code: z.union([z.string(), z.number()]).optional(),
    trustDevice: z.union([z.boolean(), z.string(), z.number()]).optional(),
  })
  .strip();

export const missionClaimPostSchema = z
  .object({
    missionKey: z.string().min(1, 'missionKey requis'),
  })
  .strip();

export const payoutInitiatePostSchema = z
  .object({
    tradeId: z.string().min(1, 'tradeId is required'),
  })
  .strip();
