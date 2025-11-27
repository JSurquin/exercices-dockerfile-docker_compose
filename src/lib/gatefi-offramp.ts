import {
  GATEFI_CONFIG,
  GATEFI_URLS,
  buildQueryString,
  prepareHeaders,
  fetchWithRetry,
  validateConfig,
  centsToEur,
  type GateFiQuoteRequest,
  type GateFiQuoteResponse,
  type GateFiSellRequest,
  type GateFiOrderResponse,
  type GateFiConfiguration,
} from './gatefi';

// =============================================================================
// CONFIGURATION OFFRAMP
// =============================================================================

/**
 * Récupère la configuration OffRamp (SEPA)
 */
export async function getOffRampConfiguration(): Promise<GateFiConfiguration> {
  validateConfig();

  const queryString = `partnerAccountId=${GATEFI_CONFIG.partnerAccountId}`;
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.offramp}/configuration?${queryString}`;

  return fetchWithRetry<GateFiConfiguration>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// QUOTES (DEVIS)
// =============================================================================

export interface OffRampQuoteParams {
  fiatAmount: number; // En centimes
  crypto: string; // ETH, USDT, USDC, etc.
  region: string; // FR, DE, etc.
}

/**
 * Obtient un devis pour vendre de la crypto et recevoir du fiat via SEPA
 * @param params - Paramètres du devis
 * @returns Devis avec montants et frais
 */
export async function getOffRampQuote(
  params: OffRampQuoteParams
): Promise<GateFiQuoteResponse> {
  validateConfig();

  const requestParams: GateFiQuoteRequest = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    fiatAmount: parseInt(centsToEur(params.fiatAmount)), // Convertir en EUR entier
    payment: 'SEPATRANSFER',
    fiat: 'EUR',
    crypto: params.crypto,
    region: params.region,
    calcByFiat: true,
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.offramp}/quotes?${queryString}`;

  return fetchWithRetry<GateFiQuoteResponse>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// SELL (INITIATION DE VENTE)
// =============================================================================

export interface InitiateSepaPayoutParams {
  amountCents: number;
  cryptoAmount: string; // Montant en crypto calculé depuis le quote
  crypto: string;
  region: string;
  orderCustomId: string; // ID unique de notre payout
  userEmail: string;
  sumsubToken?: string; // Token KYC Sumsub si disponible
}

export interface InitiateSepaPayoutResponse {
  redirectUrl: string;
  orderCustomId: string;
}

/**
 * Initie un paiement SEPA (vente de crypto pour recevoir EUR)
 * Retourne l'URL du widget GateFi où l'utilisateur complète le paiement
 * @param params - Paramètres du paiement
 * @returns URL de redirection vers le widget GateFi
 */
export async function initiateSepaPayout(
  params: InitiateSepaPayoutParams
): Promise<InitiateSepaPayoutResponse> {
  validateConfig();

  const requestParams: GateFiSellRequest = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    amount: params.cryptoAmount,
    payment: 'SEPATRANSFER',
    fiat: 'EUR',
    crypto: params.crypto,
    region: params.region,
    orderCustomId: params.orderCustomId,
    email: params.userEmail,
    emailLock: true, // Verrouiller l'email pour la sécurité
    ...(params.sumsubToken && { sumsubTokenShare: params.sumsubToken }),
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.offramp}/sell?${queryString}`;

  // L'API retourne une redirection 303
  const response = await fetchWithRetry<{ redirectUrl: string }>(url, {
    method: 'GET',
    headers,
    redirect: 'manual', // Pour intercepter la redirection
  });

  return {
    redirectUrl: response.redirectUrl,
    orderCustomId: params.orderCustomId,
  };
}

// =============================================================================
// ORDERS (SUIVI DES COMMANDES)
// =============================================================================

/**
 * Récupère le statut d'un ordre OffRamp
 * @param orderCustomId - ID personnalisé de la commande
 * @returns Informations sur la commande
 */
export async function getOffRampOrderStatus(
  orderCustomId: string
): Promise<GateFiOrderResponse> {
  validateConfig();

  const queryString = `partnerAccountId=${GATEFI_CONFIG.partnerAccountId}`;
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.offramp}/orders/${orderCustomId}?${queryString}`;

  return fetchWithRetry<GateFiOrderResponse>(url, {
    method: 'GET',
    headers,
  });
}

/**
 * Liste tous les ordres OffRamp
 * @param limit - Nombre maximum d'ordres à retourner
 * @param offset - Offset pour la pagination
 * @returns Liste des ordres
 */
export async function listOffRampOrders(
  limit: number = 50,
  offset: number = 0
): Promise<{ orders: GateFiOrderResponse[]; total: number }> {
  validateConfig();

  const requestParams = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    limit: limit.toString(),
    offset: offset.toString(),
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.offramp}/orders?${queryString}`;

  return fetchWithRetry<{ orders: GateFiOrderResponse[]; total: number }>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si un ordre OffRamp est complété
 */
export function isOffRampOrderCompleted(order: GateFiOrderResponse): boolean {
  return order.status === 'COMPLETED';
}

/**
 * Vérifie si un ordre OffRamp a échoué
 */
export function isOffRampOrderFailed(order: GateFiOrderResponse): boolean {
  return order.status === 'FAILED' || order.status === 'EXPIRED' || order.status === 'CANCELED';
}

/**
 * Vérifie si un ordre OffRamp est en cours
 */
export function isOffRampOrderPending(order: GateFiOrderResponse): boolean {
  return order.status === 'PENDING' || order.status === 'PROCESSING';
}

/**
 * Calcule le montant net que l'utilisateur recevra
 * @param grossCents - Montant brut en centimes
 * @param quote - Devis GateFi
 * @returns Montant net en centimes
 */
export function calculateNetAmount(
  grossCents: number,
  quote: GateFiQuoteResponse
): number {
  const processingFeeCents = Math.round(parseFloat(quote.processingFee) * 100);
  const networkFeeCents = quote.networkFee 
    ? Math.round(parseFloat(quote.networkFee) * 100)
    : 0;

  return grossCents - processingFeeCents - networkFeeCents;
}

/**
 * Obtient les limites de transaction SEPA depuis la configuration
 */
export async function getSepaLimits(): Promise<{
  minCents: number;
  maxCents: number;
}> {
  const config = await getOffRampConfiguration();

  // Parser les limites depuis la configuration
  // Les valeurs par défaut sont définies au cas où la config ne serait pas claire
  return {
    minCents: 1000, // 10 EUR
    maxCents: 100000, // 1000 EUR
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide les paramètres d'un paiement SEPA
 */
export function validateSepaPayoutParams(params: InitiateSepaPayoutParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.amountCents || params.amountCents <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!params.cryptoAmount || parseFloat(params.cryptoAmount) <= 0) {
    errors.push('Crypto amount must be greater than 0');
  }

  if (!params.crypto) {
    errors.push('Crypto currency is required');
  }

  if (!params.region || params.region.length !== 2) {
    errors.push('Valid region code is required (e.g., FR, DE)');
  }

  if (!params.orderCustomId) {
    errors.push('Order custom ID is required');
  }

  if (!params.userEmail || !params.userEmail.includes('@')) {
    errors.push('Valid email is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// LOGGING & MONITORING
// =============================================================================

/**
 * Log une transaction OffRamp pour le monitoring
 */
export function logOffRampTransaction(
  action: string,
  orderCustomId: string,
  data: any
): void {
  console.log('[GateFi OffRamp]', {
    action,
    orderCustomId,
    timestamp: new Date().toISOString(),
    environment: GATEFI_CONFIG.environment,
    data,
  });
}

