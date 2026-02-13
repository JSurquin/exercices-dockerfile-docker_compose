import crypto from 'crypto';

// =============================================================================
// CONFIGURATION FLEXIFY
// =============================================================================

export const FLEXIFY_CONFIG = {
  apiKey: process.env.FLEXIFY_API_KEY!,
  apiSecret: process.env.FLEXIFY_API_SECRET!, // Changé de secretKey à apiSecret
  merchantIdentifier: process.env.FLEXIFY_MERCHANT_IDENTIFIER!, // Identifiant marchand (ex: MR_TEST)
  h2hBaseUrl: process.env.FLEXIFY_H2H_URL || 'https://h2h.flexify.finance', // H2H Gate API
  reportingBaseUrl: process.env.FLEXIFY_API_URL || 'https://api.flexify.finance', // Reporting API
  environment: (process.env.FLEXIFY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  // URLs de callback
  callbackUrl: process.env.FLEXIFY_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/flexify/webhook`,
  successUrl: process.env.FLEXIFY_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payout=success`,
  failureUrl: process.env.FLEXIFY_FAILURE_URL || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payout=failed`,
};

// =============================================================================
// TYPES
// =============================================================================

export type FlexifyPaymentMethod = 'sepa' | 'card';
export type FlexifyTransactionStatus = 
  | 'new'
  | 'pending'
  | 'success'
  | 'declined'
  | 'failed'
  | 'expired';

// Structure selon la doc Flexify V1
export interface FlexifyPayoutRequest {
  method: FlexifyPaymentMethod;
  mode: 'initial';
  reference: string; // Notre ID unique
  currency: 'EUR';
  amount: string; // Montant en string avec 2 décimales (ex: "100.00")
  customer: {
    identifier: string;
    email: string;
    country: string; // Code ISO 2 lettres
    ip: string;
  };
  callback_url: string;
  sepa?: {
    iban: string;
    bic?: string;
    holder_name: string;
  };
  card?: {
    number: string;
    holder_name: string;
    expire_month: string;
    expire_year: string;
    cvv: string;
  };
}

export interface FlexifyPayoutResponse {
  code: number; // 0 = success
  message?: string;
  transaction?: {
    id: string;
    reference: string;
    status: FlexifyTransactionStatus;
    amount: string;
    currency: string;
    method: FlexifyPaymentMethod;
    created_at: string;
    updated_at: string;
  };
  error_code?: number;
  error_message?: string;
}

export interface FlexifyWebhookPayload {
  transaction_id: string;
  reference: string;
  status: FlexifyTransactionStatus;
  amount: string;
  currency: string;
  method: FlexifyPaymentMethod;
  created_at: string;
  updated_at: string;
  sepa?: {
    iban: string;
    bic?: string;
    holder_name: string;
  };
}

export interface FlexifyQuoteRequest {
  amount: number;
  currency: 'EUR';
  method: FlexifyPaymentMethod;
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
// SIGNATURE HMAC-SHA256 (selon spec Flexify)
// =============================================================================

/**
 * Génère le Digest SHA-256 du body (pour POST)
 */
function generateDigest(body: string): string {
  const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `SHA-256=${hash}`;
}

/**
 * Construit le payload de signature selon la spec Flexify
 * Pour POST: host digest content-length date
 * Pour GET: host date
 */
function buildSignaturePayload(
  host: string,
  method: string,
  digest?: string,
  contentLength?: number,
  date?: string
): string {
  const parts: string[] = [];
  
  parts.push(`host: ${host}`);
  
  if (method === 'POST' && digest && contentLength !== undefined) {
    parts.push(`digest: ${digest}`);
    parts.push(`content-length: ${contentLength}`);
  }
  
  if (date) {
    parts.push(`date: ${date}`);
  }
  
  return parts.join('');
}

/**
 * Génère la signature HMAC-SHA256
 */
function generateSignature(payload: string): string {
  return crypto
    .createHmac('sha256', FLEXIFY_CONFIG.apiSecret)
    .update(payload)
    .digest('base64');
}

/**
 * Prépare les headers pour une requête Flexify H2H
 */
function prepareHeaders(
  method: string,
  host: string,
  body?: string
): Record<string, string> {
  const date = new Date().toUTCString();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Date': date,
    'Host': host,
  };

  if (method === 'POST' && body) {
    const digest = generateDigest(body);
    const contentLength = Buffer.byteLength(body, 'utf8');
    
    headers['Digest'] = digest;
    headers['Content-Length'] = contentLength.toString();
    
    const signaturePayload = buildSignaturePayload(host, method, digest, contentLength, date);
    const signature = generateSignature(signaturePayload);
    
    headers['Authorization'] = `Signature keyId="${FLEXIFY_CONFIG.apiKey}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`;
  } else {
    // GET request
    const signaturePayload = buildSignaturePayload(host, method, undefined, undefined, date);
    const signature = generateSignature(signaturePayload);
    
    headers['Authorization'] = `Signature keyId="${FLEXIFY_CONFIG.apiKey}", algorithm="HmacSHA256", headers="host date", signature="${signature}"`;
  }

  return headers;
}

/**
 * Effectue une requête vers l'API Flexify H2H avec retry
 */
async function flexifyRequest<T>(
  method: string,
  path: string,
  body?: object,
  retries: number = 3,
  useReportingApi: boolean = false
): Promise<T> {
  const baseUrl = useReportingApi ? FLEXIFY_CONFIG.reportingBaseUrl : FLEXIFY_CONFIG.h2hBaseUrl;
  const url = `${baseUrl}${path}`;
  const host = new URL(baseUrl).host;
  const bodyString = body ? JSON.stringify(body) : undefined;
  const headers = prepareHeaders(method, host, bodyString);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: bodyString,
      });

      const data = await response.json();

      // Vérifier le code d'erreur Flexify
      if ('code' in data && data.code !== 0) {
        throw new Error(
          data.error_message || `Flexify error code: ${data.code}`
        );
      }

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
 * Obtient un devis pour un payout (calcul local car pas dans l'API V1)
 */
export async function getPayoutQuote(
  params: FlexifyQuoteRequest
): Promise<FlexifyQuoteResponse> {
  validateConfig();

  // Calcul local des frais
  const amountCents = Math.round(params.amount * 100);
  const fees = params.method === 'sepa' 
    ? calculateSepaFees(amountCents)
    : calculateCardFees(amountCents);

  return {
    amount: params.amount,
    netAmount: (amountCents - fees.totalFeeCents) / 100,
    fees: {
      processing: fees.processingFeeCents / 100,
      network: fees.networkFeeCents / 100,
      total: fees.totalFeeCents / 100,
    },
    estimatedDelivery: params.method === 'sepa' ? '1-2 business days' : 'Instant to 24h',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    quoteId: `QUOTE-${Date.now()}`,
  };
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
  reference: string;
  amountCents: number;
  customer: {
    identifier: string; // User ID
    email: string;
    country: string; // ISO 2 lettres
    ip: string;
  };
  sepa: {
    iban: string;
    bic?: string;
    holderName: string;
  };
}

/**
 * Crée un payout SEPA selon la spec Flexify V1
 */
export async function createSepaPayout(
  params: CreateSepaPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyPayoutRequest = {
    method: 'sepa',
    mode: 'initial',
    reference: params.reference,
    currency: 'EUR',
    amount: amountEur,
    customer: {
      identifier: params.customer.identifier,
      email: params.customer.email,
      country: params.customer.country,
      ip: params.customer.ip,
    },
    callback_url: FLEXIFY_CONFIG.callbackUrl,
    sepa: {
      iban: params.sepa.iban,
      bic: params.sepa.bic,
      holder_name: params.sepa.holderName,
    },
  };

  logPayoutTransaction('CREATE_SEPA_PAYOUT', params.reference, { amount: params.amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payout', request);
}

// =============================================================================
// PAYOUTS CARTE
// =============================================================================

export interface CreateCardPayoutParams {
  reference: string;
  amountCents: number;
  customer: {
    identifier: string;
    email: string;
    country: string;
    ip: string;
  };
  card: {
    number: string;
    holderName: string;
    expireMonth: string;
    expireYear: string;
    cvv: string;
  };
}

/**
 * Crée un payout vers une carte bancaire selon la spec Flexify V1
 */
export async function createCardPayout(
  params: CreateCardPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyPayoutRequest = {
    method: 'card',
    mode: 'initial',
    reference: params.reference,
    currency: 'EUR',
    amount: amountEur,
    customer: {
      identifier: params.customer.identifier,
      email: params.customer.email,
      country: params.customer.country,
      ip: params.customer.ip,
    },
    callback_url: FLEXIFY_CONFIG.callbackUrl,
    card: {
      number: params.card.number,
      holder_name: params.card.holderName,
      expire_month: params.card.expireMonth,
      expire_year: params.card.expireYear,
      cvv: params.card.cvv,
    },
  };

  logPayoutTransaction('CREATE_CARD_PAYOUT', params.reference, { amount: params.amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payout', request);
}

// =============================================================================
// GESTION DES PAYOUTS
// =============================================================================

/**
 * Récupère le statut d'une transaction via Reporting API
 * Utilise Basic Auth selon la spec
 */
export async function getTransactionStatus(transactionId: string): Promise<FlexifyPayoutResponse> {
  validateConfig();

  // Utiliser le Reporting API avec Basic Auth
  const authHeader = Buffer.from(`${FLEXIFY_CONFIG.apiKey}:${FLEXIFY_CONFIG.apiSecret}`).toString('base64');
  
  const response = await fetch(
    `${FLEXIFY_CONFIG.reportingBaseUrl}/v1/report/transaction?transaction_id=${transactionId}&merchant_identifier=${FLEXIFY_CONFIG.merchantIdentifier}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok || ('code' in data && data.code !== 0)) {
    throw new Error(data.error_message || 'Failed to fetch transaction status');
  }

  return data as FlexifyPayoutResponse;
}

/**
 * Récupère une transaction par référence
 */
export async function getTransactionByReference(reference: string): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const authHeader = Buffer.from(`${FLEXIFY_CONFIG.apiKey}:${FLEXIFY_CONFIG.apiSecret}`).toString('base64');
  
  const response = await fetch(
    `${FLEXIFY_CONFIG.reportingBaseUrl}/v1/report/transaction?reference=${reference}&merchant_identifier=${FLEXIFY_CONFIG.merchantIdentifier}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();

  if (!response.ok || ('code' in data && data.code !== 0)) {
    throw new Error(data.error_message || 'Failed to fetch transaction');
  }

  return data as FlexifyPayoutResponse;
}

/**
 * Effectue un refund (remboursement) d'une transaction
 */
export async function refundTransaction(
  transactionId: string,
  amountCents?: number
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const amountEur = amountCents ? (amountCents / 100).toFixed(2) : undefined;

  const request = {
    transaction_id: transactionId,
    ...(amountEur && { amount: amountEur }),
  };

  logPayoutTransaction('REFUND_TRANSACTION', transactionId, { amount: amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/refund', request);
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Valide la signature d'un webhook Flexify selon la spec H2H
 */
export function validateWebhookSignature(
  rawBody: string,
  authorizationHeader: string,
  digestHeader: string,
  dateHeader: string,
  hostHeader: string,
  contentLengthHeader: string
): boolean {
  try {
    // Parser le header Authorization
    // Format: Signature keyId="...", algorithm="HmacSHA256", headers="host digest content-length date", signature="..."
    const signatureMatch = authorizationHeader.match(/signature="([^"]+)"/);
    const keyIdMatch = authorizationHeader.match(/keyId="([^"]+)"/);
    const headersMatch = authorizationHeader.match(/headers="([^"]+)"/);
    
    if (!signatureMatch || !keyIdMatch || !headersMatch) {
      console.error('[Flexify Webhook] Invalid Authorization header format');
      return false;
    }

    const receivedSignature = signatureMatch[1];
    const keyId = keyIdMatch[1];
    const headersList = headersMatch[1].split(' ');

    // Vérifier que le keyId correspond
    if (keyId !== FLEXIFY_CONFIG.apiKey) {
      console.error('[Flexify Webhook] Invalid keyId');
      return false;
    }

    // Vérifier le digest
    const expectedDigest = generateDigest(rawBody);
    if (digestHeader !== expectedDigest) {
      console.error('[Flexify Webhook] Digest mismatch');
      return false;
    }

    // Reconstruire le payload de signature
    const signaturePayload = buildSignaturePayload(
      hostHeader,
      'POST',
      digestHeader,
      parseInt(contentLengthHeader),
      dateHeader
    );

    // Calculer la signature attendue
    const expectedSignature = generateSignature(signaturePayload);

    // Comparer de manière sécurisée
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Flexify Webhook] Signature validation error:', error);
    return false;
  }
}

/**
 * Convertit le statut Flexify en statut interne
 */
export function convertFlexifyStatus(status: FlexifyTransactionStatus): string {
  const statusMap: Record<FlexifyTransactionStatus, string> = {
    'new': 'PENDING',
    'pending': 'PROCESSING',
    'success': 'PAID',
    'declined': 'FAILED',
    'failed': 'FAILED',
    'expired': 'FAILED',
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
  if (!FLEXIFY_CONFIG.apiSecret) {
    throw new Error('FLEXIFY_API_SECRET is not configured');
  }
  if (!FLEXIFY_CONFIG.merchantIdentifier) {
    throw new Error('FLEXIFY_MERCHANT_IDENTIFIER is not configured');
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
 * Vérifie si une transaction est terminée avec succès
 */
export function isTransactionCompleted(status: FlexifyTransactionStatus): boolean {
  return status === 'success';
}

/**
 * Vérifie si une transaction a échoué
 */
export function isTransactionFailed(status: FlexifyTransactionStatus): boolean {
  return status === 'declined' || status === 'failed' || status === 'expired';
}

/**
 * Vérifie si une transaction est en cours
 */
export function isTransactionPending(status: FlexifyTransactionStatus): boolean {
  return status === 'new' || status === 'pending';
}

/**
 * Obtient les limites de payout
 */
export function getPayoutLimits(method: FlexifyPaymentMethod): {
  minCents: number;
  maxCents: number;
} {
  if (method === 'sepa') {
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



