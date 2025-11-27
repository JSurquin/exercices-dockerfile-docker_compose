import { prisma } from '~/prisma/prisma';
import crypto from 'crypto';

// =============================================================================
// CONFIGURATION SUMSUB
// =============================================================================

export const SUMSUB_CONFIG = {
  appToken: process.env.SUMSUB_APP_TOKEN!,
  secretKey: process.env.SUMSUB_SECRET_KEY!,
  baseUrl: process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com',
  levelName: process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level',
};

// =============================================================================
// TYPES
// =============================================================================

export interface SumsubApplicant {
  id: string;
  externalUserId: string;
  email: string;
  phone?: string;
  fixedInfo?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    country?: string;
  };
}

export interface SumsubToken {
  token: string;
  userId: string;
}

export interface SumsubWebhookPayload {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  type: string;
  reviewStatus: string;
  reviewResult: {
    reviewAnswer: 'GREEN' | 'RED' | 'YELLOW';
    rejectLabels?: string[];
    reviewRejectType?: string;
  };
  createdAt: string;
}

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

// =============================================================================
// SIGNATURE GENERATION POUR SUMSUB
// =============================================================================

/**
 * Génère la signature pour les requêtes Sumsub
 */
function generateSumsubSignature(
  method: string,
  url: string,
  timestamp: number,
  body?: string
): string {
  const data = timestamp + method.toUpperCase() + url + (body || '');
  return crypto
    .createHmac('sha256', SUMSUB_CONFIG.secretKey)
    .update(data)
    .digest('hex');
}

/**
 * Prépare les headers pour une requête Sumsub
 */
function prepareSumsubHeaders(
  method: string,
  url: string,
  body?: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSumsubSignature(method, url, timestamp, body);

  return {
    'Content-Type': 'application/json',
    'X-App-Token': SUMSUB_CONFIG.appToken,
    'X-App-Access-Ts': timestamp.toString(),
    'X-App-Access-Sig': signature,
  };
}

// =============================================================================
// CRÉATION D'APPLICANT
// =============================================================================

export interface CreateApplicantParams {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * Crée un applicant Sumsub pour un utilisateur
 */
export async function createSumsubApplicant(
  params: CreateApplicantParams
): Promise<SumsubApplicant> {
  const url = '/resources/applicants?levelName=' + SUMSUB_CONFIG.levelName;
  const fullUrl = SUMSUB_CONFIG.baseUrl + url;

  const body = {
    externalUserId: params.userId,
    email: params.email,
    phone: params.phone,
    fixedInfo: {
      firstName: params.firstName,
      lastName: params.lastName,
    },
  };

  const bodyString = JSON.stringify(body);
  const headers = prepareSumsubHeaders('POST', url, bodyString);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
    body: bodyString,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Sumsub API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return await response.json();
}

// =============================================================================
// GÉNÉRATION DE TOKEN
// =============================================================================

/**
 * Génère un token d'accès Sumsub pour un utilisateur
 * Ce token permet de partager les données KYC avec GateFi
 */
export async function generateSumsubToken(
  userId: string,
  levelName?: string
): Promise<string> {
  const level = levelName || SUMSUB_CONFIG.levelName;
  const url = `/resources/accessTokens?userId=${userId}&levelName=${level}&ttlInSecs=3600`;
  const fullUrl = SUMSUB_CONFIG.baseUrl + url;

  const headers = prepareSumsubHeaders('POST', url);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Sumsub token generation error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.token;
}

// =============================================================================
// RÉCUPÉRATION DU STATUT KYC
// =============================================================================

/**
 * Récupère le statut KYC d'un applicant Sumsub
 */
export async function getSumsubApplicantStatus(
  applicantId: string
): Promise<{
  reviewStatus: string;
  reviewAnswer?: 'GREEN' | 'RED' | 'YELLOW';
}> {
  const url = `/resources/applicants/${applicantId}/status`;
  const fullUrl = SUMSUB_CONFIG.baseUrl + url;

  const headers = prepareSumsubHeaders('GET', url);

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Sumsub status check error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return await response.json();
}

// =============================================================================
// SYNCHRONISATION AVEC LA BASE DE DONNÉES
// =============================================================================

/**
 * Met à jour le statut KYC d'un utilisateur dans la base de données
 */
export async function updateUserKycStatus(
  userId: string,
  status: KycStatus,
  providerId?: string,
  rejectionReason?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: status },
  });

  // Créer un document KYC si providerId est fourni
  if (providerId) {
    // Chercher un document existant avec ce providerId
    const existingDoc = await prisma.kycDocument.findFirst({
      where: { providerId },
    });

    if (existingDoc) {
      // Mettre à jour le document existant
      await prisma.kycDocument.update({
        where: { id: existingDoc.id },
        data: {
          status,
          reviewedAt: new Date(),
          rejectionReason,
        },
      });
    } else {
      // Créer un nouveau document
      await prisma.kycDocument.create({
        data: {
          userId,
          type: 'ID_CARD', // Type par défaut
          status,
          providerId,
          reviewedAt: new Date(),
          rejectionReason,
        },
      });
    }
  }

  console.log(`[KYC] User ${userId} status updated to ${status}`);
}

// =============================================================================
// GESTION DES WEBHOOKS SUMSUB
// =============================================================================

/**
 * Convertit le statut Sumsub en statut KYC de l'application
 */
export function convertSumsubStatusToKycStatus(
  reviewAnswer: 'GREEN' | 'RED' | 'YELLOW'
): KycStatus {
  switch (reviewAnswer) {
    case 'GREEN':
      return 'VERIFIED';
    case 'RED':
      return 'REJECTED';
    case 'YELLOW':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}

/**
 * Traite un webhook Sumsub
 */
export async function processSumsubWebhook(
  payload: SumsubWebhookPayload
): Promise<void> {
  const { externalUserId, applicantId, reviewResult } = payload;

  if (!externalUserId) {
    console.error('[KYC Webhook] No externalUserId provided');
    return;
  }

  const kycStatus = convertSumsubStatusToKycStatus(reviewResult.reviewAnswer);
  const rejectionReason = reviewResult.rejectLabels?.join(', ');

  await updateUserKycStatus(
    externalUserId,
    kycStatus,
    applicantId,
    rejectionReason
  );

  // Log l'événement
  console.log('[KYC Webhook]', {
    userId: externalUserId,
    applicantId,
    status: kycStatus,
    reviewAnswer: reviewResult.reviewAnswer,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Valide la signature d'un webhook Sumsub
 */
export function validateSumsubWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', SUMSUB_CONFIG.secretKey)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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
 * Vérifie si un utilisateur peut effectuer un paiement (KYC validé)
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
 * Obtient ou crée un token Sumsub pour un utilisateur
 */
export async function getOrCreateSumsubToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    throw new Error('User email is required for KYC');
  }

  // Créer un applicant si nécessaire
  try {
    await createSumsubApplicant({
      userId,
      email: user.email,
      firstName: user.name?.split(' ')[0],
      lastName: user.name?.split(' ').slice(1).join(' '),
    });
  } catch (error) {
    // L'applicant existe déjà, c'est ok
    console.log('[KYC] Applicant may already exist:', error);
  }

  // Générer le token
  return await generateSumsubToken(userId);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valide la configuration Sumsub
 */
export function validateSumsubConfig(): void {
  if (!SUMSUB_CONFIG.appToken) {
    throw new Error('SUMSUB_APP_TOKEN is not configured');
  }
  if (!SUMSUB_CONFIG.secretKey) {
    throw new Error('SUMSUB_SECRET_KEY is not configured');
  }
}

