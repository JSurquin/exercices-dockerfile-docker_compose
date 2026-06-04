/**
 * Pas de loader global sur l’accueil ni les pages marketing :
 * évite le splash plein écran au premier chargement de moonskin.fun.
 * Les routes gated ont leur propre loading.tsx ou PageLoading in-page.
 */
export default function RootLoading() {
  return null;
}
