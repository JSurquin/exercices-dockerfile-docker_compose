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
  // URLs - En dev, on n'utilise pas les webhooks (localhost inaccessible)
  // En prod, KYCAID enverra les callbacks à l'URL de production
  callbackUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.KYCAID_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/kycaid/webhook`)
    : undefined, // Pas de callback en dev, on utilise le polling
  redirectUrl: process.env.KYCAID_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/kyc/complete`,
  // Mode développement : utiliser le polling au lieu des webhooks
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Log de la config au démarrage (masquer la clé API)
if (typeof window === 'undefined') {
  console.log('');
  console.log('🔑 [KYCAID CONFIG] Configuration chargée :');
  console.log(`  - Base URL: ${KYCAID_CONFIG.baseUrl}`);
  console.log(`  - Sandbox Mode: ${KYCAID_CONFIG.sandboxMode}`);
  console.log(`  - API Token: ${KYCAID_CONFIG.apiToken ? `${KYCAID_CONFIG.apiToken.substring(0, 10)}...` : '❌ MISSING'}`);
  console.log(`  - Form ID: ${KYCAID_CONFIG.formId || '❌ MISSING'}`);
  console.log(`  - Auth Header: API-Key (nouveau format)`);
  console.log('');
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

  console.log(`📡 [KYCAID REQUEST] ${method} ${url}`);
  if (body) {
    console.log(`📦 [KYCAID REQUEST] Body:`, JSON.stringify(body, null, 2));
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ [KYCAID REQUEST] Error ${response.status}:`, data);
        throw new Error(
          `KYCAID API error: ${response.status} - ${JSON.stringify(data)}`
        );
      }

      console.log(`✅ [KYCAID REQUEST] Success:`, data);
      return data as T;
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`⚠️  [KYCAID REQUEST] Attempt ${attempt} failed, retrying...`);
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
  
  console.log(`📤 [KYCAID] Upload du fichier ${fileName} (${mimeType})`);
  
  const formData = new FormData();
  
  if (Buffer.isBuffer(file)) {
    // Si Buffer, créer un Blob en convertissant correctement le buffer
    const uint8Array = new Uint8Array(file);
    const blob = new Blob([uint8Array], { type: mimeType });
    formData.append('file', blob, fileName);
    console.log(`  → Conversion Buffer → Blob : ${uint8Array.length} bytes`);
  } else {
    formData.append('file', file, fileName);
    console.log(`  → Fichier File direct : ${file.size} bytes`);
  }
  
  const url = `${KYCAID_CONFIG.baseUrl}/files`;
  
  console.log(`  → URL: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'API-Key': KYCAID_CONFIG.apiToken,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ [KYCAID] Erreur upload fichier : ${response.status}`);
    console.error(`   Response: ${error}`);
    throw new Error(`File upload failed: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  console.log(`✅ [KYCAID] Fichier uploadé avec succès : ${data.file_id}`);
  
  logKycTransaction('UPLOAD_FILE', '', { fileId: data.file_id, fileName });
  
  return data;
}

/**
 * DEPRECATED - Créer un file object vide (ancienne méthode)
 * Utiliser uploadFile() directement à la place
 */
export async function createFile(): Promise<{ file_id: string }> {
  console.warn('⚠️  [KYCAID] createFile() is deprecated, use uploadFile() directly');
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
 * Supprime côté KYCAID tous les documents "identité" existants pour cet applicant.
 * À appeler avant createDocument(type identité) pour éviter le 422 limit_exceeded.
 * On s'aligne sur l'état réel KYCAID (pas seulement notre DB) : même si notre DB
 * n'a pas la ligne, le document peut encore exister chez KYCAID.
 */
export async function deleteExistingIdentityDocumentsInKycaid(applicantId: string): Promise<void> {
  let list: { items?: KycaidDocument[] } = { items: [] };
  try {
    list = await listApplicantDocuments(applicantId);
  } catch (e) {
    console.warn('[KYCAID] listApplicantDocuments failed, skipping cleanup:', e);
  }
  const identityDocs = (list.items || []).filter((d) => isIdentityDocumentType(d.type));
  for (const d of identityDocs) {
    try {
      await deleteDocument(d.document_id);
      console.log(`  ✓ [KYCAID] Document identité supprimé: ${d.document_id}`);
    } catch (err) {
      console.warn(`  ⚠ [KYCAID] Suppression ${d.document_id} ignorée:`, err);
    }
  }
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
    console.log(`📡 [KYCAID] Callback URL configurée: ${KYCAID_CONFIG.callbackUrl}`);
  } else {
    console.log(`⚠️  [KYCAID] Mode développement: Pas de callback URL (utiliser le polling)`);
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

      // Sauvegarder en base
      await prisma.kycAddress.create({
        data: {
          applicantId,
          type: 'REGISTERED',
          country: addressData.country,
          city: addressData.city,
          postalCode: addressData.postalCode,
          streetName: addressData.streetName,
          buildingNumber: addressData.buildingNumber,
          unitNumber: addressData.unitNumber,
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

  // Chercher le document KYC le plus récent
  const kycDoc = await prisma.kycDocument.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  if (!kycDoc?.kycaidApplicantId) {
    return { status: 'PENDING' };
  }

  try {
    // Vérifier le statut via KYCAID
    const verifications = await listApplicantVerifications(kycDoc.kycaidApplicantId);
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
 * Traite un webhook KYCAID et met à jour la base de données
 */
export async function processWebhook(payload: KycaidWebhookPayload): Promise<void> {
  const { type, applicant_id, verification_id, status, verified, decline_reasons } = payload;

  logKycTransaction('WEBHOOK_RECEIVED', applicant_id, { type, status, verified });

  // Trouver l'utilisateur via kycaidApplicantId
  const user = await prisma.user.findFirst({
    where: { kycaidApplicantId: applicant_id },
  });

  if (!user) {
    console.warn('[KYCAID Webhook] No user found for applicant:', applicant_id);
    return;
  }

  switch (type) {
    case 'VERIFICATION_COMPLETED':
    case 'VERIFICATION_STATUS_CHANGED':
      if (verification_id) {
        // Récupérer les détails complets de la vérification
        const verificationDetails = await getVerification(verification_id);

        // Mettre à jour KycVerification
        await prisma.kycVerification.upsert({
          where: { kycaidVerificationId: verification_id },
          update: {
            status: status?.toUpperCase() as any || 'COMPLETED',
            verified: verified || false,
            documentStatus: verificationDetails.verifications?.document?.status,
            documentVerified: verificationDetails.verifications?.document?.verified,
            facialStatus: verificationDetails.verifications?.facial?.status,
            facialVerified: verificationDetails.verifications?.facial?.verified,
            addressStatus: verificationDetails.verifications?.address?.status,
            addressVerified: verificationDetails.verifications?.address?.verified,
            amlStatus: verificationDetails.verifications?.aml?.status,
            amlVerified: verificationDetails.verifications?.aml?.verified,
            declineReasons: decline_reasons as any,
            metadata: verificationDetails as any,
            completedAt: new Date(),
          },
          create: {
            userId: user.id,
            kycaidVerificationId: verification_id,
            kycaidApplicantId: applicant_id,
            status: 'COMPLETED',
            verified: verified || false,
            metadata: verificationDetails as any,
          },
        });

        // Mettre à jour le statut utilisateur
        if (verified === true) {
          await updateUserKycStatus(user.id, 'VERIFIED', verification_id);
        } else if (status === 'declined') {
          await updateUserKycStatus(
            user.id,
            'REJECTED',
            verification_id,
            decline_reasons?.join(', ')
          );
        }
      }
      break;

    case 'APPLICANT_CREATED':
      // Rien de particulier
      break;
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

  console.log(`[KYCAID] User ${userId} KYC status updated to ${status}`);

  // N'envoyer l'email que si le statut vient vraiment de changer (évite doublons / re-polling)
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
        console.log(`📧 [KYCAID] Envoi de l'email d'approbation KYC à ${currentUser.email}`);
        await emailService.sendKycApprovedEmail(currentUser.email, username);
        console.log(`✅ [KYCAID] Email d'approbation KYC envoyé avec succès`);
      } else if (status === 'REJECTED') {
        console.log(`📧 [KYCAID] Envoi de l'email de rejet KYC à ${currentUser.email}`);
        await emailService.sendKycRejectedEmail(
          currentUser.email,
          username,
          rejectionReason || 'Aucune raison spécifiée'
        );
        console.log(`✅ [KYCAID] Email de rejet KYC envoyé avec succès`);
      }
    } else {
      console.warn(`⚠️  [KYCAID] Impossible d'envoyer l'email : email utilisateur non trouvé pour userId ${userId}`);
    }
  } catch (emailError: any) {
    console.error(`⚠️  [KYCAID] Erreur lors de l'envoi de l'email de notification KYC (non bloquant) :`, emailError.message);
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
  console.log('[KYCAID]', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    sandboxMode: KYCAID_CONFIG.sandboxMode,
    ...data,
  });
}

