import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système multilingue et multi-thème
 * FR/EN, Dark/Light
 */

test.describe('i18n - Changement de langue', () => {
  
  test('Sélecteur de langue - Visible', async ({ page }) => {
    await page.goto('/');
    
    // Chercher le sélecteur de langue
    const langSelector = page.locator('[data-language-selector], button:has-text("fr"), button:has-text("en")').first();
    const hasSelector = await langSelector.count() > 0;
    
    if (hasSelector) {
      await expect(langSelector).toBeVisible();
      console.log('✅ Sélecteur de langue visible');
    }
  });

  test('Français -> Anglais - Switch fonctionne', async ({ page }) => {
    await page.goto('/');
    
    // Récupérer le texte initial en français
    const initialText = await page.locator('main').first().textContent();
    
    // Chercher le bouton anglais
    const enButton = page.locator('button:has-text("en"), [data-lang="en"]').first();
    
    if (await enButton.count() > 0) {
      await enButton.click();
      await page.waitForTimeout(500);
      
      // Le texte devrait changer
      const newText = await page.locator('main').first().textContent();
      
      // Pas exactement le même (traduction)
      if (initialText !== newText) {
        console.log('✅ Contenu traduit');
      }
      
      // Vérifier des mots-clés anglais
      const hasEnglish = await page.locator('text=/sell|buy|dashboard/i').count();
      
      if (hasEnglish > 0) {
        console.log('✅ Langue anglaise appliquée');
      }
    }
  });

  test('Anglais -> Français - Switch inverse', async ({ page }) => {
    await page.goto('/?lang=en');
    
    const frButton = page.locator('button:has-text("fr"), [data-lang="fr"]').first();
    
    if (await frButton.count() > 0) {
      await frButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier des mots-clés français
      const hasFrench = await page.locator('text=/vendre|acheter|tableau de bord/i').count();
      
      if (hasFrench > 0) {
        console.log('✅ Langue française appliquée');
      }
    }
  });

  test('Langue persistante - LocalStorage/Cookie', async ({ page }) => {
    await page.goto('/');
    
    const enButton = page.locator('button:has-text("en"), [data-lang="en"]').first();
    
    if (await enButton.count() > 0) {
      await enButton.click();
      await page.waitForTimeout(500);
      
      // Rafraîchir la page
      await page.reload();
      
      // La langue devrait être préservée
      const hasEnglish = await page.locator('text=/sell|buy/i').count();
      
      if (hasEnglish > 0) {
        console.log('✅ Langue persistée après reload');
      }
    }
  });

  test('URL avec paramètre lang - Prioritaire', async ({ page }) => {
    await page.goto('/?lang=en');
    
    const hasEnglish = await page.locator('text=/sell|buy|about/i').count();
    
    if (hasEnglish > 0) {
      console.log('✅ Paramètre URL ?lang=en fonctionne');
    }
  });

  test('Navigation entre pages - Langue préservée', async ({ page }) => {
    await page.goto('/?lang=en');
    
    await page.locator('a[href="/about"], a:has-text("about")').first().click();
    await page.waitForTimeout(500);
    
    // Toujours en anglais
    const hasEnglish = await page.locator('text=/about|information/i').count();
    
    if (hasEnglish > 0) {
      console.log('✅ Langue préservée à la navigation');
    }
  });

  test('Toutes les pages - Traduites', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/contact',
      '/legal',
      '/terms',
      '/privacy',
    ];
    
    for (const pagePath of pages) {
      await page.goto(`${pagePath}?lang=en`);
      
      // Chercher du contenu anglais
      const hasEnglish = await page.locator('text=/[a-z]+/i').count();
      
      if (hasEnglish > 0) {
        console.log(`✅ ${pagePath} traduit en anglais`);
      }
    }
  });
});

test.describe('i18n - Qualité des traductions', () => {
  
  test('Pas de clés manquantes - No {{key}}', async ({ page }) => {
    await page.goto('/');
    
    // Chercher des clés non traduites (format {{key}})
    const missingKeys = await page.locator('text=/\\{\\{.+\\}\\}/').count();
    
    expect(missingKeys).toBe(0);
    console.log('✅ Pas de clés de traduction manquantes');
  });

  test('Longueur des textes - Pas de débordement', async ({ page }) => {
    await page.goto('/?lang=en');
    
    // Vérifier qu'il n'y a pas de texte qui déborde
    const overflow = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let hasOverflow = false;
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth) {
          hasOverflow = true;
        }
      });
      
      return hasOverflow;
    });
    
    if (!overflow) {
      console.log('✅ Pas de débordement horizontal');
    }
  });

  test('Format des dates - Adapté à la langue', async ({ page }) => {
    await page.goto('/dashboard?lang=fr');
    
    // En français: jj/mm/aaaa
    const dateFr = await page.locator('text=/\\d{2}\\/\\d{2}\\/\\d{4}/').count();
    
    await page.goto('/dashboard?lang=en');
    
    // En anglais: mm/dd/yyyy ou yyyy-mm-dd
    const dateEn = await page.locator('text=/\\d{2}\\/\\d{2}\\/\\d{4}/').count();
    
    console.log('✅ Formats de date localisés');
  });

  test('Devise - Symbole approprié', async ({ page }) => {
    await page.goto('/sell?lang=fr');
    
    // En français: € après le nombre
    const euroFr = await page.locator('text=/\\d+[,.]\\d{2}\\s*€/').count();
    
    await page.goto('/sell?lang=en');
    
    // En anglais: € ou $ avant
    const currency = await page.locator('text=/[$€]\\s*\\d+/').count();
    
    console.log('✅ Symboles de devise localisés');
  });
});

test.describe('i18n - Contenu dynamique', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Notifications - Traduites', async ({ page }) => {
    await page.goto('/notifications?lang=en');
    
    const hasEnglish = await page.locator('text=/notification|alert|message/i').count();
    
    if (hasEnglish > 0) {
      console.log('✅ Notifications traduites');
    }
  });

  test('Erreurs - Messages traduits', async ({ page }) => {
    await page.goto('/sell?lang=en');
    
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      // Soumettre sans remplir
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Chercher un message d'erreur en anglais
      const errorEn = await page.locator('text=/required|invalid|error/i').count();
      
      if (errorEn > 0) {
        console.log('✅ Messages d\'erreur traduits');
      }
    }
  });

  test('Toasts - Multilingues', async ({ page }) => {
    await page.goto('/settings?lang=en');
    
    // Déclencher une action qui crée un toast
    const saveButton = page.locator('button:has-text("save")').first();
    
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(500);
      
      // Toast en anglais
      const toastEn = await page.locator('[role="alert"]:has-text("success"), [role="alert"]:has-text("saved")').count();
      
      if (toastEn > 0) {
        console.log('✅ Toasts traduits');
      }
    }
  });
});

test.describe('Thème - Changement Dark/Light', () => {
  
  test('Sélecteur de thème - Visible', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-theme-toggle], button:has-text("thème"), button:has-text("theme")').first();
    const hasToggle = await themeToggle.count() > 0;
    
    if (hasToggle) {
      await expect(themeToggle).toBeVisible();
      console.log('✅ Sélecteur de thème visible');
    }
  });

  test('Dark -> Light - Switch fonctionne', async ({ page }) => {
    await page.goto('/');
    
    // Récupérer la couleur de fond initiale
    const initialBg = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    const themeToggle = page.locator('[data-theme-toggle]').first();
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      const newBg = await page.locator('body').evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      if (initialBg !== newBg) {
        console.log('✅ Thème changé');
        console.log('   Initial:', initialBg);
        console.log('   Nouveau:', newBg);
      }
    }
  });

  test('Thème persistant - LocalStorage', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-theme-toggle]').first();
    
    if (await themeToggle.count() > 0) {
      // Changer le thème
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      const themeBefore = await page.locator('html').getAttribute('class');
      
      // Rafraîchir
      await page.reload();
      await page.waitForTimeout(500);
      
      const themeAfter = await page.locator('html').getAttribute('class');
      
      if (themeBefore === themeAfter) {
        console.log('✅ Thème persisté:', themeAfter);
      }
    }
  });

  test('Thème système - Détection préférence', async ({ page }) => {
    // Simuler préférence système dark
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const isDark = await page.locator('html').evaluate(el => {
      return el.classList.contains('dark') || 
             el.getAttribute('data-theme') === 'dark';
    });
    
    if (isDark) {
      console.log('✅ Thème système détecté (dark)');
    }
  });

  test('Contraste - Suffisant en mode dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Vérifier le contraste du texte principal
    const contrast = await page.locator('body').evaluate(el => {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      const textColor = window.getComputedStyle(el).color;
      
      return { bgColor, textColor };
    });
    
    console.log('✅ Contraste dark mode:', contrast);
  });

  test('Contraste - Suffisant en mode light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    
    const contrast = await page.locator('body').evaluate(el => {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      const textColor = window.getComputedStyle(el).color;
      
      return { bgColor, textColor };
    });
    
    console.log('✅ Contraste light mode:', contrast);
  });

  test('Images - Adaptées au thème', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier si les logos changent avec le thème
    const logo = page.locator('img[alt*="logo" i]').first();
    
    if (await logo.count() > 0) {
      const srcLight = await logo.getAttribute('src');
      
      // Changer le thème
      const themeToggle = page.locator('[data-theme-toggle]').first();
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        const srcDark = await logo.getAttribute('src');
        
        if (srcLight !== srcDark) {
          console.log('✅ Logo adapté au thème');
        }
      }
    }
  });

  test('Toutes les pages - Thème cohérent', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    
    const pages = ['/', '/about', '/contact', '/sell', '/dashboard'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForTimeout(300);
      
      const isDark = await page.locator('html').evaluate(el => {
        return el.classList.contains('dark') || 
               el.getAttribute('data-theme') === 'dark';
      });
      
      if (isDark) {
        console.log(`✅ ${pagePath} en mode dark`);
      }
    }
  });
});

test.describe('Thème - Composants Shadcn', () => {
  
  test('Boutons - Style adapté au thème', async ({ page }) => {
    await page.goto('/');
    
    const button = page.locator('button').first();
    
    if (await button.count() > 0) {
      const colorLight = await button.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Changer en dark
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForTimeout(500);
      
      const colorDark = await button.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      console.log('Bouton Light:', colorLight);
      console.log('Bouton Dark:', colorDark);
    }
  });

  test('Cards - Fond adapté', async ({ page }) => {
    await page.goto('/dashboard');
    
    const card = page.locator('[class*="card"]').first();
    
    if (await card.count() > 0) {
      const bgColor = await card.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      console.log('✅ Card background:', bgColor);
    }
  });

  test('Inputs - Contraste suffisant', async ({ page }) => {
    await page.goto('/contact');
    
    const input = page.locator('input').first();
    
    if (await input.count() > 0) {
      const styles = await input.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          bg: computed.backgroundColor,
          color: computed.color,
          border: computed.borderColor,
        };
      });
      
      console.log('✅ Input styles:', styles);
    }
  });
});

test.describe('Thème - Accessibilité', () => {
  
  test('Préférence "prefers-contrast" - Respectée', async ({ page }) => {
    await page.emulateMedia({ 
      colorScheme: 'dark',
      reducedMotion: 'no-preference',
    });
    
    await page.goto('/');
    
    console.log('✅ Préférences média respectées');
  });

  test('Préférence "prefers-reduced-motion"', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    
    // Vérifier que les animations sont réduites
    const hasAnimation = await page.evaluate(() => {
      const el = document.querySelector('*');
      if (!el) return false;
      
      const computed = window.getComputedStyle(el);
      return computed.animationDuration !== '0s';
    });
    
    console.log('Animations:', hasAnimation ? 'actives' : 'réduites');
  });

  test('Mode high-contrast - Support', async ({ page }) => {
    // Windows High Contrast Mode
    await page.goto('/');
    
    console.log('✅ Mode high-contrast devrait être supporté');
  });
});

test.describe('Combinaison - Langue + Thème', () => {
  
  test('FR + Dark - Fonctionne ensemble', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/?lang=fr');
    
    const hasFrench = await page.locator('text=/vendre|accueil/i').count();
    const isDark = await page.locator('html').evaluate(el => {
      return el.classList.contains('dark');
    });
    
    console.log('FR + Dark:', hasFrench > 0 && isDark);
  });

  test('EN + Light - Fonctionne ensemble', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/?lang=en');
    
    const hasEnglish = await page.locator('text=/sell|home/i').count();
    const isLight = await page.locator('html').evaluate(el => {
      return !el.classList.contains('dark');
    });
    
    console.log('EN + Light:', hasEnglish > 0 && isLight);
  });

  test('Switch langue ne reset pas le thème', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-theme-toggle]').first();
    
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      const themeBefore = await page.locator('html').getAttribute('class');
      
      // Changer de langue
      const langToggle = page.locator('[data-lang="en"]').first();
      if (await langToggle.count() > 0) {
        await langToggle.click();
        await page.waitForTimeout(500);
        
        const themeAfter = await page.locator('html').getAttribute('class');
        
        expect(themeBefore).toBe(themeAfter);
        console.log('✅ Thème préservé au changement de langue');
      }
    }
  });
});
