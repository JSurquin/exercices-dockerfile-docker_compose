import { shouldBlockVolumeSpike, VOLUME_SPIKE_LIMITS } from '@/lib/security-service';

describe('shouldBlockVolumeSpike', () => {
  it('ne bloque pas 300€ même si > 3× la moyenne historique', () => {
    expect(
      shouldBlockVolumeSpike(30_000, { avgAmount: 5_000, paidPayoutCount: 5 }),
    ).toBe(false);
  });

  it('ne bloque pas sans historique suffisant', () => {
    expect(
      shouldBlockVolumeSpike(1_500_000, { avgAmount: 100_000, paidPayoutCount: 2 }),
    ).toBe(false);
  });

  it('bloque un montant élevé (> 12 000€) dépassant 3× la moyenne', () => {
    expect(
      shouldBlockVolumeSpike(1_500_000, { avgAmount: 400_000, paidPayoutCount: 5 }),
    ).toBe(true);
  });

  it('ne bloque pas un montant élevé si ratio < 3×', () => {
    expect(
      shouldBlockVolumeSpike(1_200_000, { avgAmount: 500_000, paidPayoutCount: 5 }),
    ).toBe(false);
  });

  it('respecte le seuil absolu configuré', () => {
    expect(VOLUME_SPIKE_LIMITS.absoluteMinCents).toBe(1_200_000);
  });
});
