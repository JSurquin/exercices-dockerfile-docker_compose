import { z } from 'zod';

/** Steam ID64 — 7656119 + 10 digits */
export const steamId64Schema = z.string().regex(/^7656119[0-9]{10}$/, 'Format de Steam ID64 invalide');

/** ID Prisma @default(cuid()) */
export const cuidSchema = z
  .string()
  .min(1)
  .regex(/^c[a-z0-9]{20,}$/i, 'Identifiant invalide');

/** Pagination query : mêmes défauts que parseInt(x ?? '1') / '20' */
export const paginationSchema = z
  .object({
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

/** Query notifications — aligné sur user/notifications GET */
export const notificationsListQuerySchema = z
  .object({
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
    unreadOnly: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
  })
  .strip();
