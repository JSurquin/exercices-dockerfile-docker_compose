/**
 * Affichage client d’une adresse connue (désabonnement / confirmation) sans exposer l’email en clair.
 */
export function maskEmailForClientResponse(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at < 1) {
    return '***';
  }
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const first = local.charAt(0);
  return `${first}***@${domain}`;
}
