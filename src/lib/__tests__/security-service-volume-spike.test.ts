import { shouldBlockVolumeSpike } from '@/lib/security-service';

const DEFAULT_USER_LIMIT_CENTS = 100_000; // 1 000 €

describe('shouldBlockVolumeSpike', () => {
  it('ne bloque pas un montant sous la limite mensuelle du profil', () => {
    expect(shouldBlockVolumeSpike(30_000, DEFAULT_USER_LIMIT_CENTS)).toBe(false);
  });

  it('ne bloque pas un montant égal à la limite mensuelle du profil', () => {
    expect(shouldBlockVolumeSpike(DEFAULT_USER_LIMIT_CENTS, DEFAULT_USER_LIMIT_CENTS)).toBe(false);
  });

  it('bloque un montant au-dessus de la limite mensuelle du profil', () => {
    expect(shouldBlockVolumeSpike(150_000, DEFAULT_USER_LIMIT_CENTS)).toBe(true);
  });

  it('ne bloque pas un montant élevé si sous la limite personnalisée', () => {
    expect(shouldBlockVolumeSpike(400_000, 500_000)).toBe(false);
  });

  it('bloque un montant au-dessus de la limite personnalisée', () => {
    expect(shouldBlockVolumeSpike(600_000, 500_000)).toBe(true);
  });

  it('ne bloque pas si limite invalide ou nulle', () => {
    expect(shouldBlockVolumeSpike(150_000, 0)).toBe(false);
    expect(shouldBlockVolumeSpike(150_000, -1)).toBe(false);
  });
});
