import crypto from 'crypto';

// =============================================================================
// CONFIGURATION FLEXIFY
// =============================================================================

export const FLEXIFY_CONFIG = {
  apiKey: process.env.FLEXIFY_API_KEY!,
  secretKey: process.env.FLEXIFY_SECRET_KEY!,
  merchantId: process.env.FLEXIFY_MERCHANT_ID!,
  baseUrl: process.env.FLEXIFY_BASE_URL || 'https://api.flexify.finance',
  environment: (process.env.FLEXIFY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  // URLs de callback
  callbackUrl: process.env.FLEXIFY_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/flexify/webhook`,
  successUrl: process.env.FLEXIFY_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payout=success`,
  failureUrl: process.env.FLEXIFY_FAILURE_URL || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payout=failed`,
};

// =============================================================================
// TYPES
// =============================================================================

export type FlexifyPayoutMethod = 'SEPA' | 'CARD';
export type FlexifyPayoutStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface FlexifyPayoutRequest {
  merchantId: string;
  orderId: string; // Notre ID unique de payout
  amount: number; // En EUR (decimal)
  currency: 'EUR';
  method: FlexifyPayoutMethod;
  // Informations bénéficiaire
  beneficiary: FlexifyBeneficiary;
  // Métadonnées
  metadata?: Record<string, string>;
  // URLs
  callbackUrl: string;
  successUrl?: string;
  failureUrl?: string;
}

export interface FlexifyBeneficiary {
  firstName: string;
  lastName: string;
  email: string;
  // Pour SEPA
  iban?: string;
  bic?: string;
  // Pour Carte
  cardNumber?: string;
  cardHolderName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  // Adresse
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string; // Code ISO 2 lettres
  };
}

export interface FlexifyPayoutResponse {
  id: string;
  orderId: string;
  status: FlexifyPayoutStatus;
  amount: number;
  currency: string;
  method: FlexifyPayoutMethod;
  createdAt: string;
  updatedAt: string;
  fees?: {
    processing: number;
    network?: number;
  };
  estimatedArrival?: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface FlexifyWebhookPayload {
  eventType: 'payout.created' | 'payout.processing' | 'payout.completed' | 'payout.failed' | 'payout.cancelled';
  payoutId: string;
  orderId: string;
  status: FlexifyPayoutStatus;
  amount: number;
  currency: string;
  method: FlexifyPayoutMethod;
  timestamp: string;
  transactionId?: string;
  errorMessage?: string;
  fees?: {
    processing: number;
    network?: number;
  };
}

export interface FlexifyQuoteRequest {
  amount: number;
  currency: 'EUR';
  method: FlexifyPayoutMethod;
  country: string;
}

export interface FlexifyQuoteResponse {
  amount: number;
  netAmount: number;
  fees: {
    processing: number;
    network: number;
    total: number;
  };
  estimatedDelivery: string;
  expiresAt: string;
  quoteId: string;
}

// =============================================================================
// SIGNATURE HMAC
// =============================================================================

/**
 * Génère une signature HMAC pour les requêtes Flexify
 */
function generateSignature(
  method: string,
  path: string,
  timestamp: number,
  body?: string
): string {
  const message = `${timestamp}${method.toUpperCase()}${path}${body || ''}`;
  return crypto
    .createHmac('sha256', FLEXIFY_CONFIG.secretKey)
    .update(message)
    .digest('hex');
}

/**
 * Prépare les headers pour une requête Flexify
 */
function prepareHeaders(
  method: string,
  path: string,
  body?: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(method, path, timestamp, body);

  return {
    'Content-Type': 'application/json',
    'X-API-Key': FLEXIFY_CONFIG.apiKey,
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
    'X-Merchant-ID': FLEXIFY_CONFIG.merchantId,
  };
}

/**
 * Effectue une requête vers l'API Flexify avec retry
 */
async function flexifyRequest<T>(
  method: string,
  path: string,
  body?: object,
  retries: number = 3
): Promise<T> {
  const url = `${FLEXIFY_CONFIG.baseUrl}${path}`;
  const bodyString = body ? JSON.stringify(body) : undefined;
  const headers = prepareHeaders(method, path, bodyString);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Flexify API error: ${response.status} - ${JSON.stringify(data)}`
        );
      }

      return data as T;
    } catch (error) {
      if (attempt === retries) throw error;
      // Backoff exponentiel
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw new Error('Flexify request failed after retries');
}

// =============================================================================
// QUOTES (DEVIS)
// =============================================================================

/**
 * Obtient un devis pour un payout
 */
export async function getPayoutQuote(
  params: FlexifyQuoteRequest
): Promise<FlexifyQuoteResponse> {
  validateConfig();

  return flexifyRequest<FlexifyQuoteResponse>('POST', '/v1/payouts/quote', params);
}

/**
 * Calcule les frais pour un payout SEPA
 * @param amountCents - Montant en centimes
 * @returns Frais estimés en centimes
 */
export function calculateSepaFees(amountCents: number): {
  processingFeeCents: number;
  networkFeeCents: number;
  totalFeeCents: number;
} {
  // Frais SEPA typiques: 0.5% + 0.25€ fixe
  const processingFeeCents = Math.ceil(amountCents * 0.005); // 0.5%
  const networkFeeCents = 25; // 0.25€ fixe

  return {
    processingFeeCents,
    networkFeeCents,
    totalFeeCents: processingFeeCents + networkFeeCents,
  };
}

/**
 * Calcule les frais pour un payout Carte
 * @param amountCents - Montant en centimes
 * @returns Frais estimés en centimes
 */
export function calculateCardFees(amountCents: number): {
  processingFeeCents: number;
  networkFeeCents: number;
  totalFeeCents: number;
} {
  // Frais Carte typiques: 1.5% + 0.50€ fixe
  const processingFeeCents = Math.ceil(amountCents * 0.015); // 1.5%
  const networkFeeCents = 50; // 0.50€ fixe

  return {
    processingFeeCents,
    networkFeeCents,
    totalFeeCents: processingFeeCents + networkFeeCents,
  };
}

// =============================================================================
// PAYOUTS SEPA
// =============================================================================

export interface CreateSepaPayoutParams {
  orderId: string;
  amountCents: number;
  beneficiary: {
    firstName: string;
    lastName: string;
    email: string;
    iban: string;
    bic?: string;
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  metadata?: Record<string, string>;
}

/**
 * Crée un payout SEPA
 */
export async function createSepaPayout(
  params: CreateSepaPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const request: FlexifyPayoutRequest = {
    merchantId: FLEXIFY_CONFIG.merchantId,
    orderId: params.orderId,
    amount: params.amountCents / 100, // Convertir en EUR
    currency: 'EUR',
    method: 'SEPA',
    beneficiary: {
      firstName: params.beneficiary.firstName,
      lastName: params.beneficiary.lastName,
      email: params.beneficiary.email,
      iban: params.beneficiary.iban,
      bic: params.beneficiary.bic,
      address: params.beneficiary.address,
    },
    metadata: {
      ...params.metadata,
      source: 'moonskin',
      environment: FLEXIFY_CONFIG.environment,
    },
    callbackUrl: FLEXIFY_CONFIG.callbackUrl,
    successUrl: FLEXIFY_CONFIG.successUrl,
    failureUrl: FLEXIFY_CONFIG.failureUrl,
  };

  logPayoutTransaction('CREATE_SEPA', params.orderId, { amount: params.amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payouts', request);
}

// =============================================================================
// PAYOUTS CARTE
// =============================================================================

export interface CreateCardPayoutParams {
  orderId: string;
  amountCents: number;
  beneficiary: {
    firstName: string;
    lastName: string;
    email: string;
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: string;
    expiryYear: string;
  };
  metadata?: Record<string, string>;
}

/**
 * Crée un payout vers une carte bancaire
 */
export async function createCardPayout(
  params: CreateCardPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const request: FlexifyPayoutRequest = {
    merchantId: FLEXIFY_CONFIG.merchantId,
    orderId: params.orderId,
    amount: params.amountCents / 100,
    currency: 'EUR',
    method: 'CARD',
    beneficiary: {
      firstName: params.beneficiary.firstName,
      lastName: params.beneficiary.lastName,
      email: params.beneficiary.email,
      cardNumber: params.beneficiary.cardNumber,
      cardHolderName: params.beneficiary.cardHolderName,
      expiryMonth: params.beneficiary.expiryMonth,
      expiryYear: params.beneficiary.expiryYear,
    },
    metadata: {
      ...params.metadata,
      source: 'moonskin',
      environment: FLEXIFY_CONFIG.environment,
    },
    callbackUrl: FLEXIFY_CONFIG.callbackUrl,
    successUrl: FLEXIFY_CONFIG.successUrl,
    failureUrl: FLEXIFY_CONFIG.failureUrl,
  };

  logPayoutTransaction('CREATE_CARD', params.orderId, { amount: params.amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payouts', request);
}

// =============================================================================
// GESTION DES PAYOUTS
// =============================================================================

/**
 * Récupère le statut d'un payout
 */
export async function getPayoutStatus(payoutId: string): Promise<FlexifyPayoutResponse> {
  validateConfig();

  return flexifyRequest<FlexifyPayoutResponse>('GET', `/v1/payouts/${payoutId}`);
}

/**
 * Récupère un payout par son orderId
 */
export async function getPayoutByOrderId(orderId: string): Promise<FlexifyPayoutResponse> {
  validateConfig();

  return flexifyRequest<FlexifyPayoutResponse>('GET', `/v1/payouts/order/${orderId}`);
}

/**
 * Annule un payout (si possible)
 */
export async function cancelPayout(payoutId: string): Promise<FlexifyPayoutResponse> {
  validateConfig();

  logPayoutTransaction('CANCEL', payoutId, {});

  return flexifyRequest<FlexifyPayoutResponse>('POST', `/v1/payouts/${payoutId}/cancel`);
}

/**
 * Liste tous les payouts
 */
export async function listPayouts(
  limit: number = 50,
  offset: number = 0,
  status?: FlexifyPayoutStatus
): Promise<{ payouts: FlexifyPayoutResponse[]; total: number }> {
  validateConfig();

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(status && { status }),
  });

  return flexifyRequest<{ payouts: FlexifyPayoutResponse[]; total: number }>(
    'GET',
    `/v1/payouts?${queryParams.toString()}`
  );
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Valide la signature d'un webhook Flexify
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', FLEXIFY_CONFIG.secretKey)
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

/**
 * Convertit le statut Flexify en statut interne
 */
export function convertFlexifyStatus(status: FlexifyPayoutStatus): string {
  const statusMap: Record<FlexifyPayoutStatus, string> = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    AWAITING_APPROVAL: 'VERIFICATION_REQUIRED',
    APPROVED: 'VERIFIED',
    SENT: 'SCHEDULED',
    COMPLETED: 'PAID',
    FAILED: 'FAILED',
    CANCELLED: 'FAILED',
    REFUNDED: 'FAILED',
  };

  return statusMap[status] || 'PENDING';
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide la configuration Flexify
 */
export function validateConfig(): void {
  if (!FLEXIFY_CONFIG.apiKey) {
    throw new Error('FLEXIFY_API_KEY is not configured');
  }
  if (!FLEXIFY_CONFIG.secretKey) {
    throw new Error('FLEXIFY_SECRET_KEY is not configured');
  }
  if (!FLEXIFY_CONFIG.merchantId) {
    throw new Error('FLEXIFY_MERCHANT_ID is not configured');
  }
}

/**
 * Valide un IBAN
 */
export function validateIban(iban: string): { isValid: boolean; error?: string } {
  // Retirer espaces et mettre en majuscules
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Vérifier la longueur minimale
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return { isValid: false, error: 'IBAN invalide: longueur incorrecte' };
  }

  // Vérifier le format (2 lettres + 2 chiffres + reste alphanumérique)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban)) {
    return { isValid: false, error: 'IBAN invalide: format incorrect' };
  }

  // Vérification mod97
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  let remainder = '';
  for (const char of numericIban) {
    remainder = ((parseInt(remainder + char, 10)) % 97).toString();
  }

  if (parseInt(remainder, 10) !== 1) {
    return { isValid: false, error: 'IBAN invalide: checksum incorrect' };
  }

  return { isValid: true };
}

/**
 * Valide un BIC/SWIFT
 */
export function validateBic(bic: string): { isValid: boolean; error?: string } {
  const cleanBic = bic.replace(/\s/g, '').toUpperCase();

  // BIC doit avoir 8 ou 11 caractères
  if (cleanBic.length !== 8 && cleanBic.length !== 11) {
    return { isValid: false, error: 'BIC invalide: doit avoir 8 ou 11 caractères' };
  }

  // Format: 4 lettres + 2 lettres + 2 alphanum + (optionnel 3 alphanum)
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanBic)) {
    return { isValid: false, error: 'BIC invalide: format incorrect' };
  }

  return { isValid: true };
}

/**
 * Valide un numéro de carte (Luhn algorithm)
 */
export function validateCardNumber(cardNumber: string): { isValid: boolean; error?: string } {
  const cleanNumber = cardNumber.replace(/\s|-/g, '');

  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return { isValid: false, error: 'Numéro de carte invalide' };
  }

  // Algorithme de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Numéro de carte invalide' };
  }

  return { isValid: true };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convertit centimes en EUR
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
 * Vérifie si un payout est terminé
 */
export function isPayoutCompleted(status: FlexifyPayoutStatus): boolean {
  return status === 'COMPLETED';
}

/**
 * Vérifie si un payout a échoué
 */
export function isPayoutFailed(status: FlexifyPayoutStatus): boolean {
  return status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED';
}

/**
 * Vérifie si un payout est en cours
 */
export function isPayoutPending(status: FlexifyPayoutStatus): boolean {
  return ['PENDING', 'PROCESSING', 'AWAITING_APPROVAL', 'APPROVED', 'SENT'].includes(status);
}

/**
 * Obtient les limites de payout
 */
export function getPayoutLimits(method: FlexifyPayoutMethod): {
  minCents: number;
  maxCents: number;
} {
  if (method === 'SEPA') {
    return {
      minCents: 1000, // 10 EUR minimum
      maxCents: 1000000, // 10,000 EUR maximum
    };
  }

  // Carte
  return {
    minCents: 500, // 5 EUR minimum
    maxCents: 500000, // 5,000 EUR maximum
  };
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log une transaction pour le monitoring
 */
function logPayoutTransaction(
  action: string,
  orderId: string,
  data: Record<string, unknown>
): void {
  console.log('[Flexify Payout]', {
    action,
    orderId,
    timestamp: new Date().toISOString(),
    environment: FLEXIFY_CONFIG.environment,
    ...data,
  });
}



