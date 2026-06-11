import {
  isKycaidVerified,
  isKycaidTerminalRejected,
  isKycaidTerminal,
  collectDeclineReasons,
  resolveAllDeclineReasons,
  type KycaidVerificationShape,
} from '@/lib/kycaid-status-helpers';

function makeVerification(
  overrides: Partial<KycaidVerificationShape> &
    Pick<KycaidVerificationShape, 'verification_id' | 'status' | 'verified'>
): KycaidVerificationShape {
  return {
    applicant_id: 'app-1',
    verification_status: overrides.status,
    form_id: 'form-1',
    form_url: 'https://forms.kycaid.com/test',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('isKycaidVerified', () => {
  it('returns true when verified is true', () => {
    expect(isKycaidVerified(makeVerification({
      verification_id: 'v1',
      status: 'completed',
      verified: true,
    }))).toBe(true);
  });

  it('returns true when status is verified', () => {
    expect(isKycaidVerified(makeVerification({
      verification_id: 'v1',
      status: 'verified',
      verified: false,
    }))).toBe(true);
  });
});

describe('isKycaidTerminalRejected', () => {
  it('returns true for declined status', () => {
    expect(isKycaidTerminalRejected(makeVerification({
      verification_id: 'v1',
      status: 'declined',
      verified: false,
    }))).toBe(true);
  });

  it('returns true for completed with verified false', () => {
    expect(isKycaidTerminalRejected(makeVerification({
      verification_id: 'v1',
      status: 'completed',
      verified: false,
    }))).toBe(true);
  });

  it('returns false for pending', () => {
    expect(isKycaidTerminalRejected(makeVerification({
      verification_id: 'v1',
      status: 'pending',
      verified: false,
    }))).toBe(false);
  });
});

describe('isKycaidTerminal', () => {
  it('detects verified terminal state', () => {
    const v = makeVerification({ verification_id: 'v1', status: 'completed', verified: true });
    expect(isKycaidTerminal(v)).toBe(true);
  });

  it('detects rejected terminal state', () => {
    const v = makeVerification({ verification_id: 'v1', status: 'completed', verified: false });
    expect(isKycaidTerminal(v)).toBe(true);
  });
});

describe('collectDeclineReasons', () => {
  it('collects reasons from sub-verifications', () => {
    const v = makeVerification({
      verification_id: 'v1',
      status: 'completed',
      verified: false,
      verifications: {
        document: { status: 'invalid', verified: false, decline_reasons: ['BAD_QUALITY'] },
        facial: { status: 'invalid', verified: false, decline_reasons: ['DIFFERENT_FACES'] },
      },
    });
    expect(collectDeclineReasons(v)).toEqual(['BAD_QUALITY', 'DIFFERENT_FACES']);
  });

  it('deduplicates reasons', () => {
    const v = makeVerification({
      verification_id: 'v1',
      status: 'completed',
      verified: false,
      verifications: {
        document: { status: 'invalid', verified: false, decline_reasons: ['OTHER', 'OTHER'] },
      },
    });
    expect(collectDeclineReasons(v)).toEqual(['OTHER']);
  });
});

describe('resolveAllDeclineReasons', () => {
  it('merges verification, applicant and db reasons', () => {
    const v = makeVerification({
      verification_id: 'v1',
      status: 'completed',
      verified: false,
      verifications: {
        document: { status: 'invalid', verified: false, decline_reasons: ['BAD_QUALITY'] },
      },
    });

    const reasons = resolveAllDeclineReasons(
      v,
      { applicant_id: 'app-1', type: 'PERSON', decline_reasons: ['EXPIRED_DOCUMENT'] },
      ['WRONG_NAME']
    );

    expect(reasons).toEqual(['WRONG_NAME', 'BAD_QUALITY', 'EXPIRED_DOCUMENT']);
  });

  it('resync scenario: previously rejected locally, now verified on KYCAID', () => {
    const v = makeVerification({
      verification_id: 'v2',
      status: 'completed',
      verified: true,
    });

    expect(isKycaidVerified(v)).toBe(true);
    expect(isKycaidTerminalRejected(v)).toBe(false);
  });
});

describe('theo97d resync scenario', () => {
  it('maps a new verified verification after prior rejection', () => {
    const oldRejected = makeVerification({
      verification_id: 'v-old',
      status: 'completed',
      verified: false,
      verifications: {
        document: { status: 'invalid', verified: false, decline_reasons: ['BAD_QUALITY'] },
      },
    });

    const newVerified = makeVerification({
      verification_id: 'v-new',
      status: 'completed',
      verified: true,
    });

    expect(isKycaidTerminalRejected(oldRejected)).toBe(true);
    expect(isKycaidVerified(newVerified)).toBe(true);
    expect(collectDeclineReasons(oldRejected)).toContain('BAD_QUALITY');
  });
});
