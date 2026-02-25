import crypto from 'crypto';

// =============================================================================
// CONFIGURATION FLEXIFY
// =============================================================================

/** Paire de clés pour signer les requêtes (HMAC-SHA256) */
export type FlexifyCredentialType = 'sepa' | 'card' | 'reporting';

function getCredentials(type: FlexifyCredentialType): { apiKey: string; apiSecret: string } {
  switch (type) {
    case 'sepa':
      return {
        apiKey: process.env.FLEXIFY_SEPA_PUBLIC_KEY ?? process.env.FLEXIFY_API_KEY ?? '',
        apiSecret: process.env.FLEXIFY_SEPA_PRIVATE_KEY ?? process.env.FLEXIFY_API_SECRET ?? '',
      };
    case 'card':
      return {
        apiKey: process.env.FLEXIFY_CARD_PUBLIC_KEY ?? process.env.FLEXIFY_API_KEY ?? '',
        apiSecret: process.env.FLEXIFY_CARD_PRIVATE_KEY ?? process.env.FLEXIFY_API_SECRET ?? '',
      };
    case 'reporting':
      return {
        apiKey: process.env.FLEXIFY_API_KEY ?? process.env.FLEXIFY_SEPA_PUBLIC_KEY ?? '',
        apiSecret: process.env.FLEXIFY_API_SECRET ?? process.env.FLEXIFY_SEPA_PRIVATE_KEY ?? '',
      };
    default:
      return { apiKey: '', apiSecret: '' };
  }
}

export const FLEXIFY_CONFIG = {
  /** Clés génériques (reporting / fallback) */
  apiKey: process.env.FLEXIFY_API_KEY ?? process.env.FLEXIFY_SEPA_PUBLIC_KEY ?? '',
  apiSecret: process.env.FLEXIFY_API_SECRET ?? process.env.FLEXIFY_SEPA_PRIVATE_KEY ?? '',
  /** Clés SEPA (payouts SEPA) — PUBLIC = keyId, PRIVATE = secret HMAC */
  sepaApiKey: process.env.FLEXIFY_SEPA_PUBLIC_KEY ?? process.env.FLEXIFY_API_KEY ?? '',
  sepaApiSecret: process.env.FLEXIFY_SEPA_PRIVATE_KEY ?? process.env.FLEXIFY_API_SECRET ?? '',
  /** Clés Carte (payouts carte) */
  cardApiKey: process.env.FLEXIFY_CARD_PUBLIC_KEY ?? process.env.FLEXIFY_API_KEY ?? '',
  cardApiSecret: process.env.FLEXIFY_CARD_PRIVATE_KEY ?? process.env.FLEXIFY_API_SECRET ?? '',
  merchantIdentifier: process.env.FLEXIFY_MERCHANT_IDENTIFIER!,
  h2hBaseUrl: process.env.FLEXIFY_H2H_URL || 'https://h2h.flexify.finance',
  reportingBaseUrl: process.env.FLEXIFY_API_URL || 'https://api.flexify.finance',
  environment: (process.env.FLEXIFY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
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
    public readonly response?: { status: number; data: unknown },
    public readonly errorFields?: Array<{ field?: string; message?: string }>
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
 * Génère la signature HMAC-SHA256 avec le secret fourni
 */
function generateSignature(payload: string, apiSecret: string): string {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(payload)
    .digest('base64');
}

/**
 * Prépare les headers pour une requête Flexify H2H (auth HMAC-SHA256 selon spec).
 * Utilise la paire de clés correspondant au type (sepa / card / reporting).
 */
function prepareHeaders(
  method: string,
  host: string,
  body?: string,
  credentialType: FlexifyCredentialType = 'reporting'
): Record<string, string> {
  const { apiKey, apiSecret } = getCredentials(credentialType);
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
    const signature = generateSignature(signaturePayload, apiSecret);

    headers['Authorization'] = `Signature keyId="${apiKey}", algorithm="HmacSHA256", headers="host digest content-length date", signature="${signature}"`;
  } else {
    const signaturePayload = buildSignaturePayload(host, method, undefined, undefined, date);
    const signature = generateSignature(signaturePayload, apiSecret);

    headers['Authorization'] = `Signature keyId="${apiKey}", algorithm="HmacSHA256", headers="host date", signature="${signature}"`;
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
 * credentialType : 'sepa' | 'card' pour payouts (HMAC avec la bonne paire), 'reporting' pour balance/rapports.
 */
async function flexifyRequest<T>(
  method: string,
  path: string,
  body?: object,
  retries: number = 3,
  useReportingApi: boolean = false,
  credentialType: FlexifyCredentialType = 'reporting'
): Promise<T> {
  const baseUrl = useReportingApi ? FLEXIFY_CONFIG.reportingBaseUrl : FLEXIFY_CONFIG.h2hBaseUrl;
  const url = `${baseUrl}${path}`;
  const host = new URL(baseUrl).host;
  const bodyString = body ? JSON.stringify(body) : undefined;
  const headers = prepareHeaders(method, host, bodyString, credentialType);

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

      const rawPreview = rawText.length > 2000 ? rawText.slice(0, 2000) + '...' : rawText;
      flexifyLog('STEP_RESPONSE_RAW', {
        attempt,
        status: response.status,
        contentType,
        bodyLength: rawText.length,
        bodyPreview: rawPreview,
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
        const fullBody = rawText.length > 15000 ? rawText.slice(0, 15000) + '\n...[tronqué]' : rawText;
        flexifyLog('STEP_RESPONSE_NOT_JSON', {
          status: response.status,
          url,
          contentType,
          bodyLength: rawText.length,
          fullBody,
        }, 'error');
        if (response.status === 403) {
          await logOutboundIpForWhitelist();
        }
        const msgSuffix = fullBody.length > 3000 ? fullBody.slice(0, 3000) + '...' : fullBody;
        throw new Error(
          `Flexify a renvoyé une page HTML au lieu de JSON (status ${response.status}). Vérifiez : URL H2H (FLEXIFY_H2H_URL), IP serveur autorisée chez Flexify, et clés API. Corps complet dans les logs [FLEXIFY] STEP_RESPONSE_NOT_JSON. Détail: ${msgSuffix}`
        );
      }

      let data: unknown;
      try {
        data = JSON.parse(rawText);
      } catch {
        const invalidPreview = rawText.length > 3000 ? rawText.slice(0, 3000) + '...' : rawText;
        flexifyLog('STEP_RESPONSE_JSON_INVALID', {
          status: response.status,
          bodyLength: rawText.length,
          fullBody: invalidPreview,
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
        const errorFields = (data as { error_fields?: Array<{ field?: string; message?: string }> }).error_fields;
        flexifyLog('STEP_ERROR_CODE', {
          error_code: errorCode,
          error_reason: (normalized as { error_reason?: string }).error_reason,
          error_message: msg,
          httpStatus: response.status,
          error_fields: errorFields ?? [],
          error_fields_detail: errorFields ? JSON.stringify(errorFields) : '',
          fullBody: data,
        }, 'error');
        if (response.status === 403) {
          await logOutboundIpForWhitelist();
        }
        throw new FlexifyApiError(msg, responsePayload, errorFields ?? undefined);
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
  description?: string;
  customer: {
    identifier: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    address: string;
    country: string;
    ip: string;
  };
  sepa: {
    iban: string;
    bic?: string;
    beneficiary_first_name: string;
    beneficiary_last_name: string;
    beneficiary_country: string;
    beneficiary_city: string;
    beneficiary_address: string;
    beneficiary_email: string;
  };
}

/**
 * Crée un payout SEPA selon la spec Flexify V1 / Gate API
 */
export async function createSepaPayout(
  params: CreateSepaPayoutParams
): Promise<FlexifyPayoutResponse> {
  validateSepaConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyGatePayoutBody = {
    merchant_identifier: FLEXIFY_CONFIG.merchantIdentifier,
    method: 'sepa',
    mode: 'initial',
    reference: params.reference,
    currency: 'EUR',
    amount: amountEur,
    description: params.description || `Payout ${params.reference}`,
    customer: {
      identifier: params.customer.identifier,
      email: params.customer.email,
      phone: params.customer.phone || '',
      first_name: params.customer.first_name.trim(),
      last_name: params.customer.last_name.trim(),
      address: params.customer.address || '',
    },
    callback_url: FLEXIFY_CONFIG.callbackUrl,
    sepa: {
      account_number: params.sepa.iban,
      beneficiary_first_name: params.sepa.beneficiary_first_name.trim(),
      beneficiary_last_name: params.sepa.beneficiary_last_name.trim(),
      beneficiary_country: params.sepa.beneficiary_country.trim(),
      beneficiary_city: params.sepa.beneficiary_city.trim(),
      beneficiary_address: params.sepa.beneficiary_address.trim(),
      beneficiary_email: params.sepa.beneficiary_email.trim(),
      ...(params.sepa.bic ? { bic: params.sepa.bic } : {}),
    },
  };

  flexifyLog('STEP_CREATE_SEPA_PAYOUT_REQUEST', {
    reference: params.reference,
    amountEur,
    ibanMasked: `${params.sepa.iban.slice(0, 4)}****${params.sepa.iban.slice(-4)}`,
  });
  logPayoutTransaction('CREATE_SEPA_PAYOUT', params.reference, { amount: params.amountCents });

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payout', request, 3, false, 'sepa');
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

/** Body envoyé à la Gate API /v1/payout — champs requis selon Flexify */
interface FlexifyGatePayoutBody {
  merchant_identifier: string;
  method: FlexifyPaymentMethod;
  mode: 'initial';
  reference: string;
  currency: string;
  amount: string;
  description: string;
  customer: {
    identifier: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    address: string;
  };
  callback_url: string;
  sepa?: {
    account_number: string;
    beneficiary_first_name: string;
    beneficiary_last_name: string;
    beneficiary_country: string;
    beneficiary_city: string;
    beneficiary_address: string;
    beneficiary_email: string;
    bic?: string;
  };
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
  validateCardConfig();

  const amountEur = (params.amountCents / 100).toFixed(2);

  const request: FlexifyGatePayoutBody = {
    merchant_identifier: FLEXIFY_CONFIG.merchantIdentifier,
    method: 'card',
    mode: 'initial',
    reference: params.reference,
    currency: 'EUR',
    amount: amountEur,
    description: `Payout ${params.reference}`,
    customer: {
      identifier: params.customer.identifier,
      email: params.customer.email,
      phone: (params.customer as { phone?: string }).phone || '',
      first_name: (params.customer as { first_name?: string }).first_name || params.card.holderName.split(' ')[0] || '',
      last_name: (params.customer as { last_name?: string }).last_name || params.card.holderName.split(' ').slice(1).join(' ') || '',
      address: (params.customer as { address?: string }).address || '',
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

  return flexifyRequest<FlexifyPayoutResponse>('POST', '/v1/payout', request, 3, false, 'card');
}

// =============================================================================
// GESTION DES PAYOUTS
// =============================================================================

/**
 * Récupère le statut d'une transaction via Reporting API
 * Utilise Basic Auth selon la spec
 */
export async function getTransactionStatus(transactionId: string): Promise<FlexifyPayoutResponse> {
  validateReportingConfig();
  flexifyLog('GET_TRANSACTION_STATUS_START', { transactionId });

  const { apiKey, apiSecret } = getCredentials('reporting');
  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

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
  validateReportingConfig();
  flexifyLog('GET_TRANSACTION_BY_REF_START', { reference });

  const { apiKey, apiSecret } = getCredentials('reporting');
  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

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
 * Retourne le secret à utiliser pour vérifier la signature webhook selon le keyId reçu.
 * Flexify envoie le keyId (public key) utilisé pour la transaction (SEPA ou Carte).
 */
function getWebhookSecretForKeyId(keyId: string): string | null {
  const sepaKey = process.env.FLEXIFY_SEPA_PUBLIC_KEY ?? FLEXIFY_CONFIG.sepaApiKey;
  const cardKey = process.env.FLEXIFY_CARD_PUBLIC_KEY ?? FLEXIFY_CONFIG.cardApiKey;
  const genericKey = process.env.FLEXIFY_API_KEY ?? FLEXIFY_CONFIG.apiKey;
  if (keyId && sepaKey && keyId === sepaKey) {
    return process.env.FLEXIFY_SEPA_PRIVATE_KEY ?? FLEXIFY_CONFIG.sepaApiSecret;
  }
  if (keyId && cardKey && keyId === cardKey) {
    return process.env.FLEXIFY_CARD_PRIVATE_KEY ?? FLEXIFY_CONFIG.cardApiSecret;
  }
  if (keyId && genericKey && keyId === genericKey) {
    return process.env.FLEXIFY_API_SECRET ?? FLEXIFY_CONFIG.apiSecret;
  }
  return null;
}

/**
 * Valide la signature d'un webhook Flexify selon la spec H2H.
 * Accepte les keyId SEPA, Carte ou générique pour recalculer la signature avec la bonne clé.
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
    const signatureMatch = authorizationHeader.match(/signature="([^"]+)"/i);
    const keyIdMatch = authorizationHeader.match(/keyId="([^"]+)"/i);
    const headersMatch = authorizationHeader.match(/headers="([^"]+)"/i);

    if (!signatureMatch || !keyIdMatch || !headersMatch) {
      flexifyLog('WEBHOOK_SIGNATURE_PARSE_FAIL', { reason: 'Invalid Authorization header format' }, 'error');
      return false;
    }

    const receivedSignature = signatureMatch[1];
    const keyId = keyIdMatch[1].trim();

    const apiSecret = getWebhookSecretForKeyId(keyId);
    if (!apiSecret) {
      flexifyLog('WEBHOOK_SIGNATURE_KEYID_MISMATCH', { keyIdPrefix: keyId.slice(0, 8) }, 'error');
      return false;
    }

    const expectedDigest = generateDigest(rawBody);
    if (digestHeader !== expectedDigest) {
      flexifyLog('WEBHOOK_SIGNATURE_DIGEST_MISMATCH', {}, 'error');
      return false;
    }

    const signaturePayload = buildSignaturePayload(
      hostHeader,
      'POST',
      digestHeader,
      parseInt(contentLengthHeader, 10) || 0,
      dateHeader
    );

    const expectedSignature = generateSignature(signaturePayload, apiSecret);

    if (Buffer.byteLength(receivedSignature, 'utf8') !== Buffer.byteLength(expectedSignature, 'utf8')) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
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
 * Valide la config minimale pour les payouts (au moins une paire SEPA ou Carte + merchant)
 */
export function validateConfig(): void {
  if (!FLEXIFY_CONFIG.merchantIdentifier) {
    throw new Error('FLEXIFY_MERCHANT_IDENTIFIER is not configured');
  }
  const hasSepa = !!(process.env.FLEXIFY_SEPA_PUBLIC_KEY && process.env.FLEXIFY_SEPA_PRIVATE_KEY);
  const hasCard = !!(process.env.FLEXIFY_CARD_PUBLIC_KEY && process.env.FLEXIFY_CARD_PRIVATE_KEY);
  const hasGeneric = !!(process.env.FLEXIFY_API_KEY && process.env.FLEXIFY_API_SECRET);
  if (!hasSepa && !hasCard && !hasGeneric) {
    throw new Error(
      'Configure at least one of: (FLEXIFY_SEPA_PUBLIC_KEY + FLEXIFY_SEPA_PRIVATE_KEY), (FLEXIFY_CARD_PUBLIC_KEY + FLEXIFY_CARD_PRIVATE_KEY), or (FLEXIFY_API_KEY + FLEXIFY_API_SECRET)'
    );
  }
}

/**
 * Valide la config pour le reporting (balance, statut transaction)
 */
function validateReportingConfig(): void {
  if (!FLEXIFY_CONFIG.merchantIdentifier) {
    throw new Error('FLEXIFY_MERCHANT_IDENTIFIER is not configured');
  }
  const { apiKey, apiSecret } = getCredentials('reporting');
  if (!apiKey || !apiSecret) {
    throw new Error(
      'Reporting API requires FLEXIFY_API_KEY + FLEXIFY_API_SECRET, or FLEXIFY_SEPA_PUBLIC_KEY + FLEXIFY_SEPA_PRIVATE_KEY'
    );
  }
}


/**
 * Valide que les clés SEPA sont présentes (pour createSepaPayout)
 */
export function validateSepaConfig(): void {
  validateConfig();
  const { apiKey, apiSecret } = getCredentials('sepa');
  if (!apiKey || !apiSecret) {
    throw new Error('FLEXIFY_SEPA_PUBLIC_KEY and FLEXIFY_SEPA_PRIVATE_KEY are required for SEPA payouts');
  }
}

/**
 * Valide que les clés Carte sont présentes (pour createCardPayout)
 */
export function validateCardConfig(): void {
  validateConfig();
  const { apiKey, apiSecret } = getCredentials('card');
  if (!apiKey || !apiSecret) {
    throw new Error('FLEXIFY_CARD_PUBLIC_KEY and FLEXIFY_CARD_PRIVATE_KEY are required for card payouts');
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



