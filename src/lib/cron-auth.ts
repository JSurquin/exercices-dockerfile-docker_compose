import type { NextRequest } from 'next/server';
import { isProductionApp } from '@/lib/env-production';

/**
 * Vérifie `Authorization: Bearer <CRON_SECRET>` pour un déclenchement HTTP manuel (curl, scripts ops).
 * Les tâches planifiées sont gérées par node-cron au démarrage du serveur (`pnpm start`).
 */
export function requireCronSecret(request: NextRequest):
  | { ok: true }
  | { ok: false; status: number; message: string } {
  const isProd = isProductionApp();
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!secret) {
    if (isProd) {
      return { ok: false, status: 503, message: 'CRON_SECRET requis en production' };
    }
    return {
      ok: false,
      status: 503,
      message: 'CRON_SECRET requis — définissez CRON_SECRET ou lancez pnpm start / pnpm dev',
    };
  }

  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false, status: 401, message: 'Non autorisé' };
  }

  return { ok: true };
}
