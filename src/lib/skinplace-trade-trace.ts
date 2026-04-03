/**
 * Logs structurés pour diagnostiquer tradelink_error / instant inventory Skinplace.
 * Préfixe fixe pour filtrer : grep "[MoonSkin/trade-link]"
 */

const PREFIX = '[MoonSkin/trade-link]';

export function maskSteamTradeToken(token: string): string {
  const t = token.trim();
  if (t.length <= 4) return `**** (len=${t.length})`;
  return `${t.slice(0, 2)}…${t.slice(-2)} (len=${t.length})`;
}

export function maskTradeOfferUrl(url: string): string {
  return url.replace(
    /(token=)([a-zA-Z0-9_-]+)/,
    (_, pre: string, tok: string) => `${pre}${maskSteamTradeToken(tok)}`,
  );
}

export function logTradeLinkTraceServer(payload: {
  phase: string;
  sessionUserId: string;
  sessionSteamId: string | null | undefined;
  dbUserSteamId: string | null | undefined;
  dbTradeLinkMasked: string | null | undefined;
  bodySteamId: string;
  bodyTradeUrlMasked: string;
  partnerIdFromUrl: string;
  tradeTokenMasked: string;
  urlsMatch: boolean | null;
  nextPublicAppUrl: string | undefined;
  webhookSecretConfigured: boolean;
  extra?: Record<string, unknown>;
}) {
  const {
    phase,
    sessionUserId,
    sessionSteamId,
    dbUserSteamId,
    dbTradeLinkMasked,
    bodySteamId,
    bodyTradeUrlMasked,
    partnerIdFromUrl,
    tradeTokenMasked,
    urlsMatch,
    nextPublicAppUrl,
    webhookSecretConfigured,
    extra,
  } = payload;

  console.log(`${PREFIX} ${phase}`, {
    sessionUserId,
    sessionSteamId,
    dbUserSteamId,
    steamIdsAligned:
      sessionSteamId === bodySteamId && dbUserSteamId === bodySteamId,
    dbTradeLinkMasked,
    bodyTradeUrlMasked,
    partnerIdFromUrl,
    tradeTokenForSkinplace: tradeTokenMasked,
    bodyMatchesDbTradeLink: urlsMatch,
    nextPublicAppUrl: nextPublicAppUrl || '(non défini)',
    webhookSecretConfigured,
    ...extra,
  });
}

export function logSkinplaceInstantResponse(trace: {
  ok: boolean;
  status?: string;
  error_message?: string;
  errorcode?: number;
  rawKeys?: string[];
}) {
  if (trace.ok) {
    console.log(`${PREFIX} réponse Skinplace OK`, { status: trace.status });
    return;
  }
  console.error(`${PREFIX} réponse Skinplace ERREUR`, {
    status: trace.status,
    error_message: trace.error_message,
    errorcode: trace.errorcode,
    hint:
      trace.error_message === 'tradelink_error'
        ? 'Skinplace: token trade invalide / lien non valide pour ce steamid (voir doc tradelink_error). Vérifier URL Steam à jour, même compte, inventaire public.'
        : undefined,
    rawKeys: trace.rawKeys,
  });
}

export function logClientTradePayload(payload: {
  steamId64: string;
  tradeUrlMasked: string;
  tradeUrlValid: boolean;
  userTradeLinkMasked: string | null | undefined;
  sameAsProfile: boolean;
}) {
  console.log(`${PREFIX} (client) envoi create-trade`, payload);
}
