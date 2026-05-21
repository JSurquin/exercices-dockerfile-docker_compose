import { prisma } from '~/prisma/prisma';
import { encrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

// =============================================================================
// CONFIGURATION KYCAID
// =============================================================================

export const KYCAID_CONFIG = {
  apiToken: process.env.KYCAID_API_TOKEN!,
  sandboxMode: process.env.KYCAID_SANDBOX_MODE === 'true',
  baseUrl: process.env.KYCAID_BASE_URL || 'https://api.kycaid.com',
  formId: process.env.KYCAID_FORM_ID!, // ID du formulaire de vérification
  // callback_url : toujours envoyer si configuré (même en dev avec un tunnel ngrok/cloudflare).
  // En dev sans tunnel, laisser KYCAID_CALLBACK_URL vide dans .env pour utiliser le polling.
  callbackUrl: process.env.KYCAID_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/kycaid/webhook`
      : undefined),
  redirectUrl: process.env.KYCAID_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/kyc/complete`,
  // Mode développement : utiliser le polling au lieu des webhooks
  isDevelopment: process.env.NODE_ENV === 'development',
};

if (typeof window === 'undefined') {
  logger.debug('[KYCAID] Config loaded', {
    sandbox: KYCAID_CONFIG.sandboxMode,
    hasToken: !!KYCAID_CONFIG.apiToken,
    hasFormId: !!KYCAID_CONFIG.formId,
  });
}

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
  type: 'VERIFICATION_COMPLETED' | 'VERIFICATION_STATUS_CHANGED' | 'APPLICANT_CREATED' | 'FORM_URL_EXPIRED';
  verification_id?: string;
  applicant_id: string;
  external_applicant_id?: string;
  form_id?: string;
  form_token?: string;
  // VERIFICATION_COMPLETED : status = "completed", verified = true|false
  status?: KycaidVerificationStatus | 'completed';
  verified?: boolean | null;
  // VERIFICATION_STATUS_CHANGED : verification_status = "pending"
  verification_status?: string;
  decline_reasons?: string[];
  // Verifications détaillées incluses directement dans le payload VERIFICATION_COMPLETED
  verifications?: {
    profile?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    document?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    facial?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    address?: { verified: boolean; comment?: string; decline_reasons?: string[] };
    aml?: { verified: boolean; comment?: string; decline_reasons?: string[] };
  };
  applicant?: Record<string, unknown>;
  created_at?: string;
  verification_attempts_left?: number | null;
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
// ADDRESSES
// =============================================================================

export interface KycaidAddress {
  address_id: string;
  applicant_id?: string;
  affiliated_person_id?: string;
  type: 'REGISTERED' | 'BUSINESS' | 'ADDITIONAL';
  country: string;
  city: string;
  postal_code: string;
  street_name: string;
  building_number: string;
  unit_number?: string;
  state_or_province?: string;
  full_address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressParams {
  applicant_id?: string;
  affiliated_person_id?: string;
  type: 'REGISTERED' | 'BUSINESS' | 'ADDITIONAL';
  country: string;
  city: string;
  postal_code: string;
  street_name: string;
  building_number: string;
  unit_number?: string;
  state_or_province?: string;
}

// =============================================================================
// FILES
// =============================================================================

export interface KycaidFile {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export interface KycaidDocument {
  document_id: string;
  applicant_id: string;
  type: string;
  front_side_id?: string;
  back_side_id?: string;
  status: string;
  verified: boolean;
  decline_reasons?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentParams {
  applicant_id: string;
  type: string;
  front_side_id: string;
  back_side_id?: string; // Pour cartes ID recto/verso
}

/**
 * Types de documents "identité" pour lesquels KYCAID n'autorise qu'UN SEUL document
 * par applicant. Créer un second document de ce groupe → 422 limit_exceeded.
 */
export const KYCAID_IDENTITY_DOCUMENT_TYPES = [
  'DOMESTIC_PASSPORT',
  'DRIVERS_LICENSE',
  'FOREIGN_CITIZEN_PASSPORT',
  'GOVERNMENT_ID',
  'PASSPORT',
  'PERMANENT_RESIDENCE_PERMIT',
  'REFUGEE_CARD',
] as const;

export function isIdentityDocumentType(type: string): boolean {
  return (KYCAID_IDENTITY_DOCUMENT_TYPES as readonly string[]).includes(type);
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
    'API-Key': KYCAID_CONFIG.apiToken,
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

  logger.debug(`[KYCAID] ${method} ${path}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`[KYCAID] API error ${response.status} on ${method} ${path}`);
        const err = new Error(
          `KYCAID API error: ${response.status} - ${JSON.stringify(data)}`
        ) as Error & { status?: number; data?: unknown };
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data as T;
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 422) {
        throw error;
      }
      if (attempt === retries) throw error;
      logger.warn(`[KYCAID] Attempt ${attempt} failed on ${method} ${path}, retrying...`);
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
// ADDRESSES
// =============================================================================

/**
 * Crée une adresse pour un applicant ou affiliated person
 */
export async function createAddress(
  params: CreateAddressParams
): Promise<KycaidAddress> {
  validateConfig();
  
  if (!params.applicant_id && !params.affiliated_person_id) {
    throw new Error('Either applicant_id or affiliated_person_id is required');
  }
  
  logKycTransaction('CREATE_ADDRESS', params.applicant_id || params.affiliated_person_id || '', {
    type: params.type,
    country: params.country,
  });
  
  return kycaidRequest<KycaidAddress>('POST', '/addresses', params);
}

/**
 * Récupère une adresse par son ID
 */
export async function getAddress(addressId: string): Promise<KycaidAddress> {
  validateConfig();
  return kycaidRequest<KycaidAddress>('GET', `/addresses/${addressId}`);
}

/**
 * Met à jour une adresse existante
 */
export async function updateAddress(
  addressId: string,
  data: Partial<CreateAddressParams>
): Promise<KycaidAddress> {
  validateConfig();
  return kycaidRequest<KycaidAddress>('PATCH', `/addresses/${addressId}`, data);
}

/**
 * Supprime une adresse
 */
export async function deleteAddress(addressId: string): Promise<void> {
  validateConfig();
  await kycaidRequest<void>('DELETE', `/addresses/${addressId}`);
}

/**
 * Liste les adresses d'un applicant
 */
export async function listApplicantAddresses(
  applicantId: string
): Promise<{ items: KycaidAddress[] }> {
  validateConfig();
  return kycaidRequest<{ items: KycaidAddress[] }>(
    'GET',
    `/applicants/${applicantId}/addresses`
  );
}

// =============================================================================
// FILES
// =============================================================================

/**
 * Upload un fichier vers KYCAID directement
 * Retourne le file_id créé
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  mimeType: string
): Promise<{ file_id: string }> {
  validateConfig();
  
  const formData = new FormData();
  
  if (Buffer.isBuffer(file)) {
    const uint8Array = new Uint8Array(file);
    const blob = new Blob([uint8Array], { type: mimeType });
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', file, fileName);
  }
  
  const url = `${KYCAID_CONFIG.baseUrl}/files`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'API-Key': KYCAID_CONFIG.apiToken,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    logger.error(`[KYCAID] File upload failed: ${response.status}`);
    throw new Error(`File upload failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  logKycTransaction('UPLOAD_FILE', '', { fileId: data.file_id, fileName });
  
  return data;
}

/**
 * DEPRECATED - Créer un file object vide (ancienne méthode)
 * Utiliser uploadFile() directement à la place
 */
export async function createFile(): Promise<{ file_id: string }> {
  logger.warn('[KYCAID] createFile() is deprecated, use uploadFile() directly');
  throw new Error('createFile() is deprecated - use uploadFile() directly with file content');
}

/**
 * Récupère les infos d'un fichier
 */
export async function getFile(fileId: string): Promise<KycaidFile> {
  validateConfig();
  return kycaidRequest<KycaidFile>('GET', `/files/${fileId}`);
}

// =============================================================================
// DOCUMENTS
// =============================================================================

/**
 * Crée un document lié à un applicant
 */
export async function createDocument(
  params: CreateDocumentParams
): Promise<KycaidDocument> {
  validateConfig();
  
  logKycTransaction('CREATE_DOCUMENT', params.applicant_id, {
    type: params.type,
    frontSideId: params.front_side_id,
  });
  
  return kycaidRequest<KycaidDocument>('POST', '/documents', params);
}

/**
 * Récupère un document par son ID
 */
export async function getDocument(documentId: string): Promise<KycaidDocument> {
  validateConfig();
  return kycaidRequest<KycaidDocument>('GET', `/documents/${documentId}`);
}

/**
 * Supprime un document côté KYCAID.
 * À utiliser avant de recréer un document d'identité (KYCAID n'autorise qu'un seul par applicant).
 */
export async function deleteDocument(documentId: string): Promise<void> {
  validateConfig();
  await kycaidRequest<void>('DELETE', `/documents/${documentId}`);
}

/**
 * Récupère la liste des documents depuis la réponse KYCAID (plusieurs formats possibles).
 */
function parseDocumentsList(raw: unknown): KycaidDocument[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as KycaidDocument[];
    if (Array.isArray(o.documents)) return o.documents as KycaidDocument[];
    if (Array.isArray(o.data)) return o.data as KycaidDocument[];
  }
  return [];
}

/**
 * Supprime côté KYCAID tous les documents "identité" existants pour cet applicant.
 * Retourne les document_id qui sont encore présents après tentative de suppression
 * (si DELETE échoue ou n'existe pas, on ne fait pas createDocument → pas de 422).
 */
export async function deleteExistingIdentityDocumentsInKycaid(
  applicantId: string
): Promise<{ deleted: string[]; stillPresent: string[] }> {
  let rawList: unknown = {};
  try {
    rawList = await listApplicantDocuments(applicantId);
  } catch (e) {
    logger.warn('[KYCAID] listApplicantDocuments failed');
    return { deleted: [], stillPresent: [] };
  }
  const allDocs = parseDocumentsList(rawList);
  const docId = (d: KycaidDocument & { documentId?: string }) => d.document_id || (d as { documentId?: string }).documentId || '';
  const identityDocs = allDocs.filter((d) => isIdentityDocumentType(String(d.type || '').toUpperCase()));

  const deleted: string[] = [];
  for (const d of identityDocs) {
    const id = docId(d);
    if (!id) continue;
    try {
      await deleteDocument(id);
      deleted.push(id);
    } catch (err) {
      logger.warn(`[KYCAID] DELETE document ${id} failed`);
    }
  }

  let stillPresent: string[] = [];
  try {
    const rawAgain = await listApplicantDocuments(applicantId);
    const afterList = parseDocumentsList(rawAgain);
    const stillIdentity = afterList.filter((d) => isIdentityDocumentType(String(d.type || '').toUpperCase()));
    stillPresent = stillIdentity.map((d) => docId(d)).filter(Boolean);
    if (stillPresent.length) {
      logger.warn(`[KYCAID] Identity documents still present after deletion: ${stillPresent.length}`);
    }
  } catch {
    // si la 2e liste échoue, on considère qu'il peut en rester
    stillPresent = identityDocs.map((d) => d.document_id);
  }
  return { deleted, stillPresent };
}

/**
 * Liste les documents d'un applicant
 */
export async function listApplicantDocuments(
  applicantId: string
): Promise<{ items: KycaidDocument[] }> {
  validateConfig();
  return kycaidRequest<{ items: KycaidDocument[] }>(
    'GET',
    `/applicants/${applicantId}/documents`
  );
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

  const requestBody: Record<string, any> = {
    applicant_id: params.applicantId,
    form_id: params.formId || KYCAID_CONFIG.formId,
    redirect_url: params.redirectUrl || KYCAID_CONFIG.redirectUrl,
    external_applicant_id: params.externalApplicantId,
  };

  // En production uniquement, ajouter le callback_url
  // En dev, on n'ajoute PAS de callback_url car localhost n'est pas accessible
  if (KYCAID_CONFIG.callbackUrl) {
    requestBody.callback_url = KYCAID_CONFIG.callbackUrl;
  }

  logKycTransaction('CREATE_VERIFICATION', params.applicantId, {
    isDevelopment: KYCAID_CONFIG.isDevelopment,
    hasCallbackUrl: !!KYCAID_CONFIG.callbackUrl,
  });

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
 * Initie le processus KYC COMPLET pour un utilisateur
 * Flow : Applicant → Address (si fournie) → Verification
 */
export async function initiateKyc(
  userId: string,
  addressData?: {
    country: string;
    city: string;
    postalCode: string;
    streetName: string;
    buildingNumber: string;
    unitNumber?: string;
  }
): Promise<{
  verificationUrl: string;
  verificationId: string;
  applicantId: string;
}> {
  validateConfig();

  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      email: true, 
      name: true, 
      kycStatus: true,
      kycaidApplicantId: true, // Champ existant
    },
  });

  if (!user?.email) {
    throw new Error('User email is required for KYC');
  }

  let applicantId: string;

  // Étape 1 : Créer ou réutiliser l'applicant
  if (user.kycaidApplicantId) {
    applicantId = user.kycaidApplicantId;
    logKycTransaction('REUSE_APPLICANT', userId, { applicantId });
  } else {
    const nameParts = user.name?.split(' ') || [];
    const applicant = await createApplicant({
      userId,
      email: user.email,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
    });
    applicantId = applicant.applicant_id;

    // Sauvegarder l'applicantId dans User
    await prisma.user.update({
      where: { id: userId },
      data: { kycaidApplicantId: applicantId },
    });
  }

  // Étape 2 : Créer une adresse si fournie (PROOF OF ADDRESS)
  if (addressData) {
    try {
      const address = await createAddress({
        applicant_id: applicantId,
        type: 'REGISTERED',
        country: addressData.country,
        city: addressData.city,
        postal_code: addressData.postalCode,
        street_name: addressData.streetName,
        building_number: addressData.buildingNumber,
        unit_number: addressData.unitNumber,
      });

      // Sauvegarder en base — champs sensibles chiffrés AES-256-GCM
      await prisma.kycAddress.create({
        data: {
          applicantId,
          type: 'REGISTERED',
          country: addressData.country,
          city: encrypt(addressData.city),
          postalCode: encrypt(addressData.postalCode),
          streetName: encrypt(addressData.streetName),
          buildingNumber: encrypt(addressData.buildingNumber ?? ''),
          unitNumber: addressData.unitNumber ? encrypt(addressData.unitNumber) : null,
          kycaidAddressId: address.address_id,
        },
      });

      logKycTransaction('ADDRESS_CREATED', userId, { addressId: address.address_id });
    } catch (error) {
      console.error('[KYCAID] Address creation failed:', error);
      // Ne pas bloquer le flow si l'adresse échoue
    }
  }

  // Étape 3 : Créer la vérification
  const verification = await createVerification({
    applicantId,
    externalApplicantId: userId,
  });

  // Étape 4 : Sauvegarder la vérification en base
  await prisma.kycVerification.create({
    data: {
      userId,
      kycaidVerificationId: verification.verification_id,
      kycaidApplicantId: applicantId,
      status: verification.status.toUpperCase() as any,
      verified: verification.verified,
      formUrl: verification.form_url,
    },
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

  // Chercher la vérification KYC la plus récente (source principale)
  const kycVerification = await prisma.kycVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fallback : ancienne table kycDocument
  const applicantId =
    kycVerification?.kycaidApplicantId ||
    (await prisma.kycDocument
      .findFirst({ where: { userId }, orderBy: { uploadedAt: 'desc' } })
      .then((d) => d?.kycaidApplicantId ?? null));

  if (!applicantId) {
    return { status: 'PENDING' };
  }

  try {
    // Vérifier le statut via KYCAID
    const verifications = await listApplicantVerifications(applicantId);
    const latestVerification = verifications.items[0];

    if (!latestVerification) {
      return { status: 'PENDING' };
    }

    if (latestVerification.verified) {
      await updateUserKycStatus(userId, 'VERIFIED', latestVerification.verification_id);
      return { status: 'VERIFIED' };
    }

    if (latestVerification.status === 'declined' || 
        (latestVerification.status === 'completed' && latestVerification.verified === false)) {
      const reasons = collectDeclineReasons(latestVerification);
      // Mettre à jour le statut en base quand on détecte un refus via polling
      await updateUserKycStatus(
        userId,
        'REJECTED',
        latestVerification.verification_id,
        reasons.join(', ') || undefined
      );
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

// Note: KYCAID ne signe pas ses webhooks avec un HMAC/secret.
// La sécurité repose sur le fait que le callback_url est privé
// et sur la vérification de l'applicant_id en base.

/**
 * Traite un webhook KYCAID et met à jour la base de données.
 *
 * VERIFICATION_STATUS_CHANGED → le formulaire a été soumis, vérification en cours (pending).
 * VERIFICATION_COMPLETED      → la vérification est terminée, verified = true|false.
 */
export async function processWebhook(payload: KycaidWebhookPayload): Promise<void> {
  const { type, applicant_id, verification_id, status, verified, decline_reasons } = payload;

  logKycTransaction('WEBHOOK_RECEIVED', applicant_id, { type, status, verified });

  // Trouver l'utilisateur via kycaidApplicantId
  const user = await prisma.user.findFirst({
    where: { kycaidApplicantId: applicant_id },
  });

  if (!user) {
    // Fallback : chercher via external_applicant_id si disponible
    if (payload.external_applicant_id) {
      const userByExtId = await prisma.user.findUnique({
        where: { id: payload.external_applicant_id },
      });
      if (userByExtId) {
        // Mémoriser l'applicant_id pour les prochains webhooks
        await prisma.user.update({
          where: { id: userByExtId.id },
          data: { kycaidApplicantId: applicant_id },
        });
        logger.info(`[KYCAID Webhook] Linked applicant to user via external_applicant_id`);
        return processWebhook({ ...payload });
      }
    }
    logger.warn('[KYCAID Webhook] No user found for applicant');
    return;
  }

  switch (type) {
    case 'VERIFICATION_STATUS_CHANGED': {
      // Le formulaire a été soumis, la vérification est en attente de traitement.
      // On ne change pas encore le statut utilisateur, on enregistre juste l'état pending.
      if (!verification_id) break;

      await prisma.kycVerification.upsert({
        where: { kycaidVerificationId: verification_id },
        update: {
          status: 'PENDING',
          verified: false,
        },
        create: {
          userId: user.id,
          kycaidVerificationId: verification_id,
          kycaidApplicantId: applicant_id,
          status: 'PENDING',
          verified: false,
        },
      });

      // Mettre le statut utilisateur en PENDING si ce n'est pas déjà VERIFIED/REJECTED
      if (user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'REJECTED') {
        await prisma.user.update({
          where: { id: user.id },
          data: { kycStatus: 'PENDING' },
        });
      }
      break;
    }

    case 'VERIFICATION_COMPLETED': {
      if (!verification_id) break;

      // Récupérer les détails complets via API pour avoir tous les champs (status par sous-type)
      let verificationDetails: KycaidVerification;
      try {
        verificationDetails = await getVerification(verification_id);
      } catch (err) {
        console.error('[KYCAID Webhook] Could not fetch verification details, using payload data:', err);
        // Fallback : utiliser les données du payload directement
        verificationDetails = {
          verification_id,
          applicant_id,
          status: (status as KycaidVerificationStatus) || 'completed',
          verified: verified === true,
          verification_status: status || '',
          form_id: payload.form_id || '',
          form_url: '',
          created_at: payload.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          verifications: payload.verifications as KycaidVerification['verifications'],
        };
      }

      // Déterminer les raisons de refus depuis l'API ou le payload
      const allDeclineReasons = decline_reasons && decline_reasons.length > 0
        ? decline_reasons
        : collectDeclineReasons(verificationDetails);

      const isVerified = verified === true;
      const isDeclined = verified === false || status === 'declined';
      const dbStatus = isVerified ? 'VERIFIED' : isDeclined ? 'REJECTED' : 'COMPLETED';

      await prisma.kycVerification.upsert({
        where: { kycaidVerificationId: verification_id },
        update: {
          status: dbStatus as any,
          verified: isVerified,
          documentStatus: verificationDetails.verifications?.document?.status,
          documentVerified: verificationDetails.verifications?.document?.verified,
          facialStatus: verificationDetails.verifications?.facial?.status,
          facialVerified: verificationDetails.verifications?.facial?.verified,
          addressStatus: verificationDetails.verifications?.address?.status,
          addressVerified: verificationDetails.verifications?.address?.verified,
          amlStatus: verificationDetails.verifications?.aml?.status,
          amlVerified: verificationDetails.verifications?.aml?.verified,
          declineReasons: allDeclineReasons as any,
          metadata: verificationDetails as any,
          completedAt: new Date(),
        },
        create: {
          userId: user.id,
          kycaidVerificationId: verification_id,
          kycaidApplicantId: applicant_id,
          status: dbStatus as any,
          verified: isVerified,
          declineReasons: allDeclineReasons as any,
          metadata: verificationDetails as any,
          completedAt: new Date(),
        },
      });

      if (isVerified) {
        await updateUserKycStatus(user.id, 'VERIFIED', verification_id);
      } else if (isDeclined) {
        await updateUserKycStatus(
          user.id,
          'REJECTED',
          verification_id,
          allDeclineReasons.join(', ') || undefined
        );
      }
      break;
    }

    case 'APPLICANT_CREATED':
      // Rien à faire — l'applicant est déjà lié en base lors de l'initiation
      break;

    default:
      logger.debug(`[KYCAID Webhook] Unhandled type: ${type}`);
  }
}

// =============================================================================
// SYNCHRONISATION BASE DE DONNÉES
// =============================================================================

/**
 * Met à jour le statut KYC d'un utilisateur.
 * L'email de notification n'est envoyé que lors d'un vrai changement de statut
 * (passage à VERIFIED ou REJECTED depuis un autre statut), pour éviter les doublons.
 */
export async function updateUserKycStatus(
  userId: string,
  status: 'PENDING' | 'VERIFIED' | 'REJECTED',
  verificationId?: string,
  rejectionReason?: string
): Promise<void> {
  // Lire le statut actuel avant mise à jour (pour n'envoyer l'email qu'en cas de changement)
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, email: true, steamUsername: true },
  });
  const previousStatus = currentUser?.kycStatus ?? null;

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

  logger.info(`[KYCAID] User KYC status updated to ${status}`);

  const statusActuallyChanged =
    (status === 'VERIFIED' && previousStatus !== 'VERIFIED' && previousStatus !== 'KYCAID_VERIFIED') ||
    (status === 'REJECTED' && previousStatus !== 'REJECTED');

  if (!statusActuallyChanged) {
    return;
  }

  try {
    if (currentUser?.email) {
      const { emailService } = await import('./email');
      const username = currentUser.steamUsername || 'Utilisateur';

      if (status === 'VERIFIED') {
        await emailService.sendKycApprovedEmail(currentUser.email, username);
      } else if (status === 'REJECTED') {
        await emailService.sendKycRejectedEmail(
          currentUser.email,
          username,
          rejectionReason || 'Aucune raison spécifiée'
        );
      }
    } else {
      logger.warn(`[KYCAID] Cannot send email: no email found for user`);
    }
  } catch (emailError: any) {
    logger.error(`[KYCAID] Failed to send KYC notification email (non-blocking)`, emailError);
  }

  try {
    const { notifyAdminsKycResolved } = await import('@/lib/admin-notification-hooks');
    if (status === 'VERIFIED') {
      await notifyAdminsKycResolved(userId, 'VERIFIED');
    } else if (status === 'REJECTED') {
      await notifyAdminsKycResolved(userId, 'REJECTED', rejectionReason);
    }
  } catch (notifyError) {
    logger.warn('[KYCAID] Admin KYC notification failed (non-blocking)', notifyError);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Vérifie si un utilisateur a un KYC validé (VERIFIED ou KYCAID_VERIFIED).
 */
export async function isUserKycVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });

  return user?.kycStatus === 'VERIFIED' || user?.kycStatus === 'KYCAID_VERIFIED';
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
  logger.debug(`[KYCAID] ${action}`, { userId, ...data });
}

