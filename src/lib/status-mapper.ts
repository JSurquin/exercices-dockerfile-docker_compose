/**
 * Fonctions utilitaires pour mapper entre les statuts Prisma et les statuts d'affichage
 */

// Mapping pour les statuts de Trade
type TradeStatus = "créé" | "accepté_par_bot" | "en_trade_hold" | "disponible" | "paiement_en_cours" | "payé" | "échoué";

export function mapTradeStatusFromDb(prismaStatus: string): TradeStatus {
  const mapping: Record<string, TradeStatus> = {
    'CREATED': 'créé',
    'ACCEPTED_BY_BOT': 'accepté_par_bot',
    'IN_TRADE_HOLD': 'en_trade_hold',
    'AVAILABLE': 'disponible',
    'PAYOUT_PENDING': 'paiement_en_cours',
    'PAID': 'payé',
    'FAILED': 'échoué',
  };
  return mapping[prismaStatus] || ('créé' as TradeStatus);
}

export function mapTradeStatusToDb(displayStatus: string): string {
  const mapping: Record<string, string> = {
    'créé': 'CREATED',
    'accepté_par_bot': 'ACCEPTED_BY_BOT',
    'en_trade_hold': 'IN_TRADE_HOLD',
    'disponible': 'AVAILABLE',
    'paiement_en_cours': 'PAYOUT_PENDING',
    'payé': 'PAID',
    'échoué': 'FAILED',
  };
  return mapping[displayStatus] || displayStatus.toUpperCase();
}

// Mapping pour les statuts de Payout
type PayoutStatus = "en_attente" | "vérification_requise" | "vérifié" | "planifié" | "exécuté" | "payé" | "échoué";

export function mapPayoutStatusFromDb(prismaStatus: string): PayoutStatus {
  const mapping: Record<string, PayoutStatus> = {
    'PENDING': 'en_attente',
    'VERIFICATION_REQUIRED': 'vérification_requise',
    'VERIFIED': 'vérifié',
    'SCHEDULED': 'planifié',
    'PROCESSING': 'exécuté',
    'PAID': 'payé',
    'FAILED': 'échoué',
    'FLEXIFY_PENDING': 'en_attente',
    'FLEXIFY_PROCESSING': 'exécuté',
    'FLEXIFY_PAID': 'payé',
    'FLEXIFY_FAILED': 'échoué',
  };
  return mapping[prismaStatus] || ('en_attente' as PayoutStatus);
}

export function mapPayoutStatusToDb(displayStatus: string): string {
  const mapping: Record<string, string> = {
    'en_attente': 'PENDING',
    'vérification_requise': 'VERIFICATION_REQUIRED',
    'vérifié': 'VERIFIED',
    'planifié': 'SCHEDULED',
    'en_cours': 'PROCESSING',
    'payé': 'PAID',
    'échoué': 'FAILED',
  };
  return mapping[displayStatus] || displayStatus.toUpperCase();
}

// Mapping pour les statuts KYC
type KycStatus = "pending" | "approved" | "rejected" | "in_progress";

export function mapKycStatusFromDb(prismaStatus: string): KycStatus {
  const mapping: Record<string, KycStatus> = {
    'PENDING': 'pending',
    'VERIFIED': 'approved',
    'REJECTED': 'rejected',
    'IN_PROGRESS': 'in_progress',
    'KYCAID_PENDING': 'pending',
    'KYCAID_VERIFIED': 'approved',
    'KYCAID_REJECTED': 'rejected',
  };
  return mapping[prismaStatus] || ('pending' as KycStatus);
}

export function mapKycStatusToDb(displayStatus: string): string {
  const mapping: Record<string, string> = {
    'pending': 'PENDING',
    'approved': 'VERIFIED',
    'rejected': 'REJECTED',
    'in_progress': 'IN_PROGRESS',
  };
  return mapping[displayStatus] || displayStatus.toUpperCase();
}

// Mapping pour les types de documents KYC
type KycDocumentType = "id_card" | "passport" | "selfie" | "proof_of_address";

export function mapKycDocumentTypeFromDb(prismaType: string): KycDocumentType {
  const mapping: Record<string, KycDocumentType> = {
    'ID_CARD': 'id_card',
    'PASSPORT': 'passport',
    'SELFIE': 'selfie',
    'PROOF_OF_ADDRESS': 'proof_of_address',
  };
  return mapping[prismaType] || ('id_card' as KycDocumentType);
}

// Mapping pour les types de méthodes de paiement
type PaymentMethodType = "sepa" | "crypto";

export function mapPaymentMethodTypeFromDb(prismaType: string): PaymentMethodType {
  const mapping: Record<string, PaymentMethodType> = {
    'SEPA': 'sepa',
    'CARD': 'sepa',
    'CRYPTO': 'crypto',
    'FLEXIFY_SEPA': 'sepa',
    'FLEXIFY_CARD': 'sepa',
  };
  return mapping[prismaType] || ('sepa' as PaymentMethodType);
}
