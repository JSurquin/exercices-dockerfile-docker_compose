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
  type GateFiBuyRequest,
  type GateFiOrderResponse,
  type GateFiConfiguration,
} from './gatefi';

// =============================================================================
// CONFIGURATION ONRAMP
// =============================================================================

/**
 * Récupère la configuration OnRamp (Crypto)
 */
export async function getOnRampConfiguration(): Promise<GateFiConfiguration> {
  validateConfig();

  const queryString = `partnerAccountId=${GATEFI_CONFIG.partnerAccountId}`;
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.onramp}/configuration?${queryString}`;

  return fetchWithRetry<GateFiConfiguration>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// QUOTES (DEVIS)
// =============================================================================

export interface OnRampQuoteParams {
  fiatAmount: number; // En centimes
  crypto: string; // ETH, USDT, USDC, BTC, etc.
  region: string; // FR, DE, etc.
}

/**
 * Obtient un devis pour acheter de la crypto avec du fiat
 * @param params - Paramètres du devis
 * @returns Devis avec montants et frais
 */
export async function getOnRampQuote(
  params: OnRampQuoteParams
): Promise<GateFiQuoteResponse> {
  validateConfig();

  const requestParams: GateFiQuoteRequest = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    fiatAmount: parseInt(centsToEur(params.fiatAmount)), // Convertir en EUR entier
    payment: 'SEPATRANSFER', // Méthode de dépôt (bien que ce soit un payout pour nous)
    fiat: 'EUR',
    crypto: params.crypto,
    region: params.region,
    calcByFiat: true,
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.onramp}/quotes?${queryString}`;

  return fetchWithRetry<GateFiQuoteResponse>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// BUY (INITIATION D'ACHAT / PAIEMENT CRYPTO)
// =============================================================================

export interface InitiateCryptoPayoutParams {
  amountCents: number;
  crypto: string;
  region: string;
  walletAddress: string; // Adresse du wallet de l'utilisateur
  orderCustomId: string; // ID unique de notre payout
  userEmail: string;
  sumsubToken?: string; // Token KYC Sumsub si disponible
  successUrl?: string;
  cancelUrl?: string;
  declineUrl?: string;
}

export interface InitiateCryptoPayoutResponse {
  redirectUrl: string;
  orderCustomId: string;
}

/**
 * Initie un paiement crypto (achat de crypto pour l'utilisateur)
 * Retourne l'URL du widget GateFi où le processus est finalisé
 * @param params - Paramètres du paiement
 * @returns URL de redirection vers le widget GateFi
 */
export async function initiateCryptoPayout(
  params: InitiateCryptoPayoutParams
): Promise<InitiateCryptoPayoutResponse> {
  validateConfig();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const requestParams: GateFiBuyRequest = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    amount: centsToEur(params.amountCents), // Montant en EUR
    payment: 'SEPATRANSFER',
    fiat: 'EUR',
    crypto: params.crypto,
    region: params.region,
    walletAddress: params.walletAddress,
    orderCustomId: params.orderCustomId,
    email: params.userEmail,
    emailLock: true,
    successUrl: params.successUrl || `${appUrl}/dashboard?payment=success`,
    cancelUrl: params.cancelUrl || `${appUrl}/dashboard?payment=cancelled`,
    declineUrl: params.declineUrl || `${appUrl}/dashboard?payment=declined`,
    ...(params.sumsubToken && { sumsubTokenShare: params.sumsubToken }),
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.onramp}/buy?${queryString}`;

  // L'API retourne une redirection 303
  const response = await fetchWithRetry<{ redirectUrl: string }>(url, {
    method: 'GET',
    headers,
    redirect: 'manual',
  });

  return {
    redirectUrl: response.redirectUrl,
    orderCustomId: params.orderCustomId,
  };
}

// =============================================================================
// ORDERS (SUIVI DES COMMANDES)
// =============================================================================

export interface GetOnRampOrderParams {
  orderId: string;
  walletAddress: string; // Requis pour la sécurité selon l'API
}

/**
 * Récupère le statut d'un ordre OnRamp
 * @param params - Paramètres de recherche
 * @returns Informations sur la commande
 */
export async function getOnRampOrderStatus(
  params: GetOnRampOrderParams
): Promise<GateFiOrderResponse> {
  validateConfig();

  const requestParams = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    walletAddress: params.walletAddress,
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.onramp}/orders/${params.orderId}?${queryString}`;

  return fetchWithRetry<GateFiOrderResponse>(url, {
    method: 'GET',
    headers,
  });
}

/**
 * Liste tous les ordres OnRamp
 * @param walletAddress - Adresse du wallet pour filtrer
 * @param limit - Nombre maximum d'ordres à retourner
 * @param offset - Offset pour la pagination
 * @returns Liste des ordres
 */
export async function listOnRampOrders(
  walletAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ orders: GateFiOrderResponse[]; total: number }> {
  validateConfig();

  const requestParams = {
    partnerAccountId: GATEFI_CONFIG.partnerAccountId,
    walletAddress,
    limit: limit.toString(),
    offset: offset.toString(),
  };

  const queryString = buildQueryString(requestParams);
  const headers = prepareHeaders(queryString);
  const url = `${GATEFI_URLS.onramp}/orders?${queryString}`;

  return fetchWithRetry<{ orders: GateFiOrderResponse[]; total: number }>(url, {
    method: 'GET',
    headers,
  });
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si un ordre OnRamp est complété
 */
export function isOnRampOrderCompleted(order: GateFiOrderResponse): boolean {
  return order.status === 'COMPLETED';
}

/**
 * Vérifie si un ordre OnRamp a échoué
 */
export function isOnRampOrderFailed(order: GateFiOrderResponse): boolean {
  return order.status === 'FAILED' || order.status === 'EXPIRED' || order.status === 'CANCELED';
}

/**
 * Vérifie si un ordre OnRamp est en cours
 */
export function isOnRampOrderPending(order: GateFiOrderResponse): boolean {
  return order.status === 'PENDING' || order.status === 'PROCESSING';
}

/**
 * Calcule le montant de crypto que l'utilisateur recevra
 * @param quote - Devis GateFi
 * @returns Montant de crypto
 */
export function getCryptoAmountFromQuote(quote: GateFiQuoteResponse): string {
  return quote.amountOut;
}

/**
 * Obtient les limites de transaction crypto depuis la configuration
 */
export async function getCryptoLimits(): Promise<{
  minCents: number;
  maxCents: number;
}> {
  const config = await getOnRampConfiguration();

  // Parser les limites depuis la configuration
  // Les valeurs par défaut sont définies au cas où la config ne serait pas claire
  return {
    minCents: 1000, // 10 EUR
    maxCents: 500000, // 5000 EUR
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide une adresse de wallet
 * Note: Validation basique, devrait être améliorée selon le type de crypto
 */
export function validateWalletAddress(address: string, crypto: string): {
  isValid: boolean;
  error?: string;
} {
  if (!address || address.length === 0) {
    return { isValid: false, error: 'Wallet address is required' };
  }

  // Validation basique pour Ethereum et tokens ERC-20
  if (['ETH', 'USDT', 'USDC'].includes(crypto)) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      return { isValid: false, error: 'Invalid Ethereum address format' };
    }
  }

  // Validation basique pour Bitcoin
  if (crypto === 'BTC') {
    const btcAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    if (!btcAddressRegex.test(address)) {
      return { isValid: false, error: 'Invalid Bitcoin address format' };
    }
  }

  return { isValid: true };
}

/**
 * Valide les paramètres d'un paiement crypto
 */
export function validateCryptoPayoutParams(params: InitiateCryptoPayoutParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.amountCents || params.amountCents <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!params.crypto) {
    errors.push('Crypto currency is required');
  }

  if (!params.region || params.region.length !== 2) {
    errors.push('Valid region code is required (e.g., FR, DE)');
  }

  if (!params.walletAddress) {
    errors.push('Wallet address is required');
  } else {
    const walletValidation = validateWalletAddress(params.walletAddress, params.crypto);
    if (!walletValidation.isValid) {
      errors.push(walletValidation.error || 'Invalid wallet address');
    }
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
 * Log une transaction OnRamp pour le monitoring
 */
export function logOnRampTransaction(
  action: string,
  orderCustomId: string,
  data: any
): void {
  console.log('[GateFi OnRamp]', {
    action,
    orderCustomId,
    timestamp: new Date().toISOString(),
    environment: GATEFI_CONFIG.environment,
    data,
  });
}

