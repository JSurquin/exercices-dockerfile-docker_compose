import {
  FlexifyAmbiguousPayoutError,
  FlexifyApiError,
  FLEXIFY_FAILURE_CONFIRM_MS,
  buildFlexifyWebhookIdempotencyKey,
  isAmbiguousFlexifyError,
  shouldFinalizeFlexifyFailure,
} from '../flexify';

describe('Flexify payout safety — faux échecs Revolut / timeout', () => {
  describe('isAmbiguousFlexifyError', () => {
    it('traite un timeout 504 comme non définitif', () => {
      expect(isAmbiguousFlexifyError(new FlexifyAmbiguousPayoutError('Gateway Timeout (504)'))).toBe(true);
    });

    it('traite une erreur réseau / timeout comme non définitive', () => {
      expect(isAmbiguousFlexifyError(new Error('Flexify Gateway Timeout (504)'))).toBe(true);
      expect(isAmbiguousFlexifyError(new Error('fetch failed'))).toBe(true);
      const timedOut = new Error('connect ETIMEDOUT') as Error & { code: string };
      timedOut.code = 'ETIMEDOUT';
      expect(isAmbiguousFlexifyError(timedOut)).toBe(true);
    });

    it('traite un 5xx Flexify comme non définitif', () => {
      expect(isAmbiguousFlexifyError(new FlexifyApiError('server', { status: 502, data: {} }))).toBe(true);
      expect(isAmbiguousFlexifyError(new Error('Flexify API error: 503'))).toBe(true);
    });

    it('traite un refus de validation 4xx comme définitif (remboursement OK)', () => {
      expect(isAmbiguousFlexifyError(new FlexifyApiError('invalid card', { status: 400, data: {} }))).toBe(false);
      expect(isAmbiguousFlexifyError(new Error('Numéro de carte invalide'))).toBe(false);
    });
  });

  describe('shouldFinalizeFlexifyFailure', () => {
    it('ne finalise pas un échec trop récent (fenêtre 24h)', () => {
      const createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(shouldFinalizeFlexifyFailure(createdAt)).toBe(false);
    });

    it('finalise un échec confirmé après 24h', () => {
      const createdAt = new Date(Date.now() - FLEXIFY_FAILURE_CONFIRM_MS - 1000);
      expect(shouldFinalizeFlexifyFailure(createdAt)).toBe(true);
    });
  });

  describe('buildFlexifyWebhookIdempotencyKey', () => {
    it('sépare les mises à jour de statut (failed puis success doivent tous deux passer)', () => {
      const failed = buildFlexifyWebhookIdempotencyKey('PT123', 'MOON-1', 'failed');
      const success = buildFlexifyWebhookIdempotencyKey('PT123', 'MOON-1', 'success');
      expect(failed).toBe('PT123:failed');
      expect(success).toBe('PT123:success');
      expect(failed).not.toBe(success);
    });
  });
});
