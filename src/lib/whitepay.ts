import crypto from 'crypto';

// =============================================================================
// CONFIGURATION WHITEPAY
// =============================================================================

export const WHITEPAY_CONFIG = {
  apiKey: process.env.WHITEPAY_API_KEY!,
  secretKey: process.env.WHITEPAY_SECRET_KEY!,
  baseUrl: process.env.WHITEPAY_BASE_URL || 'https://api.whitepay.com',
  callbackUrl: process.env.WHITEPAY_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/whitepay/webhook`,
  /** Durée max (en ms) avant expiration du taux — Whitepay impose 30s */
  rateExpirationMs: 30_000,
};

// =============================================================================
// TYPES — Statuts de transaction Whitepay
// =============================================================================

export type WhitepayTransactionStatus =
  | 'WAITING_CONFIRMATION'   // Créé, en attente de confirmation
  | 'PENDING_WITHDRAWAL'     // Confirmé, conversion en cours
  | 'PROCESSING_WITHDRAWAL'  // Envoyé sur la blockchain
  | 'COMPLETE'               // État final — succès
  | 'DECLINED';              // État final — refusé

// =============================================================================
// TYPES — Devises
// =============================================================================

export interface WhitepayCurrency {
  id: number;
  ticker: string;
  name: string;
  precision: number;
  is_fiat: boolean;
  is_stable: boolean;
}

// =============================================================================
// TYPES — Travel Rule (obligatoire EEE)
// =============================================================================

export interface WhitepayTravelRule {
  /** "individual" ou "entity" */
  type: 'individual' | 'entity';
  /** Nom de la plateforme de destination (ex: "Binance", "Self-custody") */
  vasp: string;
  /** Nom de l'individu ou de l'entité */
  name: string;
  /** Adresse physique du destinataire */
  address: string;
}

// =============================================================================
// TYPES — Requêtes
// =============================================================================

export interface WhitepayWithdrawalRequest {
  /** Montant en devise source (EUR) */
  amount: number;
  /** Ticker de la devise source (ex: "EUR") */
  currency: string;
  /** Ticker de la crypto cible (ex: "USDT", "BTC", "ETH") */
  target_currency: string;
  /** Réseau blockchain (ex: "ERC20", "TRC20", "BTC", "TON") */
  network: string;
  /** Adresse du wallet destinataire */
  address: string;
  /** Memo/tag (obligatoire pour TON, STELLAR, etc.) */
  memo?: string;
  /** Travel Rule (obligatoire pour les résidents EEE) */
  travel_rule?: WhitepayTravelRule;
  /** ID de commande interne pour idempotence */
  order_id?: string;
  /** URL de callback pour les mises à jour de statut */
  callback_url?: string;
}

/** Même structure que WhitepayWithdrawalRequest — le flux combine création + taux + confirmation */
export type WhitepayInstantWithdrawalRequest = WhitepayWithdrawalRequest;

export interface WhitepayConfirmRequest {
  /** ID de la transaction à confirmer */
  transaction_id: string;
}

export interface WhitepayRefreshRequest {
  /** ID de la transaction dont le taux a expiré */
  transaction_id: string;
}

// =============================================================================
// TYPES — Réponses
// =============================================================================

export interface WhitepayTransaction {
  id: string;
  status: WhitepayTransactionStatus;
  /** Taux de change appliqué */
  exchange_rate: string;
  /** Timestamp de l'estimation du taux */
  estimated_at: string;
  /** Montant dans la devise cible */
  target_value: string;
  /** Montant dans la devise source */
  source_value: string;
  /** Frais appliqués */
  fee: string;
  /** Devise source */
  currency: WhitepayCurrency;
  /** Devise cible */
  target_currency: WhitepayCurrency;
  /** Adresse wallet de destination */
  address: string;
  /** Memo/tag si fourni */
  memo?: string;
  /** Réseau blockchain */
  network: string;
  /** Hash de la transaction blockchain (disponible après PROCESSING_WITHDRAWAL) */
  tx_hash?: string;
  /** Nombre de confirmations blockchain */
  confirmations?: number;
  /** ID de commande interne */
  order_id?: string;
  /** Date de création */
  created_at: string;
  /** Date de dernière mise à jour */
  updated_at: string;
}

export interface WhitepayWithdrawalResponse {
  transaction: WhitepayTransaction;
}

export interface WhitepayConfirmResponse {
  transaction: WhitepayTransaction;
}

export interface WhitepayRefreshResponse {
  transaction: WhitepayTransaction;
}

export interface WhitepayInstantResponse {
  transaction: WhitepayTransaction;
}

export interface WhitepayStatusResponse {
  transaction: WhitepayTransaction;
}

// =============================================================================
// TYPES — Webhook
// =============================================================================

export interface WhitepayWebhookPayload {
  event: 'withdrawal.status_changed';
  transaction: WhitepayTransaction;
  timestamp: string;
}

// =============================================================================
// TYPES — Réseaux supportés
// =============================================================================

export interface WhitepaySupportedNetwork {
  id: string;
  name: string;
  ticker: string;
  /** true si un memo/tag est requis */
  requires_memo: boolean;
  /** Nombre de confirmations requises */
  confirmations_required: number;
  /** Frais réseau estimés */
  estimated_fee: string;
}

/** Réseaux nécessitant un memo obligatoire */
export const MEMO_REQUIRED_NETWORKS = ['TON', 'STELLAR', 'XLM', 'COSMOS', 'ATOM'];

/** Cryptos supportées pour les retraits Whitepay */
export const WHITEPAY_SUPPORTED_CRYPTOS = [
  { ticker: 'USDT', name: 'Tether', networks: ['ERC20', 'TRC20', 'BEP20', 'TON', 'SOL'], is_stable: true },
  { ticker: 'USDC', name: 'USD Coin', networks: ['ERC20', 'TRC20', 'BEP20', 'SOL'], is_stable: true },
  { ticker: 'BTC', name: 'Bitcoin', networks: ['BTC'], is_stable: false },
  { ticker: 'ETH', name: 'Ethereum', networks: ['ERC20'], is_stable: false },
  { ticker: 'SOL', name: 'Solana', networks: ['SOL'], is_stable: false },
  { ticker: 'TON', name: 'Toncoin', networks: ['TON'], is_stable: false },
  { ticker: 'BNB', name: 'BNB', networks: ['BEP20'], is_stable: false },
] as const;

// =============================================================================
// SIGNATURE HMAC
// =============================================================================

/**
 * Génère une signature HMAC-SHA256 pour les requêtes Whitepay
 */
function generateSignature(payload: string): string {
  return crypto
    .createHmac('sha256', WHITEPAY_CONFIG.secretKey)
    .update(payload)
    .digest('hex');
}

/**
 * Prépare les headers d'authentification pour l'API Whitepay
 */
function prepareHeaders(body?: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signaturePayload = `${timestamp}${body || ''}`;
  const signature = generateSignature(signaturePayload);

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WHITEPAY_CONFIG.apiKey}`,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  };
}

// =============================================================================
// REQUÊTE GÉNÉRIQUE AVEC RETRY + BACKOFF
// =============================================================================

/**
 * Effectue une requête vers l'API Whitepay avec retry exponentiel
 */
async function whitepayRequest<T>(
  method: string,
  path: string,
  body?: object,
  retries: number = 3
): Promise<T> {
  const url = `${WHITEPAY_CONFIG.baseUrl}${path}`;
  const bodyString = body ? JSON.stringify(body) : undefined;
  const headers = prepareHeaders(bodyString);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || JSON.stringify(data);
        throw new WhitepayApiError(
          `Whitepay API error: ${response.status} - ${errorMessage}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof WhitepayApiError) {
        // Ne pas retry les erreurs 4xx (sauf 429 rate limit)
        if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }
      }
      if (attempt === retries) throw error;
      // Backoff exponentiel: 200ms, 400ms, 800ms...
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw new Error('Whitepay request failed after retries');
}

// =============================================================================
// ERREUR PERSONNALISÉE
// =============================================================================

export class WhitepayApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseData?: unknown
  ) {
    super(message);
    this.name = 'WhitepayApiError';
  }
}

// =============================================================================
// STANDARD FLOW — Création de retrait
// =============================================================================

/**
 * Crée un retrait crypto via le flux standard Whitepay.
 * 
 * Après appel, le taux est valable 30 secondes.
 * Il faut appeler `confirmWithdrawal()` dans ce délai.
 * Si expiré, appeler `refreshWithdrawal()` puis `confirmWithdrawal()`.
 */
export async function createWithdrawal(
  params: WhitepayWithdrawalRequest
): Promise<WhitepayWithdrawalResponse> {
  validateConfig();
  validateWithdrawalParams(params);

  const payload = {
    ...params,
    callback_url: params.callback_url || WHITEPAY_CONFIG.callbackUrl,
  };

  logWhitepay('CREATE_WITHDRAWAL', params.order_id || 'no-order-id', {
    amount: params.amount,
    currency: params.currency,
    target_currency: params.target_currency,
    network: params.network,
  });

  return whitepayRequest<WhitepayWithdrawalResponse>(
    'POST',
    '/private-api/convert-withdrawal',
    payload
  );
}

// =============================================================================
// CONFIRMATION — Doit être appelé dans les 30 secondes
// =============================================================================

/**
 * Confirme un retrait Whitepay. Doit être appelé dans les 30 secondes
 * après `createWithdrawal()`.
 * 
 * Si le taux a expiré, gère automatiquement le refresh et re-confirme.
 */
export async function confirmWithdrawal(
  transactionId: string,
  autoRefreshOnExpiry: boolean = true
): Promise<WhitepayConfirmResponse> {
  validateConfig();

  logWhitepay('CONFIRM_WITHDRAWAL', transactionId, {});

  try {
    return await whitepayRequest<WhitepayConfirmResponse>(
      'POST',
      '/private-api/convert-withdrawal/confirm',
      { transaction_id: transactionId }
    );
  } catch (error) {
    // Gestion automatique de l'expiration du taux
    if (
      autoRefreshOnExpiry &&
      error instanceof WhitepayApiError &&
      isRateExpiredError(error)
    ) {
      logWhitepay('RATE_EXPIRED_AUTO_REFRESH', transactionId, {});

      // 1. Rafraîchir le taux
      const refreshed = await refreshWithdrawal(transactionId);

      // 2. Re-confirmer avec le nouveau taux (sans auto-refresh pour éviter boucle)
      return confirmWithdrawal(refreshed.transaction.id, false);
    }

    throw error;
  }
}

// =============================================================================
// REFRESH — Obtenir un nouveau taux si les 30s sont dépassées
// =============================================================================

/**
 * Rafraîchit le taux de change pour une transaction dont le taux a expiré.
 * Le nouveau taux est valable 30 secondes.
 */
export async function refreshWithdrawal(
  transactionId: string
): Promise<WhitepayRefreshResponse> {
  validateConfig();

  logWhitepay('REFRESH_WITHDRAWAL', transactionId, {});

  return whitepayRequest<WhitepayRefreshResponse>(
    'POST',
    '/private-api/convert-withdrawal/refresh',
    { transaction_id: transactionId }
  );
}

// =============================================================================
// INSTANT FLOW — Création + Confirmation en un seul appel
// =============================================================================

/**
 * Crée ET confirme un retrait en un seul appel.
 * Combine la création, l'obtention du taux et la confirmation.
 * Plus simple mais pas de possibilité de montrer le taux avant confirmation.
 */
export async function createInstantWithdrawal(
  params: WhitepayInstantWithdrawalRequest
): Promise<WhitepayInstantResponse> {
  validateConfig();
  validateWithdrawalParams(params);

  const payload = {
    ...params,
    callback_url: params.callback_url || WHITEPAY_CONFIG.callbackUrl,
  };

  logWhitepay('CREATE_INSTANT_WITHDRAWAL', params.order_id || 'no-order-id', {
    amount: params.amount,
    currency: params.currency,
    target_currency: params.target_currency,
    network: params.network,
  });

  return whitepayRequest<WhitepayInstantResponse>(
    'POST',
    '/private-api/convert-withdrawal/instant',
    payload
  );
}

// =============================================================================
// STATUT — Récupérer l'état d'une transaction
// =============================================================================

/**
 * Récupère le statut actuel d'une transaction Whitepay
 */
export async function getTransactionStatus(
  transactionId: string
): Promise<WhitepayStatusResponse> {
  validateConfig();

  return whitepayRequest<WhitepayStatusResponse>(
    'GET',
    `/private-api/convert-withdrawal/${transactionId}`
  );
}

// =============================================================================
// WEBHOOK — Validation de signature
// =============================================================================

/**
 * Valide la signature d'un webhook Whitepay
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', WHITEPAY_CONFIG.secretKey)
    .update(`${timestamp}${payload}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// =============================================================================
// CONVERSION DE STATUTS
// =============================================================================

/**
 * Convertit un statut Whitepay vers le statut interne Payout
 */
export function convertWhitepayStatus(status: WhitepayTransactionStatus): string {
  const statusMap: Record<WhitepayTransactionStatus, string> = {
    WAITING_CONFIRMATION: 'PENDING',
    PENDING_WITHDRAWAL: 'PROCESSING',
    PROCESSING_WITHDRAWAL: 'PROCESSING',
    COMPLETE: 'PAID',
    DECLINED: 'FAILED',
  };

  return statusMap[status] || 'PENDING';
}

/**
 * Vérifie si une transaction Whitepay est terminée (succès)
 */
export function isTransactionComplete(status: WhitepayTransactionStatus): boolean {
  return status === 'COMPLETE';
}

/**
 * Vérifie si une transaction Whitepay a échoué
 */
export function isTransactionFailed(status: WhitepayTransactionStatus): boolean {
  return status === 'DECLINED';
}

/**
 * Vérifie si une transaction Whitepay est en cours
 */
export function isTransactionPending(status: WhitepayTransactionStatus): boolean {
  return ['WAITING_CONFIRMATION', 'PENDING_WITHDRAWAL', 'PROCESSING_WITHDRAWAL'].includes(status);
}

/**
 * Vérifie si le taux est encore valide (< 30 secondes)
 */
export function isRateValid(estimatedAt: string): boolean {
  const estimatedTime = new Date(estimatedAt).getTime();
  const now = Date.now();
  return (now - estimatedTime) < WHITEPAY_CONFIG.rateExpirationMs;
}

// =============================================================================
// HELPERS — Détection d'erreur d'expiration
// =============================================================================

/**
 * Vérifie si une erreur API correspond à une expiration du taux
 */
function isRateExpiredError(error: WhitepayApiError): boolean {
  const errorMessage = typeof error.responseData === 'object' && error.responseData !== null
    ? JSON.stringify(error.responseData)
    : String(error.responseData || error.message);

  return errorMessage.toLowerCase().includes('time to confirm expired') ||
    errorMessage.toLowerCase().includes('rate expired') ||
    errorMessage.toLowerCase().includes('expired');
}

// =============================================================================
// HELPERS — Calcul de frais crypto
// =============================================================================

/**
 * Calcule les frais estimés pour un retrait crypto Whitepay
 * @param amountCents - Montant en centimes EUR
 * @returns Frais estimés en centimes
 */
export function calculateWhitepayFees(amountCents: number): {
  processingFeeCents: number;
  networkFeeCents: number;
  totalFeeCents: number;
} {
  // Frais Whitepay: 1% de processing + frais réseau estimé (~2€)
  const processingFeeCents = Math.ceil(amountCents * 0.01); // 1%
  const networkFeeCents = 200; // ~2€ estimation réseau blockchain

  return {
    processingFeeCents,
    networkFeeCents,
    totalFeeCents: processingFeeCents + networkFeeCents,
  };
}

/**
 * Convertit centimes en EUR string
 */
export function centsToEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Convertit EUR en centimes
 */
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}

/**
 * Vérifie si un réseau nécessite un memo
 */
export function networkRequiresMemo(network: string): boolean {
  return MEMO_REQUIRED_NETWORKS.includes(network.toUpperCase());
}

/**
 * Formate un montant crypto avec la bonne précision
 */
export function formatCryptoAmount(amount: string | number, precision: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(precision);
}

/**
 * Obtient les limites de payout crypto
 */
export function getWhitepayLimits(): {
  minCents: number;
  maxCents: number;
} {
  return {
    minCents: 1000,     // 10 EUR minimum
    maxCents: 5000000,  // 50 000 EUR maximum
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide la configuration Whitepay
 */
export function validateConfig(): void {
  if (!WHITEPAY_CONFIG.apiKey) {
    throw new Error('WHITEPAY_API_KEY is not configured');
  }
  if (!WHITEPAY_CONFIG.secretKey) {
    throw new Error('WHITEPAY_SECRET_KEY is not configured');
  }
}

/**
 * Valide les paramètres d'un retrait
 */
function validateWithdrawalParams(params: WhitepayWithdrawalRequest): void {
  if (!params.amount || params.amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (!params.currency) {
    throw new Error('Currency is required');
  }
  if (!params.target_currency) {
    throw new Error('Target currency is required');
  }
  if (!params.network) {
    throw new Error('Network is required');
  }
  if (!params.address) {
    throw new Error('Wallet address is required');
  }
  // Vérifier que le memo est fourni si le réseau l'exige
  if (networkRequiresMemo(params.network) && !params.memo) {
    throw new Error(`Memo/tag is required for network ${params.network}`);
  }
}

/**
 * Valide une adresse wallet basique (format)
 */
export function validateWalletAddress(
  address: string,
  network: string
): { isValid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { isValid: false, error: 'Adresse wallet requise' };
  }

  // Validations basiques par réseau
  switch (network.toUpperCase()) {
    case 'BTC':
      if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) {
        return { isValid: false, error: 'Adresse Bitcoin invalide' };
      }
      break;
    case 'ERC20':
    case 'BEP20':
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { isValid: false, error: 'Adresse EVM invalide (doit commencer par 0x)' };
      }
      break;
    case 'TRC20':
      if (!/^T[a-zA-Z0-9]{33}$/.test(address)) {
        return { isValid: false, error: 'Adresse TRON invalide (doit commencer par T)' };
      }
      break;
    case 'SOL':
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        return { isValid: false, error: 'Adresse Solana invalide' };
      }
      break;
    case 'TON':
      if (address.length < 48) {
        return { isValid: false, error: 'Adresse TON invalide' };
      }
      break;
    default:
      // Validation générique: au moins 20 caractères
      if (address.length < 20) {
        return { isValid: false, error: 'Adresse wallet trop courte' };
      }
  }

  return { isValid: true };
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log une opération Whitepay pour le monitoring
 */
function logWhitepay(
  action: string,
  transactionId: string,
  data: Record<string, unknown>
): void {
  console.log('[Whitepay]', {
    action,
    transactionId,
    timestamp: new Date().toISOString(),
    ...data,
  });
}
