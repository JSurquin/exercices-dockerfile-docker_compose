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
type PayoutStatus = "en_attente" | "en_attente_approbation" | "vérification_requise" | "vérifié" | "planifié" | "exécuté" | "payé" | "échoué" | "annulé";

export function mapPayoutStatusFromDb(prismaStatus: string): PayoutStatus {
  const mapping: Record<string, PayoutStatus> = {
    'PENDING': 'en_attente',
    'PENDING_APPROVAL': 'en_attente_approbation',
    'VERIFICATION_REQUIRED': 'vérification_requise',
    'VERIFIED': 'vérifié',
    'SCHEDULED': 'planifié',
    'PROCESSING': 'exécuté',
    'PAID': 'payé',
    'FAILED': 'échoué',
    'CANCELLED': 'annulé',
    'FLEXIFY_PENDING': 'en_attente',
    'FLEXIFY_PROCESSING': 'exécuté',
    'FLEXIFY_PAID': 'payé',
    'FLEXIFY_FAILED': 'échoué',
    'WHITEPAY_WAITING_CONFIRMATION': 'en_attente',
    'WHITEPAY_PENDING_WITHDRAWAL': 'en_attente',
    'WHITEPAY_PROCESSING_WITHDRAWAL': 'exécuté',
    'WHITEPAY_COMPLETE': 'payé',
    'WHITEPAY_DECLINED': 'échoué',
  };
  return mapping[prismaStatus] || ('en_attente' as PayoutStatus);
}

export function mapPayoutStatusToDb(displayStatus: string): string {
  const mapping: Record<string, string> = {
    'en_attente': 'PENDING',
    'en_attente_approbation': 'PENDING_APPROVAL',
    'vérification_requise': 'VERIFICATION_REQUIRED',
    'vérifié': 'VERIFIED',
    'planifié': 'SCHEDULED',
    'en_cours': 'PROCESSING',
    'payé': 'PAID',
    'échoué': 'FAILED',
    'annulé': 'CANCELLED',
  };
  return mapping[displayStatus] || displayStatus.toUpperCase();
}

// Mapping pour les statuts KYC
type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "IN_PROGRESS" | "KYCAID_PENDING" | "KYCAID_VERIFIED" | "KYCAID_REJECTED";

export function mapKycStatusFromDb(prismaStatus: string): KycStatus {
  const mapping: Record<string, KycStatus> = {
    'PENDING': 'PENDING',
    'VERIFIED': 'VERIFIED',
    'REJECTED': 'REJECTED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'KYCAID_PENDING': 'KYCAID_PENDING',
    'KYCAID_VERIFIED': 'KYCAID_VERIFIED',
    'KYCAID_REJECTED': 'KYCAID_REJECTED',
  };
  return mapping[prismaStatus] || ('PENDING' as KycStatus);
}

export function mapKycStatusToDb(displayStatus: string): string {
  const mapping: Record<string, string> = {
    'PENDING': 'PENDING',
    'VERIFIED': 'VERIFIED',
    'REJECTED': 'REJECTED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'KYCAID_PENDING': 'KYCAID_PENDING',
    'KYCAID_VERIFIED': 'KYCAID_VERIFIED',
    'KYCAID_REJECTED': 'KYCAID_REJECTED',
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
  if (prismaType === 'WHITEPAY_CRYPTO') return 'crypto' as PaymentMethodType;
  return mapping[prismaType] || ('sepa' as PaymentMethodType);
}
