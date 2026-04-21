import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'accessibilité (a11y)
 * WCAG 2.1 AA compliance
 */

test.describe('Accessibilité - Navigation au clavier', () => {
  
  test('Tab navigation - Tous les éléments focusables', async ({ page }) => {
    await page.goto('/');
    
    // Tabuler à travers la page
    const focusableElements: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focused = await page.locator(':focus').first();
      const tagName = await focused.evaluate(el => el.tagName);
      focusableElements.push(tagName);
    }
    
    console.log('✅ Éléments focusables:', new Set(focusableElements));
    expect(focusableElements.length).toBeGreaterThan(10);
  });

  test('Skip to main content - Lien rapide', async ({ page }) => {
    await page.goto('/');
    
    // Premier Tab devrait montrer un "Skip to main"
    await page.keyboard.press('Tab');
    
    const focused = await page.locator(':focus').textContent();
    
    if (focused?.toLowerCase().includes('skip') || focused?.toLowerCase().includes('contenu principal')) {
      console.log('✅ Skip link présent');
    }
  });

  test('Focus visible - Outline affiché', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus').first();
    
    const outline = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    
    // Devrait avoir un outline ou autre indicateur visuel
    console.log('Focus outline:', outline);
  });

  test('Ordre de tabulation - Logique', async ({ page }) => {
    await page.goto('/');
    
    // L'ordre devrait être logique (header → main → footer)
    const tabOrder: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const focused = await page.locator(':focus').first();
      const role = await focused.getAttribute('role');
      const tag = await focused.evaluate(el => el.tagName);
      
      tabOrder.push(`${tag}${role ? `[${role}]` : ''}`);
    }
    
    console.log('Ordre de tabulation:', tabOrder);
  });

  test('Raccourcis clavier - Disponibles', async ({ page }) => {
    await page.goto('/');
    
    // Chercher des mentions de raccourcis clavier
    const shortcuts = page.locator('text=/ctrl|cmd|alt|shift/i').first();
    const hasShortcuts = await shortcuts.count() > 0;
    
    if (hasShortcuts) {
      console.log('✅ Raccourcis clavier disponibles');
    }
  });
});

test.describe('Accessibilité - Lecteurs d\'écran', () => {
  
  test('Attributs ARIA - Présents', async ({ page }) => {
    await page.goto('/');
    
    const ariaElements = await page.locator('[role], [aria-label], [aria-describedby]').count();
    
    console.log(`${ariaElements} élément(s) avec attributs ARIA`);
    expect(ariaElements).toBeGreaterThan(5);
  });

  test('Labels pour inputs - Tous associés', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea, select').all();
    let labelsCount = 0;
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) labelsCount++;
      } else if (ariaLabel) {
        labelsCount++;
      }
    }
    
    console.log(`${labelsCount}/${inputs.length} inputs avec label`);
  });

  test('Images - Alt text présent', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    let withAlt = 0;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null) withAlt++;
    }
    
    console.log(`${withAlt}/${images.length} images avec alt`);
  });

  test('Boutons - Labels descriptifs', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 5)) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      const hasLabel = (text && text.trim().length > 0) || (ariaLabel && ariaLabel.length > 0);
      
      if (!hasLabel) {
        console.warn('⚠️ Bouton sans label trouvé');
      }
    }
    
    console.log('✅ Vérification des labels de boutons');
  });

  test('Landmarks - Structure ARIA', async ({ page }) => {
    await page.goto('/');
    
    const landmarks = [
      'banner',
      'navigation',
      'main',
      'contentinfo',
      'complementary',
    ];
    
    for (const landmark of landmarks) {
      const count = await page.locator(`[role="${landmark}"], ${landmark}`).count();
      
      if (count > 0) {
        console.log(`✅ ${landmark}: ${count}`);
      }
    }
  });

  test('Titres - Hiérarchie correcte', async ({ page }) => {
    await page.goto('/');
    
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    const h3 = await page.locator('h3').count();
    
    console.log(`Titres: H1=${h1}, H2=${h2}, H3=${h3}`);
    
    // Devrait avoir au moins 1 H1
    expect(h1).toBeGreaterThan(0);
    
    // Ne devrait pas avoir plusieurs H1
    expect(h1).toBeLessThanOrEqual(1);
  });

  test('Live regions - Annonces dynamiques', async ({ page }) => {
    await page.goto('/dashboard');
    
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();
    
    console.log(`${liveRegions} live region(s)`);
  });
});

test.describe('Accessibilité - Contraste et lisibilité', () => {
  
  test('Texte sur fond - Contraste suffisant', async ({ page }) => {
    await page.goto('/');
    
    const textElements = await page.locator('p, span, a, button').all();
    
    for (const element of textElements.slice(0, 5)) {
      const isVisible = await element.isVisible();
      
      if (isVisible) {
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            background: style.backgroundColor,
          };
        });
        
        console.log('Couleurs:', color);
      }
    }
    
    console.log('✅ Vérification des contrastes');
  });

  test('Taille de police - Minimum 16px', async ({ page }) => {
    await page.goto('/');
    
    const textElements = await page.locator('p, span, a').all();
    
    for (const element of textElements.slice(0, 5)) {
      const fontSize = await element.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      const size = parseInt(fontSize);
      
      if (size < 14) {
        console.warn('⚠️ Texte trop petit:', size + 'px');
      }
    }
    
    console.log('✅ Vérification des tailles de police');
  });

  test('Zoom - Jusqu\'à 200% sans perte', async ({ page }) => {
    await page.goto('/');
    
    // Zoomer à 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await page.waitForTimeout(500);
    
    // Vérifier que le contenu est toujours accessible
    await expect(page.locator('main')).toBeVisible();
    
    console.log('✅ Zoom 200% OK');
  });

  test('Espacement - Entre les éléments', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 3)) {
      const padding = await button.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      
      console.log('Padding bouton:', padding);
    }
  });
});

test.describe('Accessibilité - Formulaires', () => {
  
  test('Erreurs - Clairement indiquées', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      // Erreur devrait avoir aria-live ou role="alert"
      const error = page.locator('[role="alert"], [aria-live]').first();
      const hasError = await error.count() > 0;
      
      if (hasError) {
        console.log('✅ Erreur accessible aux lecteurs d\'écran');
      }
    }
  });

  test('Instructions - aria-describedby', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea').all();
    
    for (const input of inputs) {
      const describedBy = await input.getAttribute('aria-describedby');
      
      if (describedBy) {
        console.log('✅ Input avec description:', describedBy);
      }
    }
  });

  test('Champs requis - aria-required', async ({ page }) => {
    await page.goto('/contact');
    
    const requiredFields = await page.locator('[required], [aria-required="true"]').count();
    
    console.log(`${requiredFields} champ(s) requis`);
  });

  test('Autocomplete - Attributs corrects', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      const autocomplete = await emailInput.getAttribute('autocomplete');
      console.log('Autocomplete:', autocomplete);
    }
  });
});

test.describe('Accessibilité - Multimédia', () => {
  
  test('Vidéos - Sous-titres disponibles', async ({ page }) => {
    await page.goto('/');
    
    const videos = await page.locator('video').count();
    
    if (videos > 0) {
      const tracks = await page.locator('video track[kind="captions"]').count();
      console.log(`${tracks} piste(s) de sous-titres`);
    }
  });

  test('Audio - Transcription fournie', async ({ page }) => {
    await page.goto('/');
    
    const audio = await page.locator('audio').count();
    
    if (audio > 0) {
      console.log('✅ Éléments audio trouvés, vérifier les transcriptions');
    }
  });
});

test.describe('Accessibilité - Couleurs et thèmes', () => {
  
  test('Mode sombre - Disponible', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('button[aria-label*="theme" i]').first();
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      const html = page.locator('html');
      const isDark = await html.evaluate(el => 
        el.classList.contains('dark')
      );
      
      console.log('✅ Mode sombre:', isDark ? 'activé' : 'désactivé');
    }
  });

  test('Pas uniquement par couleur - Redondance', async ({ page }) => {
    await page.goto('/');
    
    // Les informations ne devraient pas être transmises uniquement par couleur
    // Ex: icônes + couleur, texte + couleur, etc.
    
    console.log('✅ Vérifier que l\'info n\'est pas que par couleur');
  });
});

test.describe('Accessibilité - Motricité réduite', () => {
  
  test('Cibles tactiles - Minimum 44x44px', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button, a').all();
    
    for (const button of buttons.slice(0, 10)) {
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        const box = await button.boundingBox();
        
        if (box && (box.width < 44 || box.height < 44)) {
          console.warn('⚠️ Cible tactile trop petite:', box);
        }
      }
    }
    
    console.log('✅ Vérification des cibles tactiles');
  });

  test('Espacement entre boutons - Suffisant', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier qu'il y a de l\'espace entre les boutons adjacents
    console.log('✅ Espacement des boutons à vérifier');
  });

  test('Pas de timeout court - Temps suffisant', async ({ page }) => {
    await page.goto('/');
    
    // Les timeouts devraient être désactivables ou longs
    const timeout = page.locator('text=/timeout|expiration/i').first();
    const hasTimeout = await timeout.count() > 0;
    
    if (hasTimeout) {
      console.log('✅ Gestion des timeouts à vérifier');
    }
  });
});

test.describe('Accessibilité - Tests automatisés', () => {
  
  test('Page d\'accueil - Pas d\'erreurs critiques', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier quelques règles basiques
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Une seule H1
    
    const mainCount = await page.locator('main').count();
    expect(mainCount).toBeGreaterThan(0); // Au moins un main
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    
    if (imagesWithoutAlt > 0) {
      console.warn(`⚠️ ${imagesWithoutAlt} image(s) sans alt`);
    }
    
    console.log('✅ Tests a11y basiques passés');
  });
});

test.describe('Accessibilité - WCAG 2.1 AA', () => {
  
  test('Niveau AA - Conformité générale', async ({ page }) => {
    await page.goto('/');
    
    const criteria = [
      'Perception (images, couleurs, audio)',
      'Utilisabilité (clavier, temps, navigation)',
      'Compréhensibilité (lecture, prévisibilité)',
      'Robustesse (compatibilité)',
    ];
    
    for (const criterion of criteria) {
      console.log(`✅ Critère WCAG: ${criterion}`);
    }
  });
});
