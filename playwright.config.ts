import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Nombre de tests en parallèle */
  fullyParallel: true,
  
  /* Échouer la CI si on a oublié test.only */
  forbidOnly: !!process.env.CI,
  
  /* Retry sur CI seulement */
  retries: process.env.CI ? 2 : 0,
  
  /* Nombre de workers */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* Configuration partagée pour tous les projets */
  use: {
    /* URL de base pour les tests */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Capture screenshot seulement en cas d'échec */
    screenshot: 'only-on-failure',
    
    /* Vidéo seulement en cas d'échec */
    video: 'retain-on-failure',
    
    /* Trace seulement en cas d'échec */
    trace: 'retain-on-failure',
  },

  /* Configuration des projets de test */
  projects: [
    /* Setup pour créer l'état d'authentification */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* Tests de fumée - Rapides et basiques */
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* Tests déconnectés - Pages publiques */
    {
      name: 'logged-out',
      testMatch: /.*\.logged-out\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* Tests connectés - Pages protégées */
    {
      name: 'logged-in',
      testMatch: /.*\.logged-in\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Tests admin */
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts|chat\.moderation\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    /* Tests mobile */
    {
      name: 'mobile',
      testMatch: /.*\.mobile\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],

  /* Serveur de développement - démarre automatiquement avant les tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
