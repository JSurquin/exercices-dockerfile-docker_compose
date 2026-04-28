/**
 * Dépôt de production hébergé (Vercel) ou exécution Node en `NODE_ENV=production`.
 * Utilisé pour verrouiller les webhooks, désactiver les raccourcis d'auth, etc.
 */
export function isProductionApp(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
  );
}
