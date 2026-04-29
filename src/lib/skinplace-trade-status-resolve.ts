import type { TradeStatus } from '@prisma/client';

export type SkinplaceTradeStatusDebug = {
  steamtradeStatus: string | null;
  paymentStatus: string | null;
  protectionStatus: string | null;
  /** Court libellé pour logs / UI (ex. payment.status gagne sur steamtrade.finished) */
  effectiveSource: string;
};

/**
 * Interprète la réponse Skinplace GET /api/v3/instant/payment/trade/{token}
 * (et les entrées équivalentes dans instant/history).
 *
 * Règle métier : `payment.status === cancelled` doit pouvoir primer sur
 * `steamtrade.status === finished` (offre acceptée puis annulation / rollback côté paiement).
 */
export function resolveMoonSkinTradeStatusFromSkinplaceApi(
  data: unknown
): { status: TradeStatus; debug: SkinplaceTradeStatusDebug } {
  const root = data as Record<string, unknown> | null | undefined;

  // L'endpoint GET /api/v3/instant/payment/trade/{token} enveloppe la réponse dans { data: {...}, status: "success" }
  // Certaines entrées de /instant/history n'ont pas cette enveloppe — on gère les deux cas
  const d = (root?.data != null
    ? (root.data as Record<string, unknown>)
    : root) as Record<string, unknown> | null | undefined;

  const steamtrade = d?.steamtrade as Record<string, unknown> | null | undefined;
  const payment = d?.payment as Record<string, unknown> | null | undefined;

  const rawSt = steamtrade?.status;
  const rawPs = payment?.status;
  const rawProt = payment?.protection_status;

  const steamtradeStatus =
    typeof rawSt === 'string' ? rawSt.toLowerCase() : null;
  const paymentStatus = typeof rawPs === 'string' ? rawPs.toLowerCase() : null;
  const protectionStatus =
    typeof rawProt === 'string' ? rawProt.toLowerCase() : null;

  const st = steamtradeStatus;
  const ps = paymentStatus;
  const prot = protectionStatus;

  // ─── Chemins « négatifs » en premier (priorité paiement / rollback) ───

  if (ps === 'cancelled') {
    return {
      status: 'CANCELLED',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'payment.status=cancelled',
      },
    };
  }

  if (st === 'cancelled') {
    return {
      status: 'CANCELLED',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'steamtrade.status=cancelled',
      },
    };
  }

  if (prot === 'rollback') {
    return {
      status: 'FAILED',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'payment.protection_status=rollback',
      },
    };
  }

  const failedSteam = new Set([
    'declined',
    'rejected',
    'expired',
    'failed',
    'error',
  ]);
  if (st && failedSteam.has(st)) {
    return {
      status: 'FAILED',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: `steamtrade.status=${st}`,
      },
    };
  }

  // ─── Chemins « positifs » (doc Skinplace : payment complete = trade réussi, fonds en hold) ───

  // protection_status=confirmed signifie que le hold de 8 jours est terminé,
  // les fonds sont définitivement libérés -> le trade est AVAILABLE pour payout
  if (prot === 'confirmed' && (ps === 'complete' || st === 'finished')) {
    return {
      status: 'AVAILABLE',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'protection_status=confirmed',
      },
    };
  }

  if (ps === 'complete') {
    return {
      status: 'IN_TRADE_HOLD',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'payment.status=complete',
      },
    };
  }

  if (st === 'finished') {
    return {
      status: 'IN_TRADE_HOLD',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'steamtrade.status=finished',
      },
    };
  }

  if (st === 'active') {
    return {
      status: 'ACCEPTED_BY_BOT',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: 'steamtrade.status=active',
      },
    };
  }

  if (st === 'pending' || st === 'sent') {
    return {
      status: 'CREATED',
      debug: {
        steamtradeStatus: st,
        paymentStatus: ps,
        protectionStatus: prot,
        effectiveSource: `steamtrade.status=${st}`,
      },
    };
  }

  // payment.status=active : paiement / trade encore en cours (sans champ steamtrade exploitable)
  if (ps === 'active') {
    if (st === 'pending' || st === 'sent' || !st) {
      return {
        status: 'CREATED',
        debug: {
          steamtradeStatus: st,
          paymentStatus: ps,
          protectionStatus: prot,
          effectiveSource: 'payment.status=active',
        },
      };
    }
  }

  return {
    status: 'CREATED',
    debug: {
      steamtradeStatus: st,
      paymentStatus: ps,
      protectionStatus: prot,
      effectiveSource: 'fallback_created',
    },
  };
}
