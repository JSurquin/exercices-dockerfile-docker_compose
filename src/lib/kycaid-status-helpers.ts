export type KycaidVerificationStatus =
  | 'unused'
  | 'pending'
  | 'completed'
  | 'verified'
  | 'declined';

export interface KycaidVerificationShape {
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
    profile?: {
      status?: string;
      verified: boolean;
      decline_reasons?: string[];
    };
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

export interface KycaidApplicantShape {
  applicant_id: string;
  type: 'PERSON' | 'COMPANY';
  decline_reasons?: string[];
}

export function isKycaidVerified(
  verification: Pick<KycaidVerificationShape, 'verified' | 'status'>
): boolean {
  return verification.verified === true || verification.status === 'verified';
}

export function isKycaidTerminalRejected(
  verification: Pick<KycaidVerificationShape, 'verified' | 'status'>
): boolean {
  return (
    verification.status === 'declined' ||
    (verification.status === 'completed' && verification.verified === false)
  );
}

export function isKycaidTerminal(
  verification: Pick<KycaidVerificationShape, 'verified' | 'status'>
): boolean {
  return isKycaidVerified(verification) || isKycaidTerminalRejected(verification);
}

export function collectDeclineReasons(verification: KycaidVerificationShape): string[] {
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
  if (verification.verifications?.profile?.decline_reasons) {
    reasons.push(...verification.verifications.profile.decline_reasons);
  }

  return [...new Set(reasons)];
}

export function resolveAllDeclineReasons(
  verification?: KycaidVerificationShape | null,
  applicant?: KycaidApplicantShape | null,
  dbReasons: string[] = []
): string[] {
  const reasons: string[] = [...dbReasons];
  if (verification) {
    reasons.push(...collectDeclineReasons(verification));
  }
  if (applicant?.decline_reasons?.length) {
    reasons.push(...applicant.decline_reasons);
  }
  return [...new Set(reasons.filter(Boolean))];
}
