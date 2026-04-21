import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.auth/admin.json');

/**
 * Setup d'authentification pour les tests utilisateur connecté
 * 
 * Utilise l'endpoint /api/test/auth qui crée un utilisateur de test
 * et établit une session better-auth complète.
 */
setup('authenticate as user', async ({ page, context }) => {
  console.log('🔐 Setup: Création de la session utilisateur...');
  
  // Aller à l'endpoint de test qui crée la session
  await page.goto('/api/test/auth?role=user');
  
  // Attendre la redirection vers le dashboard
  await page.waitForURL('/dashboard*', { timeout: 10000 });
  
  // Vérifier qu'on est bien connecté
  await expect(page).toHaveURL(/\/dashboard/);
  
  console.log('✅ Session utilisateur créée et cookies sauvegardés');
  
  // Sauvegarder l'état d'authentification (cookies, localStorage, etc.)
  await context.storageState({ path: authFile });
});

/**
 * Setup d'authentification pour les tests admin
 */
setup('authenticate as admin', async ({ page, context }) => {
  console.log('🔐 Setup: Création de la session admin...');
  
  // Aller à l'endpoint de test avec role=admin
  await page.goto('/api/test/auth?role=admin');
  
  // Attendre la redirection vers le dashboard
  await page.waitForURL('/dashboard*', { timeout: 10000 });
  
  // Vérifier qu'on est bien connecté
  await expect(page).toHaveURL(/\/dashboard/);
  
  console.log('✅ Session admin créée et cookies sauvegardés');
  
  // Sauvegarder l'état d'authentification
  await context.storageState({ path: adminAuthFile });
});

/**
 * NOTES :
 * 
 * - Ces setups créent des fichiers .auth/user.json et .auth/admin.json
 * - Ces fichiers contiennent les cookies et le localStorage
 * - Ils sont utilisés par les tests logged-in et admin
 * - L'endpoint /api/test/auth est protégé et n'est actif qu'en mode test
 * 
 * Pour activer l'endpoint, assurez-vous que dans .env.test :
 * ENABLE_TEST_AUTH=true
 * NODE_ENV=test
 */
