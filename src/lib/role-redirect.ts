/**
 * Utilitaire pour gérer les redirections basées sur les rôles utilisateur
 */

export type UserRole = 'USER' | 'ADMIN' | 'AFFILIATE';

/**
 * Détermine la page d'accueil appropriée selon le rôle de l'utilisateur
 */
export function getHomePageForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'AFFILIATE':
      return '/affiliate';
    case 'USER':
    default:
      return '/dashboard';
  }
}

/**
 * Vérifie si un utilisateur avec un rôle donné peut accéder à une page
 */
export function canAccessPage(userRole: UserRole, path: string): boolean {
  // Pages admin - seulement pour les admins
  if (path.startsWith('/admin')) {
    return userRole === 'ADMIN';
  }
  
  // Pages affiliate - pour les affiliés et admins
  if (path.startsWith('/affiliate')) {
    return userRole === 'AFFILIATE' || userRole === 'ADMIN';
  }
  
  // Autres pages - accessibles à tous les utilisateurs connectés
  return true;
}

/**
 * Redirige un utilisateur vers sa page d'accueil appropriée
 */
export function redirectToHomePage(role: UserRole, baseUrl: string): string {
  const homePage = getHomePageForRole(role);
  return `${baseUrl}${homePage}`;
}
