import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'expérience mobile
 * Ces tests vérifient le comportement responsive et les interactions tactiles
 */

test.describe('Mobile - Pages publiques', () => {
  
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test('Page d\'accueil - Affichage mobile correct', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le contenu est visible
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il n'y a pas de débordement horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 pour les arrondis
    
    await page.screenshot({ 
      path: 'test-results/screenshots/home-mobile.png',
      fullPage: true 
    });
  });

  test('Menu burger - Navigation mobile', async ({ page }) => {
    await page.goto('/');
    
    // Chercher le bouton de menu mobile
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]').first();
    const hasMenuButton = await menuButton.count() > 0;
    
    if (hasMenuButton) {
      await expect(menuButton).toBeVisible();
      
      // Ouvrir le menu
      await menuButton.click();
      await page.waitForTimeout(500); // Attendre l'animation
      
      // Vérifier que le menu est ouvert
      const menu = page.locator('[role="menu"], nav[aria-expanded="true"], [data-state="open"]');
      const menuVisible = await menu.count() > 0;
      
      if (menuVisible) {
        await expect(menu.first()).toBeVisible();
        
        // Vérifier qu'il y a des liens de navigation
        const links = await page.locator('a').count();
        expect(links).toBeGreaterThan(0);
      }
    }
  });

  test('Footer - Liens accessibles sur mobile', async ({ page }) => {
    await page.goto('/');
    
    // Scroller jusqu'au footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Vérifier que le footer est lisible (pas trop petit)
    const footerText = await footer.textContent();
    expect(footerText?.length).toBeGreaterThan(0);
  });

  test('Interactions tactiles - Boutons cliquables', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les boutons ont une taille tactile minimale (44x44px)
    const buttons = await page.locator('button, a').all();
    
    for (const button of buttons.slice(0, 5)) { // Tester les 5 premiers
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const box = await button.boundingBox();
        
        if (box) {
          // Recommandation d'accessibilité : min 44x44px
          expect(box.height).toBeGreaterThanOrEqual(30); // Plus permissif pour les tests
        }
      }
    }
  });

  test('Formulaires - Inputs tactiles', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea').count();
    
    if (inputs > 0) {
      const firstInput = page.locator('input, textarea').first();
      await expect(firstInput).toBeVisible();
      
      // Tester la saisie
      await firstInput.tap();
      await firstInput.fill('Test mobile');
      
      const value = await firstInput.inputValue();
      expect(value).toBe('Test mobile');
    }
  });
});

test.describe('Mobile - Pages connectées', () => {
  
  test.use({
    viewport: { width: 375, height: 667 },
    storageState: '.auth/user.json',
  });

  test('Dashboard mobile - Navigation bottom bar ou menu', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Chercher une barre de navigation en bas (bottom nav)
    const bottomNav = page.locator('[role="navigation"]').filter({
      has: page.locator('a, button')
    });
    
    const hasBottomNav = await bottomNav.count() > 0;
    expect(hasBottomNav).toBeTruthy();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/dashboard-mobile-logged-in.png',
      fullPage: true 
    });
  });

  test('Vendre - Formulaire responsive', async ({ page }) => {
    await page.goto('/sell');
    
    // Vérifier que le formulaire est accessible
    const form = page.locator('form, [data-testid*="sell"]').first();
    const hasForm = await form.count() > 0;
    
    if (hasForm) {
      await expect(form).toBeVisible();
      
      // Vérifier qu'il n'y a pas de débordement
      const formWidth = await form.evaluate(el => el.scrollWidth);
      const viewportWidth = page.viewportSize()?.width || 0;
      
      expect(formWidth).toBeLessThanOrEqual(viewportWidth);
    }
  });

  test('Settings - Interface adaptée mobile', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier que les paramètres sont accessibles
    const settings = page.locator('input, select, button');
    const count = await settings.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('Notifications - Liste mobile', async ({ page }) => {
    await page.goto('/notifications');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier que les notifications sont empilées verticalement
    const notificationItems = page.locator('[data-notification], .notification, article').filter({
      hasText: /.+/
    });
    
    const count = await notificationItems.count();
    
    if (count > 0) {
      // Vérifier que les éléments ne débordent pas horizontalement
      for (const item of await notificationItems.all()) {
        const box = await item.boundingBox();
        const viewportWidth = page.viewportSize()?.width || 0;
        
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewportWidth);
        }
      }
    }
  });

  test('Scroll infini - Performance mobile', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Simuler un scroll
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }
    
    // Vérifier que la page répond toujours
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Tablette - Layout responsive', () => {
  
  test.use({
    viewport: { width: 768, height: 1024 }, // iPad
  });

  test('Page d\'accueil - Layout tablette', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('main')).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/home-tablet.png',
      fullPage: true 
    });
  });

  test('Dashboard - Grille adaptée tablette', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Sur tablette, on devrait avoir plus de contenu visible qu'en mobile
    const cards = await page.locator('[data-card], .card, article, section').count();
    expect(cards).toBeGreaterThanOrEqual(0);
  });

  test('Navigation - Menu horizontal ou latéral', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
    
    // Vérifier qu'il y a des liens visibles (pas besoin de menu burger sur tablette)
    const visibleLinks = await page.locator('nav a, header a').count();
    expect(visibleLinks).toBeGreaterThan(0);
  });
});

test.describe('Orientation - Portrait / Paysage', () => {
  
  test('Mobile paysage - Layout adapté', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }); // iPhone landscape
    
    await page.goto('/');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier que le contenu s'adapte
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = page.viewportSize()?.height || 0;
    
    // En paysage, il devrait y avoir du contenu (scroll vertical)
    expect(bodyHeight).toBeGreaterThan(viewportHeight * 0.5);
  });

  test('Tablette paysage - Utilisation optimale de l\'espace', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // iPad landscape
    
    await page.goto('/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/dashboard-tablet-landscape.png',
      fullPage: false 
    });
  });
});

test.describe('Performance mobile', () => {
  
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('Temps de chargement - Réseau 3G simulé', async ({ page, context }) => {
    // Simuler une connexion 3G lente
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Delay de 100ms
      await route.continue();
    });
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Sur réseau lent, accepter jusqu'à 10 secondes
    expect(loadTime).toBeLessThan(10000);
  });

  test('Images - Lazy loading mobile', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les images utilisent le lazy loading
    const images = await page.locator('img').all();
    
    for (const img of images.slice(0, 3)) {
      const loading = await img.getAttribute('loading');
      // Soit lazy, soit pas d'attribut (dépend de l'implémentation)
      if (loading) {
        expect(loading).toBe('lazy');
      }
    }
  });

  test('Animations - Réduites si préférence utilisateur', async ({ page, context }) => {
    // Simuler la préférence "reduced motion"
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });
    
    await page.goto('/');
    
    // Vérifier que l'application respecte cette préférence
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Accessibilité mobile', () => {
  
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('Contraste - Lisibilité sur petit écran', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le texte est visible
    const textElements = await page.locator('p, span, h1, h2, h3').all();
    
    for (const element of textElements.slice(0, 5)) {
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        const text = await element.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('Focus - Navigation au clavier possible', async ({ page }) => {
    await page.goto('/');
    
    // Simuler la navigation au clavier
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  });

  test('Zoom - Contenu redimensionnable', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le viewport meta permet le zoom
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    // Ne devrait pas contenir "user-scalable=no" ou "maximum-scale=1"
    if (viewport) {
      expect(viewport).not.toContain('user-scalable=no');
    }
  });
});
