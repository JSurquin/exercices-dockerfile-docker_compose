import { prisma } from '~/prisma/prisma';

/** Steam trade offer IDs are numeric strings (never 0). */
export function normalizeSteamTradeOfferId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    return String(Math.trunc(value));
  }
  const raw = String(value).trim();
  if (!raw || raw === 'null' || raw === 'undefined' || raw === '0') return null;
  if (!/^\d+$/.test(raw)) return null;
  return raw;
}

function fromRecord(record: Record<string, unknown>): string | null {
  return normalizeSteamTradeOfferId(
    record.tradeofferid ?? record.trade_offer_id ?? record.tradeoffer_id
  );
}

/**
 * Lit un Steam trade offer id depuis une réponse Skinplace, un objet steamtrade,
 * un tableau d’offres, ou une valeur brute (query IPN).
 */
export function extractSteamTradeOfferId(source: unknown): string | null {
  if (source == null) return null;
  if (typeof source !== 'object') {
    return normalizeSteamTradeOfferId(source);
  }
  if (Array.isArray(source)) {
    for (const entry of source) {
      const id = extractSteamTradeOfferId(entry);
      if (id) return id;
    }
    return null;
  }

  const record = source as Record<string, unknown>;
  const direct = fromRecord(record);
  if (direct) return direct;

  if (record.steamtrade != null) {
    const nested = extractSteamTradeOfferId(record.steamtrade);
    if (nested) return nested;
  }
  if (record.data != null) {
    const nested = extractSteamTradeOfferId(record.data);
    if (nested) return nested;
  }
  return null;
}

/** Enregistre l’ID Steam s’il est encore inconnu (ne l’écrase pas). */
export async function persistSteamTradeOfferIdIfMissing(
  tradeId: string,
  offerId: string | null | undefined
): Promise<void> {
  const normalized = normalizeSteamTradeOfferId(offerId);
  if (!normalized) return;
  await prisma.trade.updateMany({
    where: { id: tradeId, steamTradeOfferId: null },
    data: { steamTradeOfferId: normalized },
  });
}
