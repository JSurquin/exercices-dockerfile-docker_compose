import { shouldBlockVolumeSpike, VOLUME_SPIKE_LIMITS } from '@/lib/security-service';

const DEFAULT_USER_LIMIT_CENTS = 100_000; // 1 000 €

describe('shouldBlockVolumeSpike', () => {
  it('ne bloque pas 300€ même si > 3× la moyenne historique', () => {
    expect(
      shouldBlockVolumeSpike(
        30_000,
        { avgAmount: 5_000, paidPayoutCount: 5 },
        DEFAULT_USER_LIMIT_CENTS,
      ),
    ).toBe(false);
  });

  it('ne bloque pas sans historique suffisant', () => {
    expect(
      shouldBlockVolumeSpike(
        150_000,
        { avgAmount: 100_000, paidPayoutCount: 2 },
        DEFAULT_USER_LIMIT_CENTS,
      ),
    ).toBe(false);
  });

  it('bloque un montant au-dessus de la limite user dépassant 3× la moyenne', () => {
    expect(
      shouldBlockVolumeSpike(
        150_000,
        { avgAmount: 40_000, paidPayoutCount: 5 },
        DEFAULT_USER_LIMIT_CENTS,
      ),
    ).toBe(true);
  });

  it('ne bloque pas un montant élevé si ratio < 3×', () => {
    expect(
      shouldBlockVolumeSpike(
        120_000,
        { avgAmount: 50_000, paidPayoutCount: 5 },
        DEFAULT_USER_LIMIT_CENTS,
      ),
    ).toBe(false);
  });

  it('utilise la limite personnalisée du profil comme seuil absolu', () => {
    expect(
      shouldBlockVolumeSpike(
        600_000,
        { avgAmount: 150_000, paidPayoutCount: 5 },
        500_000,
      ),
    ).toBe(true);
    expect(
      shouldBlockVolumeSpike(
        400_000,
        { avgAmount: 100_000, paidPayoutCount: 5 },
        500_000,
      ),
    ).toBe(false);
  });

  it('conserve les seuils ratio et historique configurés', () => {
    expect(VOLUME_SPIKE_LIMITS.ratioThreshold).toBe(3);
    expect(VOLUME_SPIKE_LIMITS.minPaidPayouts).toBe(3);
  });
});
