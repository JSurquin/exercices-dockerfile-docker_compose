import type { NextRequest } from 'next/server';
import { isProductionApp } from '@/lib/env-production';

/**
 * Vérifie `Authorization: Bearer <CRON_SECRET>`.
 * En production : CRON_SECRET obligatoire, pas de contournement.
 * En non-production : si CRON_SECRET est défini, le bearer doit correspondre ; sinon l'appel est autorisé (dev local).
 */
export function requireCronSecret(request: NextRequest):
  | { ok: true }
  | { ok: false; status: number; message: string } {
  const isProd = isProductionApp();
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (isProd) {
    if (!secret) {
      return { ok: false, status: 503, message: 'CRON_SECRET requis en production' };
    }
    if (authHeader !== `Bearer ${secret}`) {
      return { ok: false, status: 401, message: 'Non autorisé' };
    }
    return { ok: true };
  }

  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      return { ok: false, status: 401, message: 'Non autorisé' };
    }
  }
  return { ok: true };
}
