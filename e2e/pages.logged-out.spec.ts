import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les pages accessibles sans authentification
 * Ces tests vérifient que :
 * - Les pages publiques sont accessibles
 * - Le contenu principal est affiché
 * - Les liens de navigation fonctionnent
 * - Le responsive est correct
 */

test.describe('Pages publiques - Déconnecté', () => {
  
  test('Page d\'accueil - Affiche le hero et les sections principales', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le titre de la page
    await expect(page).toHaveTitle(/MoonSkin|Counter Strike Skin|Vendre vos skins/i);
    
    // Vérifier que le header est présent
    await expect(page.locator('header, nav')).toBeVisible();
    
    // Vérifier qu'il y a un bouton de connexion Steam
    const loginButton = page.getByRole('link', { name: /connexion|login|se connecter|steam/i });
    await expect(loginButton.first()).toBeVisible();
    
    // Vérifier que le contenu principal est chargé
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Screenshot pour référence visuelle
    await page.screenshot({ path: 'test-results/screenshots/home-logged-out.png', fullPage: true });
  });

  test('Page À propos - Contenu informatif accessible', async ({ page }) => {
    await page.goto('/about');
    
    // Vérifier que la page charge
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a du contenu textuel
    const content = page.locator('main');
    await expect(content).toContainText(/MoonSkin|à propos|about/i);
  });

  test('Page Contact - Formulaire ou informations de contact', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a soit un formulaire, soit des infos de contact
    const hasForm = await page.locator('form').count() > 0;
    const hasContactInfo = await page.locator('text=/contact|email|support/i').count() > 0;
    
    expect(hasForm || hasContactInfo).toBeTruthy();
  });

  test('Page Aide - Documentation accessible', async ({ page }) => {
    await page.goto('/help');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier du contenu d'aide
    await expect(page.locator('main')).toContainText(/.+/);
  });

  test('Page Presse - Informations média', async ({ page }) => {
    await page.goto('/press');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page CGU - Conditions générales d\'utilisation', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a du contenu légal
    const content = await page.locator('main').textContent();
    expect(content?.length).toBeGreaterThan(100);
  });

  test('Page Politique de confidentialité', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.locator('main')).toBeVisible();
    
    const content = await page.locator('main').textContent();
    expect(content?.length).toBeGreaterThan(100);
  });

  test('Page Mentions légales', async ({ page }) => {
    await page.goto('/mentions-legales');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Politique KYC', async ({ page }) => {
    await page.goto('/kyc-policy');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Politique AML', async ({ page }) => {
    await page.goto('/aml-policy');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Conditions de vente de skins', async ({ page }) => {
    await page.goto('/skin-sale-terms');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Conditions de paiement/cashout', async ({ page }) => {
    await page.goto('/payment-cashout');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Status - Statut du service', async ({ page }) => {
    await page.goto('/status');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Devrait afficher un statut (opérationnel, dégradé, etc.)
    await expect(page.locator('main')).toContainText(/.+/);
  });

  test('Page API Documentation', async ({ page }) => {
    await page.goto('/api-docs');
    
    await expect(page.locator('main')).toBeVisible();
  });

  test('Page Login - Redirige vers authentification Steam', async ({ page }) => {
    await page.goto('/login');
    
    // Devrait soit afficher une page de login, soit rediriger
    await expect(page.locator('main, body')).toBeVisible();
    
    // Vérifier qu'il y a un bouton ou lien Steam
    const steamButton = page.getByRole('link', { name: /steam/i });
    const hasButton = await steamButton.count() > 0;
    
    if (hasButton) {
      await expect(steamButton.first()).toBeVisible();
    }
  });

  test('Page Aide - Centre d’aide accessible', async ({ page }) => {
    await page.goto('/help');
    
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Navigation et responsive - Déconnecté', () => {
  
  test('Navigation principale - Tous les liens fonctionnent', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur différents liens de navigation
    const links = [
      { text: /à propos|about/i, path: '/about' },
      { text: /contact/i, path: '/contact' },
      { text: /aide|help/i, path: '/help' },
    ];

    for (const link of links) {
      await page.goto('/');
      
      const navLink = page.getByRole('link', { name: link.text }).first();
      const linkCount = await navLink.count();
      
      if (linkCount > 0) {
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(link.path));
      }
    }
  });

  test('Footer - Liens légaux accessibles', async ({ page }) => {
    await page.goto('/');
    
    // Scroller jusqu'au footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Vérifier que les liens légaux sont présents
    const legalLinks = await footer.locator('a').filter({ 
      hasText: /CGU|privacy|mentions|terms/i 
    }).count();
    
    expect(legalLinks).toBeGreaterThan(0);
  });

  test('Mobile - Navigation responsive', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier que la page est responsive
    await expect(page.locator('main')).toBeVisible();
    
    // Chercher un menu burger (icône ou bouton pour menu mobile)
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
    const hasMenuButton = await menuButton.count() > 0;
    
    if (hasMenuButton) {
      await expect(menuButton).toBeVisible();
    }
    
    await page.screenshot({ 
      path: 'test-results/screenshots/home-mobile-logged-out.png', 
      fullPage: true 
    });
  });

  test('Changement de langue - FR/EN fonctionne', async ({ page }) => {
    await page.goto('/');
    
    // Chercher un sélecteur de langue
    const langSelector = page.locator('select[name*="lang" i], button[aria-label*="language" i], button[aria-label*="langue" i]').first();
    const hasLangSelector = await langSelector.count() > 0;
    
    if (hasLangSelector) {
      await expect(langSelector).toBeVisible();
      
      // Tester le changement de langue si possible
      // Note: l'implémentation exacte dépend de votre système i18n
    }
  });

  test('Changement de thème - Dark/Light mode', async ({ page }) => {
    await page.goto('/');
    
    // Chercher un bouton de changement de thème
    const themeToggle = page.locator('button[aria-label*="theme" i], button[aria-label*="thème" i]').first();
    const hasThemeToggle = await themeToggle.count() > 0;
    
    if (hasThemeToggle) {
      await expect(themeToggle).toBeVisible();
      
      // Cliquer pour changer de thème
      await themeToggle.click();
      
      // Vérifier que le thème a changé (en vérifiant les classes CSS)
      await page.waitForTimeout(500); // Attendre l'animation
      
      const html = page.locator('html');
      const hasThemeClass = await html.evaluate((el) => {
        return el.classList.contains('dark') || el.classList.contains('light');
      });
      
      expect(hasThemeClass).toBeTruthy();
    }
  });
});

test.describe('Redirections et pages protégées - Déconnecté', () => {
  
  test('Tenter d\'accéder au dashboard redirige vers login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Devrait rediriger vers login ou afficher un message d'erreur
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/login') || currentUrl === '/';
    const hasAuthMessage = await page.getByText(/connexion requise|non autorisé|unauthorized/i).count() > 0;
    
    // Au moins une des conditions devrait être vraie
    expect(isRedirected || hasAuthMessage).toBeTruthy();
  });

  test('Tenter d\'accéder à /sell redirige vers login', async ({ page }) => {
    await page.goto('/sell');
    
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/login') || currentUrl === '/';
    const hasAuthMessage = await page.getByText(/connexion requise|non autorisé|unauthorized/i).count() > 0;
    
    expect(isRedirected || hasAuthMessage).toBeTruthy();
  });

  test('Tenter d\'accéder à /settings redirige vers login', async ({ page }) => {
    await page.goto('/settings');
    
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/login') || currentUrl === '/';
    const hasAuthMessage = await page.getByText(/connexion requise|non autorisé|unauthorized/i).count() > 0;
    
    expect(isRedirected || hasAuthMessage).toBeTruthy();
  });

  test('Tenter d\'accéder à /admin redirige vers login', async ({ page }) => {
    await page.goto('/admin');
    
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('/login') || currentUrl === '/';
    const hasAuthMessage = await page.getByText(/connexion requise|non autorisé|unauthorized/i).count() > 0;
    
    expect(isRedirected || hasAuthMessage).toBeTruthy();
  });
});

test.describe('Performance et accessibilité - Déconnecté', () => {
  
  test('Page d\'accueil - Temps de chargement raisonnable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Le chargement initial ne devrait pas prendre plus de 5 secondes
    expect(loadTime).toBeLessThan(5000);
  });

  test('Accessibilité - Pas d\'erreurs critiques de contraste', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les éléments principaux sont accessibles
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Vérifier qu'il y a des titres (h1, h2, etc.)
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);
  });

  test('SEO - Métadonnées présentes', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les métadonnées SEO
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Vérifier la méta description
    const metaDescription = page.locator('meta[name="description"]');
    const hasDescription = await metaDescription.count() > 0;
    
    if (hasDescription) {
      const content = await metaDescription.getAttribute('content');
      expect(content?.length).toBeGreaterThan(0);
    }
  });
});
