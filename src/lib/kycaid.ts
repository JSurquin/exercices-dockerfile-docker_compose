import { prisma } from '~/prisma/prisma';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION KYCAID
// =============================================================================

export const KYCAID_CONFIG = {
  apiToken: process.env.KYCAID_API_TOKEN!,
  sandboxMode: process.env.KYCAID_SANDBOX_MODE === 'true',
  baseUrl: process.env.KYCAID_BASE_URL || 'https://api.kycaid.com',
  formId: process.env.KYCAID_FORM_ID!, // ID du formulaire de vérification
  webhookSecret: process.env.KYCAID_WEBHOOK_SECRET!,
  // URLs
  callbackUrl: process.env.KYCAID_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/kycaid/webhook`,
  redirectUrl: process.env.KYCAID_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/kyc/complete`,
};

// =============================================================================
// TYPES
// =============================================================================

export type KycaidVerificationStatus = 
  | 'unused'
  | 'pending'
  | 'completed'
  | 'verified'
  | 'declined';

export type KycaidApplicantType = 'PERSON' | 'COMPANY';

export interface KycaidApplicant {
  applicant_id: string;
  type: KycaidApplicantType;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  dob?: string; // Date de naissance (YYYY-MM-DD)
  residence_country?: string; // Code ISO 2 lettres
  // Adresse
  address?: {
    full_address?: string;
    country?: string;
    state_or_province?: string;
    city?: string;
    postal_code?: string;
    street_name?: string;
    building_number?: string;
    unit_number?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface KycaidVerification {
  verification_id: string;
  applicant_id: string;
  status: KycaidVerificationStatus;
  verified: boolean;
  verification_status: string;
  form_id: string;
  form_url: string;
  created_at: string;
  updated_at: string;
  verifications?: {
    document?: {
      status: string;
      verified: boolean;
      decline_reasons?: string[];
    };
    facial?: {
      status: string;
      verified: boolean;
      decline_reasons?: string[];
    };
    address?: {
      status: string;
      verified: boolean;
      decline_reasons?: string[];
    };
    aml?: {
      status: string;
      verified: boolean;
      decline_reasons?: string[];
    };
  };
}

export interface KycaidWebhookPayload {
  request_id: string;
  type: 'VERIFICATION_COMPLETED' | 'VERIFICATION_STATUS_CHANGED' | 'APPLICANT_CREATED';
  verification_id?: string;
  applicant_id: string;
  status?: KycaidVerificationStatus;
  verified?: boolean;
  verification_status?: string;
  decline_reasons?: string[];
  created_at: string;
}

export interface CreateApplicantParams {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dob?: string;
  residenceCountry?: string;
}

export interface CreateVerificationParams {
  applicantId: string;
  formId?: string;
  externalApplicantId?: string;
  redirectUrl?: string;
}

// =============================================================================
// HEADERS & REQUÊTES
// =============================================================================

/**
 * Prépare les headers pour une requête KYCAID
 */
function prepareHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Token ${KYCAID_CONFIG.apiToken}`,
  };
}

/**
 * Effectue une requête vers l'API KYCAID avec retry
 */
async function kycaidRequest<T>(
  method: string,
  path: string,
  body?: object,
  retries: number = 3
): Promise<T> {
  const url = `${KYCAID_CONFIG.baseUrl}${path}`;
  const headers = prepareHeaders();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `KYCAID API error: ${response.status} - ${JSON.stringify(data)}`
        );
      }

      return data as T;
    } catch (error) {
      if (attempt === retries) throw error;
      // Backoff exponentiel
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw new Error('KYCAID request failed after retries');
}

// =============================================================================
// APPLICANTS
// =============================================================================

/**
 * Crée un nouvel applicant KYCAID
 */
export async function createApplicant(
  params: CreateApplicantParams
): Promise<KycaidApplicant> {
  validateConfig();

  const requestBody = {
    type: 'PERSON' as KycaidApplicantType,
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone: params.phone,
    dob: params.dob,
    residence_country: params.residenceCountry,
    external_applicant_id: params.userId, // Notre ID utilisateur
  };

  logKycTransaction('CREATE_APPLICANT', params.userId, { email: params.email });

  return kycaidRequest<KycaidApplicant>('POST', '/applicants', requestBody);
}

/**
 * Récupère un applicant par son ID
 */
export async function getApplicant(applicantId: string): Promise<KycaidApplicant> {
  validateConfig();

  return kycaidRequest<KycaidApplicant>('GET', `/applicants/${applicantId}`);
}

/**
 * Met à jour un applicant
 */
export async function updateApplicant(
  applicantId: string,
  data: Partial<CreateApplicantParams>
): Promise<KycaidApplicant> {
  validateConfig();

  const requestBody: Record<string, unknown> = {};
  if (data.firstName) requestBody.first_name = data.firstName;
  if (data.lastName) requestBody.last_name = data.lastName;
  if (data.email) requestBody.email = data.email;
  if (data.phone) requestBody.phone = data.phone;
  if (data.dob) requestBody.dob = data.dob;
  if (data.residenceCountry) requestBody.residence_country = data.residenceCountry;

  return kycaidRequest<KycaidApplicant>('PATCH', `/applicants/${applicantId}`, requestBody);
}

// =============================================================================
// VERIFICATIONS
// =============================================================================

/**
 * Crée une nouvelle vérification pour un applicant
 * Retourne l'URL du formulaire où l'utilisateur peut compléter sa vérification
 */
export async function createVerification(
  params: CreateVerificationParams
): Promise<KycaidVerification> {
  validateConfig();

  const requestBody = {
    applicant_id: params.applicantId,
    form_id: params.formId || KYCAID_CONFIG.formId,
    redirect_url: params.redirectUrl || KYCAID_CONFIG.redirectUrl,
    external_applicant_id: params.externalApplicantId,
  };

  logKycTransaction('CREATE_VERIFICATION', params.applicantId, {});

  return kycaidRequest<KycaidVerification>('POST', '/verifications', requestBody);
}

/**
 * Récupère le statut d'une vérification
 */
export async function getVerification(verificationId: string): Promise<KycaidVerification> {
  validateConfig();

  return kycaidRequest<KycaidVerification>('GET', `/verifications/${verificationId}`);
}

/**
 * Liste les vérifications d'un applicant
 */
export async function listApplicantVerifications(
  applicantId: string
): Promise<{ items: KycaidVerification[] }> {
  validateConfig();

  return kycaidRequest<{ items: KycaidVerification[] }>(
    'GET',
    `/applicants/${applicantId}/verifications`
  );
}

// =============================================================================
// FLOW COMPLET KYC
// =============================================================================

/**
 * Initie le processus KYC pour un utilisateur
 * Crée un applicant si nécessaire et retourne l'URL du formulaire
 */
export async function initiateKyc(userId: string): Promise<{
  verificationUrl: string;
  verificationId: string;
  applicantId: string;
}> {
  validateConfig();

  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, kycStatus: true },
  });

  if (!user?.email) {
    throw new Error('User email is required for KYC');
  }

  // Vérifier si un document KYC existe déjà
  const existingDoc = await prisma.kycDocument.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  let applicantId: string;

  if (existingDoc?.providerId) {
    // Utiliser l'applicant existant
    applicantId = existingDoc.providerId;
    logKycTransaction('REUSE_APPLICANT', userId, { applicantId });
  } else {
    // Créer un nouvel applicant
    const nameParts = user.name?.split(' ') || [];
    const applicant = await createApplicant({
      userId,
      email: user.email,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
    });
    applicantId = applicant.applicant_id;

    // Sauvegarder le providerId
    await prisma.kycDocument.create({
      data: {
        userId,
        type: 'ID_CARD',
        status: 'PENDING',
        providerId: applicantId,
      },
    });
  }

  // Créer une vérification
  const verification = await createVerification({
    applicantId,
    externalApplicantId: userId,
  });

  logKycTransaction('INITIATE_KYC', userId, {
    verificationId: verification.verification_id,
    formUrl: verification.form_url,
  });

  return {
    verificationUrl: verification.form_url,
    verificationId: verification.verification_id,
    applicantId,
  };
}

/**
 * Vérifie le statut KYC d'un utilisateur
 */
export async function checkKycStatus(userId: string): Promise<{
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationUrl?: string;
  declineReasons?: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Si déjà vérifié, retourner le statut
  if (user.kycStatus === 'VERIFIED') {
    return { status: 'VERIFIED' };
  }

  // Chercher le document KYC le plus récent
  const kycDoc = await prisma.kycDocument.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  if (!kycDoc?.providerId) {
    return { status: 'PENDING' };
  }

  try {
    // Vérifier le statut via KYCAID
    const verifications = await listApplicantVerifications(kycDoc.providerId);
    const latestVerification = verifications.items[0];

    if (!latestVerification) {
      return { status: 'PENDING' };
    }

    if (latestVerification.verified) {
      // Mettre à jour le statut en base
      await updateUserKycStatus(userId, 'VERIFIED', latestVerification.verification_id);
      return { status: 'VERIFIED' };
    }

    if (latestVerification.status === 'declined') {
      const reasons = collectDeclineReasons(latestVerification);
      return {
        status: 'REJECTED',
        declineReasons: reasons,
      };
    }

    return {
      status: 'PENDING',
      verificationUrl: latestVerification.form_url,
    };
  } catch (error) {
    console.error('[KYCAID] Error checking status:', error);
    return { status: 'PENDING' };
  }
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Valide la signature d'un webhook KYCAID
 */
export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', KYCAID_CONFIG.webhookSecret)
    .update(payload)
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
 * Traite un webhook KYCAID
 */
export async function processWebhook(payload: KycaidWebhookPayload): Promise<void> {
  const { type, applicant_id, verification_id, status, verified, decline_reasons } = payload;

  logKycTransaction('WEBHOOK_RECEIVED', applicant_id, { type, status, verified });

  // Trouver l'utilisateur via le document KYC
  const kycDoc = await prisma.kycDocument.findFirst({
    where: { providerId: applicant_id },
  });

  if (!kycDoc) {
    console.warn('[KYCAID Webhook] No user found for applicant:', applicant_id);
    return;
  }

  switch (type) {
    case 'VERIFICATION_COMPLETED':
    case 'VERIFICATION_STATUS_CHANGED':
      if (verified === true) {
        await updateUserKycStatus(kycDoc.userId, 'VERIFIED', verification_id);
      } else if (status === 'declined') {
        await updateUserKycStatus(
          kycDoc.userId,
          'REJECTED',
          verification_id,
          decline_reasons?.join(', ')
        );
      }
      break;

    case 'APPLICANT_CREATED':
      // L'applicant est créé, rien à faire de particulier
      break;
  }
}

// =============================================================================
// SYNCHRONISATION BASE DE DONNÉES
// =============================================================================

/**
 * Met à jour le statut KYC d'un utilisateur
 */
export async function updateUserKycStatus(
  userId: string,
  status: 'PENDING' | 'VERIFIED' | 'REJECTED',
  verificationId?: string,
  rejectionReason?: string
): Promise<void> {
  // Mettre à jour l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: status },
  });

  // Mettre à jour le document KYC si un verificationId est fourni
  if (verificationId) {
    const existingDoc = await prisma.kycDocument.findFirst({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    if (existingDoc) {
      await prisma.kycDocument.update({
        where: { id: existingDoc.id },
        data: {
          status,
          reviewedAt: new Date(),
          rejectionReason,
        },
      });
    }
  }

  // Logger l'événement
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'KYC_STATUS_CHANGED',
      details: {
        newStatus: status,
        verificationId,
        rejectionReason,
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log(`[KYCAID] User ${userId} KYC status updated to ${status}`);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si un utilisateur a un KYC validé
 */
export async function isUserKycVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });

  return user?.kycStatus === 'VERIFIED';
}

/**
 * Vérifie si un utilisateur peut effectuer un payout
 */
export async function canUserMakePayout(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const isVerified = await isUserKycVerified(userId);

  if (!isVerified) {
    return {
      allowed: false,
      reason: 'KYC verification required before making a payout',
    };
  }

  return { allowed: true };
}

/**
 * Collecte les raisons de refus d'une vérification
 */
function collectDeclineReasons(verification: KycaidVerification): string[] {
  const reasons: string[] = [];

  if (verification.verifications?.document?.decline_reasons) {
    reasons.push(...verification.verifications.document.decline_reasons);
  }
  if (verification.verifications?.facial?.decline_reasons) {
    reasons.push(...verification.verifications.facial.decline_reasons);
  }
  if (verification.verifications?.address?.decline_reasons) {
    reasons.push(...verification.verifications.address.decline_reasons);
  }
  if (verification.verifications?.aml?.decline_reasons) {
    reasons.push(...verification.verifications.aml.decline_reasons);
  }

  return [...new Set(reasons)]; // Dédupliquer
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide la configuration KYCAID
 */
export function validateConfig(): void {
  if (!KYCAID_CONFIG.apiToken) {
    throw new Error('KYCAID_API_TOKEN is not configured');
  }
  if (!KYCAID_CONFIG.formId) {
    throw new Error('KYCAID_FORM_ID is not configured');
  }
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log une transaction KYC pour le monitoring
 */
function logKycTransaction(
  action: string,
  userId: string,
  data: Record<string, unknown>
): void {
  console.log('[KYCAID]', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    sandboxMode: KYCAID_CONFIG.sandboxMode,
    ...data,
  });
}

