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

/** Erreur renvoyée par l'API Flexify avec le body complet pour le debug */
export class FlexifyApiError extends Error {
  constructor(
    message: string,
    public readonly response?: { status: number; data: unknown }
  ) {
    super(message);
    this.name = 'FlexifyApiError';
    Object.setPrototypeOf(this, FlexifyApiError.prototype);
  }
}

export type FlexifyPaymentMethod = 'sepa' | 'card';
export type FlexifyTransactionStatus = 
  | 'new'
  | 'pending'
  | 'success'
  | 'declined'
  | 'failed'
  | 'expired';

// Structure selon la doc Flexify V1 / Gate API
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

/** Réponse Gate API selon doc : https://h2h.flexify.finance/v1/payout */
export interface FlexifyGateApiResponse {
  error_code: number; // 0 = OK, != 0 = Failed
  error_reason?: string;
  request_id?: string;
  reference?: string;
  status?: FlexifyTransactionStatus;
  type?: string;
  method?: FlexifyPaymentMethod;
  mode?: string;
  currency?: string;
  amount?: string;
  timestamp?: string;
  error_fields?: Array< { field: string; message: string } >;
}

export interface FlexifyPayoutResponse {
  code: number; // 0 = success (compat interne)
  error_code?: number;
  error_reason?: string;
  request_id?: string;
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
  error_message?: string;
  /** Champs Gate API bruts pour logs */
  reference?: string;
  status?: FlexifyTransactionStatus;
}

/**
 * Normalise la réponse Gate API (error_code, request_id, reference, status à la racine)
 * vers FlexifyPayoutResponse (transaction.id, etc.).
 */
function normalizeGateApiResponse(raw: unknown): FlexifyPayoutResponse {
  if (typeof raw !== 'object' || raw === null) {
    return { code: 1, error_message: 'Invalid response' };
  }
  const r = raw as Record<string, unknown>;
  const errorCode = (r.error_code as number) ?? (r.code as number) ?? 0;
  const hasTransaction = r.transaction && typeof r.transaction === 'object';
  const tx = r.transaction as Record<string, unknown> | undefined;
  const requestId = (r.request_id as string) ?? (tx?.id as string) ?? (tx?.transaction_id as string);
  const reference = (r.reference as string) ?? (tx?.reference as string);
  const status = (r.status as FlexifyTransactionStatus) ?? (tx?.status as FlexifyTransactionStatus);
  const method = (r.method as FlexifyPaymentMethod) ?? (tx?.method as FlexifyPaymentMethod);
  const amount = (r.amount as string) ?? (tx?.amount as string);
  const currency = (r.currency as string) ?? (tx?.currency as string);

  const normalized: FlexifyPayoutResponse = {
    code: errorCode,
    error_code: errorCode,
    error_reason: r.error_reason as string | undefined,
    error_message: (r.error_message as string) ?? (r.error_reason as string),
    request_id: requestId,
    reference,
    status,
    transaction: hasTransaction
      ? (tx as FlexifyPayoutResponse['transaction'])
      : requestId
        ? {
            id: requestId,
            reference: reference ?? '',
            status: status ?? 'pending',
            amount: amount ?? '',
            currency: currency ?? 'EUR',
            method: method ?? 'card',
            created_at: (r.timestamp as string) ?? new Date().toISOString(),
            updated_at: (r.timestamp as string) ?? new Date().toISOString(),
          }
        : undefined,
  };
  return normalized;
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
 * Prépare les headers pour une requête Flexify H2H.
 * Date au format ISO 8601 (ex: 2022-01-01T01:00:00.000Z) comme dans l'exemple Flexify.
 */
function prepareHeaders(
  method: string,
  host: string,
  body?: string
): Record<string, string> {
  const date = new Date().toISOString();
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
 * En cas de 403 Access Denied, log l'IP sortante du serveur pour la communiquer à Flexify (whitelist).
 */
async function logOutboundIpForWhitelist(): Promise<void> {
  try {
    const res = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(3000) });
    const ip = (await res.text()).trim();
    flexifyLog('STEP_403_IP_WHITELIST', { ip }, 'error');
  } catch {
    flexifyLog('STEP_403_IP_WHITELIST', { hint: 'curl -s https://api.ipify.org' }, 'error');
  }
}

/**
 * Effectue une requête vers l'API Flexify H2H avec retry.
 * Respecte le schéma Gate API : error_code (0=OK), error_reason, request_id, reference, status.
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

  flexifyLog('STEP_REQUEST_START', {
    method,
    path,
    url,
    hasBody: !!body,
    bodySanitized: body ? sanitizeForLog(body) : undefined,
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        flexifyLog('STEP_RETRY', { attempt, maxRetries: retries });
      }

      const response = await fetch(url, {
        method,
        headers,
        body: bodyString,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const rawText = await response.text();

      flexifyLog('STEP_RESPONSE_RAW', {
        attempt,
        status: response.status,
        contentType,
        bodyLength: rawText.length,
        bodyPreview: rawText.slice(0, 500),
      });

      if (response.status === 504) {
        flexifyLog('STEP_504_GATEWAY_TIMEOUT', {
          attempt,
          hint: 'Attendre le callback ou faire un check pour obtenir le statut final',
        }, 'warn');
        if (attempt === retries) {
          throw new Error('Flexify Gateway Timeout (504) après tous les retries. Attendre callback ou faire check.');
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }

      if (!contentType.includes('application/json')) {
        const snippet = rawText.slice(0, 400).replace(/\s+/g, ' ');
        flexifyLog('STEP_RESPONSE_NOT_JSON', {
          status: response.status,
          url,
          contentType,
          snippet,
        }, 'error');
        throw new Error(
          `Flexify a renvoyé une page HTML au lieu de JSON (status ${response.status}). Vérifiez : URL H2H (FLEXIFY_H2H_URL), IP serveur autorisée chez Flexify, et clés API. Détail: ${snippet}`
        );
      }

      let data: unknown;
      try {
        data = JSON.parse(rawText);
      } catch {
        flexifyLog('STEP_RESPONSE_JSON_INVALID', {
          status: response.status,
          rawPreview: rawText.slice(0, 300),
        }, 'error');
        throw new Error(`Flexify: réponse JSON invalide (status ${response.status})`);
      }

      const normalized = path === '/v1/payout' ? normalizeGateApiResponse(data) : (data as T);
      const responsePayload = { status: response.status, data };

      const errorCode = typeof normalized === 'object' && normalized !== null && 'error_code' in normalized
        ? (normalized as { error_code: number }).error_code
        : (normalized as { code?: number }).code;
      const isError = errorCode !== undefined && errorCode !== 0;

      if (isError) {
        const msg = (normalized as { error_message?: string }).error_message
          ?? (normalized as { error_reason?: string }).error_reason
          ?? `Flexify error code: ${errorCode}`;
        flexifyLog('STEP_ERROR_CODE', {
          error_code: errorCode,
          error_reason: (normalized as { error_reason?: string }).error_reason,
          error_message: msg,
          httpStatus: response.status,
          error_fields: (data as { error_fields?: unknown }).error_fields,
          fullBody: data,
        }, 'error');
        if (response.status === 403) {
          await logOutboundIpForWhitelist();
        }
        throw new FlexifyApiError(msg, responsePayload);
      }

      if (!response.ok) {
        flexifyLog('STEP_HTTP_NOT_OK', { status: response.status, data }, 'error');
        throw new Error(`Flexify API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      flexifyLog('STEP_RESPONSE_SUCCESS', {
        status: response.status,
        reference: (normalized as { reference?: string }).reference,
        request_id: (normalized as { request_id?: string }).request_id,
        statusField: (normalized as { status?: string }).status,
      });
      return (path === '/v1/payout' ? normalized : data) as T;
    } catch (error) {
      if (attempt === retries) {
        flexifyLog('STEP_REQUEST_FAILED_AFTER_RETRIES', { attempt, error: String(error) }, 'error');
        throw error;
      }
      flexifyLog('STEP_RETRY_WAIT', { attempt, nextWaitMs: Math.pow(2, attempt) * 100 });
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
 * Crée un payout SEPA selon la spec Flexify V1 / Gate API
 */
export async function createSepaPayout(
  params: CreateSepaPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyGatePayoutBody = {
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

  flexifyLog('STEP_CREATE_SEPA_PAYOUT_REQUEST', {
    reference: params.reference,
    amountEur,
    ibanMasked: `${params.sepa.iban.slice(0, 4)}****${params.sepa.iban.slice(-4)}`,
  });
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

/** Body envoyé à la Gate API /v1/payout (schéma doc : pan, exp_month, exp_year, holder_name) */
interface FlexifyGatePayoutBody {
  method: FlexifyPaymentMethod;
  mode: 'initial';
  reference: string;
  currency: string;
  amount: string;
  customer: { identifier: string; email: string; country: string; ip: string };
  callback_url: string;
  sepa?: { iban: string; bic?: string; holder_name: string };
  card?: {
    pan: string;
    exp_month: string;
    exp_year: string;
    holder_name: string;
  };
}

/**
 * Crée un payout vers une carte bancaire selon la spec Flexify V1 / Gate API.
 * Schéma doc : card = { pan, exp_month, exp_year, holder_name }.
 */
export async function createCardPayout(
  params: CreateCardPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyGatePayoutBody = {
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
      pan: params.card.number,
      exp_month: params.card.expireMonth,
      exp_year: params.card.expireYear,
      holder_name: params.card.holderName,
    },
  };

  flexifyLog('STEP_CREATE_CARD_PAYOUT_REQUEST', {
    reference: params.reference,
    amountEur,
    cardMasked: `***${params.card.number.slice(-4)}`,
  });
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
  flexifyLog('GET_TRANSACTION_STATUS_START', { transactionId });

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
  flexifyLog('GET_TRANSACTION_STATUS_RESPONSE', { transactionId, status: response.status, hasError: !response.ok || (data as { code?: number }).code !== 0 });

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
  flexifyLog('GET_TRANSACTION_BY_REF_START', { reference });

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
  flexifyLog('GET_TRANSACTION_BY_REF_RESPONSE', { reference, status: response.status, hasError: !response.ok || (data as { code?: number }).code !== 0 });

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
      flexifyLog('WEBHOOK_SIGNATURE_PARSE_FAIL', { reason: 'Invalid Authorization header format' }, 'error');
      return false;
    }

    const receivedSignature = signatureMatch[1];
    const keyId = keyIdMatch[1];
    const headersList = headersMatch[1].split(' ');

    if (keyId !== FLEXIFY_CONFIG.apiKey) {
      flexifyLog('WEBHOOK_SIGNATURE_KEYID_MISMATCH', {}, 'error');
      return false;
    }

    const expectedDigest = generateDigest(rawBody);
    if (digestHeader !== expectedDigest) {
      flexifyLog('WEBHOOK_SIGNATURE_DIGEST_MISMATCH', {}, 'error');
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
    flexifyLog('WEBHOOK_SIGNATURE_VALIDATION_ERROR', { error: String(error) }, 'error');
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
// LOGGING — Actif en dev ET en prod pour tracer toutes les étapes Flexify
// =============================================================================

const FLEXIFY_LOG_PREFIX = '[FLEXIFY]';

/**
 * Sanitize payload pour les logs : pas de numéro de carte complet, pas de CVV, pas d'IBAN complet.
 */
function sanitizeForLog(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  const o = obj as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = k.toLowerCase();
    if (key === 'pan' || key === 'number' || key === 'cvv') {
      out[k] = typeof v === 'string' ? `***${(v as string).slice(-4)}` : '***';
    } else if (key === 'iban' && typeof v === 'string') {
      out[k] = `${(v as string).slice(0, 4)}****${(v as string).slice(-4)}`;
    } else if (key === 'card' && v && typeof v === 'object') {
      out[k] = sanitizeForLog(v);
    } else if (key === 'sepa' && v && typeof v === 'object') {
      const s = v as Record<string, unknown>;
      out[k] = {
        ...s,
        iban: typeof s.iban === 'string' ? `${s.iban.slice(0, 4)}****${s.iban.slice(-4)}` : '***',
      };
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[k] = sanitizeForLog(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Log toutes les étapes Flexify (dev + prod). Permet de tout retracer.
 */
export function flexifyLog(
  step: string,
  data?: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const payload = {
    step,
    env: FLEXIFY_CONFIG.environment,
    ts: new Date().toISOString(),
    ...(data && { data: sanitizeForLog(data) }),
  };
  const msg = `${FLEXIFY_LOG_PREFIX} ${step}`;
  if (level === 'error') {
    console.error(msg, payload);
  } else if (level === 'warn') {
    console.warn(msg, payload);
  } else {
    console.log(msg, payload);
  }
}

/**
 * Log une transaction pour le monitoring (utilise le même logger que le reste)
 */
function logPayoutTransaction(
  action: string,
  orderId: string,
  data: Record<string, unknown>
): void {
  flexifyLog(`PAYOUT_${action}`, { orderId, ...data });
}



