/**
 * Obfuscation des métriques publiques (anti-énumération : pas de nombre exact d’inscrits).
 * Ex. 247 → 200, 9 → 9, 0 → 0
 */
export function obfuscatePublicCount(n: number): number {
  if (n <= 0) return 0;
  const exp = Math.floor(Math.log10(n));
  const base = 10 ** exp;
  return Math.floor(n / base) * base;
}
