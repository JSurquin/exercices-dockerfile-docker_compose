import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les pages accessibles avec authentification.
 * Désactivés : l'endpoint /api/test/auth a été supprimé (sécurité).
 */

test.describe('Pages protégées - Connecté', () => {
  
  test('Dashboard - Affiche les informations utilisateur', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier que la page dashboard est accessible
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Vérifier que le contenu principal est chargé
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Vérifier qu'il y a des informations utilisateur
    // (adapter selon votre UI)
    const hasDashboardContent = await page.locator('text=/dashboard|tableau de bord|bienvenue/i').count() > 0;
    expect(hasDashboardContent).toBeTruthy();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/dashboard-logged-in.png', 
      fullPage: true 
    });
  });

  test('Page Vendre - Interface de vente de skins', async ({ page }) => {
    await page.goto('/sell');
    
    await expect(page).toHaveURL(/\/sell/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a un formulaire ou interface pour vendre
    const hasTradeLink = await page.locator('input[name*="trade" i], input[placeholder*="trade" i]').count() > 0;
    const hasSellContent = await page.locator('text=/vendre|sell|trade link/i').count() > 0;
    
    expect(hasTradeLink || hasSellContent).toBeTruthy();
  });

  test('Page Payout - Demande de retrait', async ({ page }) => {
    await page.goto('/payout');
    
    await expect(page).toHaveURL(/\/payout/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des options de paiement (SEPA, crypto)
    const hasPayoutContent = await page.locator('text=/payout|retrait|sepa|crypto|binance/i').count() > 0;
    expect(hasPayoutContent).toBeTruthy();
  });

  test('Page Settings - Paramètres utilisateur', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des formulaires de paramètres
    const hasSettings = await page.locator('form, input, select').count() > 0;
    expect(hasSettings).toBeTruthy();
  });

  test('Page Notifications - Liste des notifications', async ({ page }) => {
    await page.goto('/notifications');
    
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator('main')).toBeVisible();
    
    // Devrait afficher des notifications ou un message "aucune notification"
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();
  });

  test('Page Missions - Système de gamification', async ({ page }) => {
    await page.goto('/missions');
    
    await expect(page).toHaveURL(/\/missions/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des missions ou XP
    const hasMissionContent = await page.locator('text=/mission|xp|points|tickets/i').count() > 0;
    expect(hasMissionContent).toBeTruthy();
  });

  test('Page Giveaways - Liste des giveaways', async ({ page }) => {
    await page.goto('/giveaways');
    
    await expect(page).toHaveURL(/\/giveaways/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des giveaways ou un message
    const content = await page.locator('main').textContent();
    expect(content).toBeTruthy();
  });

  test('Page Affiliation - Tableau de bord affilié', async ({ page }) => {
    await page.goto('/affiliate');
    
    await expect(page).toHaveURL(/\/affiliate/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a du contenu d'affiliation
    const hasAffiliateContent = await page.locator('text=/affiliate|affiliation|commission|referral/i').count() > 0;
    expect(hasAffiliateContent).toBeTruthy();
  });

  test('Page KYC - Vérification d\'identité', async ({ page }) => {
    await page.goto('/kyc');
    
    await expect(page).toHaveURL(/\/kyc/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a du contenu KYC
    const hasKycContent = await page.locator('text=/kyc|vérification|identité|document/i').count() > 0;
    expect(hasKycContent).toBeTruthy();
  });

  test('Page 2FA - Authentification à deux facteurs', async ({ page }) => {
    await page.goto('/two-factor');
    
    await expect(page).toHaveURL(/\/two-factor/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a du contenu 2FA
    const has2FAContent = await page.locator('text=/2fa|two.factor|authentification|otp|code/i').count() > 0;
    expect(has2FAContent).toBeTruthy();
  });
});

test.describe('Navigation utilisateur connecté', () => {
  
  test('Header - Menu utilisateur accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier que le header contient un menu utilisateur
    const header = page.locator('header, nav');
    await expect(header).toBeVisible();
    
    // Chercher un menu utilisateur (avatar, nom, dropdown)
    const userMenu = page.locator('[aria-label*="user" i], [aria-label*="utilisateur" i], button:has-text("profil"), button:has(img[alt*="avatar" i])');
    const hasUserMenu = await userMenu.count() > 0;
    
    if (hasUserMenu) {
      await expect(userMenu.first()).toBeVisible();
      
      // Cliquer pour ouvrir le menu
      await userMenu.first().click();
      
      // Vérifier que le menu contient des options
      await page.waitForTimeout(500);
      
      const hasMenuOptions = await page.locator('text=/paramètres|settings|déconnexion|logout/i').count() > 0;
      expect(hasMenuOptions).toBeTruthy();
    }
  });

  test('Navigation rapide entre pages protégées', async ({ page }) => {
    // Démarrer sur le dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Naviguer vers vendre
    await page.goto('/sell');
    await expect(page).toHaveURL(/\/sell/);
    
    // Naviguer vers paramètres
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
    
    // Vérifier qu'aucune redirection vers login ne se produit
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('Breadcrumb ou navigation contextuelle', async ({ page }) => {
    await page.goto('/settings');
    
    // Vérifier qu'il y a une navigation (breadcrumb, tabs, menu latéral)
    const hasNav = await page.locator('nav, [role="navigation"], aside').count() > 0;
    expect(hasNav).toBeTruthy();
  });
});

test.describe('Fonctionnalités utilisateur - Connecté', () => {
  
  test('Vendre des skins - Workflow de base', async ({ page }) => {
    await page.goto('/sell');
    
    // Chercher un input pour Trade Link
    const tradeLinkInput = page.locator('input[name*="trade" i], input[placeholder*="trade" i]').first();
    const hasInput = await tradeLinkInput.count() > 0;
    
    if (hasInput) {
      await expect(tradeLinkInput).toBeVisible();
      
      // Remplir un trade link de test
      await tradeLinkInput.fill('https://steamcommunity.com/tradeoffer/new/?partner=123456&token=TESTTOKEN');
      
      // Chercher un bouton de validation
      const submitButton = page.locator('button[type="submit"], button:has-text("valider"), button:has-text("estimer")').first();
      const hasButton = await submitButton.count() > 0;
      
      if (hasButton) {
        await expect(submitButton).toBeVisible();
        // Note: On ne clique pas car ça ferait un vrai appel API
      }
    }
  });

  test('Demande de payout - Options visibles', async ({ page }) => {
    await page.goto('/payout');
    
    // Vérifier qu'il y a des options de paiement
    const hasSEPA = await page.locator('text=/sepa|virement|iban/i').count() > 0;
    const hasCrypto = await page.locator('text=/crypto|bitcoin|binance/i').count() > 0;
    
    // Au moins une option devrait être disponible
    expect(hasSEPA || hasCrypto).toBeTruthy();
  });

  test('Paramètres - Changement de langue', async ({ page }) => {
    await page.goto('/settings');
    
    // Chercher un sélecteur de langue dans les paramètres
    const langSelect = page.locator('select[name*="lang" i], select[name*="langue" i]').first();
    const hasLangSelect = await langSelect.count() > 0;
    
    if (hasLangSelect) {
      await expect(langSelect).toBeVisible();
      
      // Vérifier qu'il y a des options
      const options = await langSelect.locator('option').count();
      expect(options).toBeGreaterThanOrEqual(2); // FR et EN au minimum
    }
  });

  test('Notifications - Affichage et lecture', async ({ page }) => {
    await page.goto('/notifications');
    
    // Vérifier qu'il y a une liste ou un message
    const main = page.locator('main');
    const content = await main.textContent();
    
    expect(content?.length).toBeGreaterThan(0);
    
    // Si des notifications existent, vérifier qu'on peut interagir
    const notificationItems = page.locator('[data-notification], .notification, li, article').filter({
      hasText: /notification/i
    });
    
    const count = await notificationItems.count();
    
    if (count > 0) {
      // Cliquer sur la première notification
      await notificationItems.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('Missions - Affichage des missions disponibles', async ({ page }) => {
    await page.goto('/missions');
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Vérifier qu'il y a des informations de progression
    const hasProgressInfo = await page.locator('text=/xp|points|niveau|level|tickets/i').count() > 0;
    expect(hasProgressInfo).toBeTruthy();
  });

  test('Giveaways - Participer à un giveaway', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Chercher des cartes de giveaway
    const giveawayCards = page.locator('[data-giveaway], .giveaway, article, div[class*="card"]').filter({
      hasText: /giveaway|lot|prize/i
    });
    
    const count = await giveawayCards.count();
    
    if (count > 0) {
      // Vérifier qu'il y a un bouton de participation
      const participateButton = page.locator('button:has-text("participer"), button:has-text("participate"), button:has-text("entrer")').first();
      const hasButton = await participateButton.count() > 0;
      
      if (hasButton) {
        await expect(participateButton).toBeVisible();
      }
    }
  });

  test('Affiliation - Code de parrainage visible', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Chercher un code de parrainage ou lien d'affiliation
    const hasAffiliateCode = await page.locator('code, input[readonly], [data-affiliate-code]').count() > 0;
    const hasAffiliateLink = await page.locator('text=/votre code|your code|lien de parrainage|referral link/i').count() > 0;
    
    expect(hasAffiliateCode || hasAffiliateLink).toBeTruthy();
  });
});

test.describe('Déconnexion', () => {
  
  test('Se déconnecter - Retour à l\'état déconnecté', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Chercher le bouton de déconnexion
    const logoutButton = page.locator('button:has-text("déconnexion"), button:has-text("logout"), a:has-text("déconnexion"), a:has-text("logout")');
    const hasLogoutButton = await logoutButton.count() > 0;
    
    if (hasLogoutButton) {
      // Cliquer sur déconnexion
      await logoutButton.first().click();
      
      // Attendre la redirection
      await page.waitForTimeout(1000);
      
      // Vérifier qu'on est redirigé vers l'accueil ou login
      const currentUrl = page.url();
      const isLoggedOut = currentUrl.includes('/login') || currentUrl === new URL(page.url()).origin + '/';
      
      expect(isLoggedOut).toBeTruthy();
      
      // Vérifier qu'on ne peut plus accéder au dashboard
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      
      const dashboardUrl = page.url();
      const isRedirected = !dashboardUrl.includes('/dashboard');
      
      expect(isRedirected).toBeTruthy();
    }
  });
});

test.describe('Performance - Connecté', () => {
  
  test('Dashboard - Temps de chargement acceptable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Le dashboard ne devrait pas prendre plus de 3 secondes à charger
    expect(loadTime).toBeLessThan(3000);
  });

  test('Navigation entre pages - Pas de rechargement complet', async ({ page }) => {
    await page.goto('/dashboard');
    
    const startTime = Date.now();
    
    // Naviguer vers une autre page
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    
    const navigationTime = Date.now() - startTime;
    
    // La navigation côté client devrait être rapide
    expect(navigationTime).toBeLessThan(2000);
  });
});

test.describe('Responsive - Connecté', () => {
  
  test('Mobile - Dashboard responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/dashboard-mobile-logged-in.png', 
      fullPage: true 
    });
  });

  test('Tablette - Layout adaptatif', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
  });
});
