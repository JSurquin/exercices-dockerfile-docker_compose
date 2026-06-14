import type { NextRequest } from 'next/server';
import { isProductionApp } from '@/lib/env-production';

/**
 * Vérifie `Authorization: Bearer <CRON_SECRET>` pour les appels HTTP externes (Vercel Cron, curl).
 * En développement local, préférer le worker `pnpm cron:worker` qui exécute la logique sans HTTP.
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
      message: 'CRON_SECRET requis — lancez pnpm cron:worker en local ou définissez CRON_SECRET',
    };
  }

  if (authHeader !== `Bearer ${secret}`) {
    return { ok: false, status: 401, message: 'Non autorisé' };
  }

  return { ok: true };
}
