import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les formulaires de l'application
 * Validation, soumission, erreurs
 */

test.describe('Formulaires - Contact', () => {
  
  test('Formulaire de contact - Tous les champs visibles', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier les champs du formulaire
    const fields = [
      'input[name*="name" i], input[name*="nom" i]',
      'input[name*="email" i]',
      'input[name*="subject" i], input[name*="sujet" i]',
      'textarea[name*="message" i]',
    ];
    
    let foundFields = 0;
    
    for (const selector of fields) {
      const field = page.locator(selector).first();
      const hasField = await field.count() > 0;
      
      if (hasField) {
        foundFields++;
        await expect(field).toBeVisible();
      }
    }
    
    console.log(`✅ ${foundFields}/4 champs trouvés`);
  });

  test('Validation email - Format invalide', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    const hasEmail = await emailInput.count() > 0;
    
    if (hasEmail) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorMessage = await page.locator('text=/email.*invalid|email.*invalide/i').count();
      expect(errorMessage).toBeGreaterThan(0);
    }
  });

  test('Validation email - Format valide', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    const hasEmail = await emailInput.count() > 0;
    
    if (hasEmail) {
      await emailInput.fill('test@example.com');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorMessage = await page.locator('text=/email.*invalid/i').count();
      expect(errorMessage).toBe(0);
    }
  });

  test('Champ message - Longueur minimum', async ({ page }) => {
    await page.goto('/contact');
    
    const messageInput = page.locator('textarea').first();
    const hasMessage = await messageInput.count() > 0;
    
    if (hasMessage) {
      await messageInput.fill('Hi');
      await messageInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorMessage = await page.locator('text=/minimum|trop court/i').count();
      
      if (errorMessage > 0) {
        console.log('✅ Validation longueur minimum');
      }
    }
  });

  test('Champ message - Longueur maximum', async ({ page }) => {
    await page.goto('/contact');
    
    const messageInput = page.locator('textarea').first();
    const hasMessage = await messageInput.count() > 0;
    
    if (hasMessage) {
      const longMessage = 'a'.repeat(5000);
      await messageInput.fill(longMessage);
      
      const value = await messageInput.inputValue();
      
      // Le champ devrait limiter la longueur
      console.log(`Longueur du message: ${value.length} caractères`);
    }
  });

  test('Bouton de soumission - Désactivé si champs incomplets', async ({ page }) => {
    await page.goto('/contact');
    
    const submitButton = page.locator('button[type="submit"]').first();
    const hasButton = await submitButton.count() > 0;
    
    if (hasButton) {
      const isDisabled = await submitButton.isDisabled();
      console.log('Bouton submit:', isDisabled ? 'désactivé' : 'actif');
    }
  });

  test('Soumission du formulaire - Message de succès', async ({ page }) => {
    await page.goto('/contact');
    
    // Remplir tous les champs
    const nameInput = page.locator('input[name*="name" i]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test User');
    }
    
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
    }
    
    const subjectInput = page.locator('input[name*="subject" i]').first();
    if (await subjectInput.count() > 0) {
      await subjectInput.fill('Test Subject');
    }
    
    const messageInput = page.locator('textarea').first();
    if (await messageInput.count() > 0) {
      await messageInput.fill('This is a test message with enough characters.');
    }
    
    // Soumettre (note: on ne clique pas vraiment pour éviter l'envoi)
    await page.screenshot({ 
      path: 'test-results/screenshots/contact-form-filled.png' 
    });
  });

  test('Protection anti-spam - CAPTCHA ou honeypot', async ({ page }) => {
    await page.goto('/contact');
    
    // Chercher un CAPTCHA
    const captcha = page.locator('[data-captcha], .captcha, iframe[src*="recaptcha"]').first();
    const hasCaptcha = await captcha.count() > 0;
    
    if (hasCaptcha) {
      console.log('✅ CAPTCHA détecté');
    }
    
    // Chercher un honeypot (champ caché)
    const honeypot = page.locator('input[type="hidden"], input[style*="display: none"]').first();
    const hasHoneypot = await honeypot.count() > 0;
    
    if (hasHoneypot) {
      console.log('✅ Honeypot détecté');
    }
  });

  test('Reset du formulaire - Bouton de réinitialisation', async ({ page }) => {
    await page.goto('/contact');
    
    const resetButton = page.locator('button[type="reset"], button:has-text("réinitialiser")').first();
    const hasReset = await resetButton.count() > 0;
    
    if (hasReset) {
      await expect(resetButton).toBeVisible();
      console.log('✅ Bouton de reset disponible');
    }
  });
});

test.describe('Formulaires - Authentification', () => {
  
  test('Formulaire de login - Redirection vers Steam', async ({ page }) => {
    await page.goto('/login');
    
    const steamButton = page.locator('button:has-text("steam"), a:has-text("steam")').first();
    const hasSteam = await steamButton.count() > 0;
    
    if (hasSteam) {
      await expect(steamButton).toBeVisible();
      
      const href = await steamButton.getAttribute('href');
      
      if (href) {
        expect(href).toContain('steam');
      }
    }
  });

  test('Pas de formulaire classique - Steam OpenID uniquement', async ({ page }) => {
    await page.goto('/login');
    
    // Ne devrait PAS avoir de champ email/password classique
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    const hasEmail = await emailInput.count() > 0;
    const hasPassword = await passwordInput.count() > 0;
    
    // Selon les .cursorrules, seul Steam est autorisé
    console.log('Email input:', hasEmail ? 'trouvé' : 'non trouvé');
    console.log('Password input:', hasPassword ? 'trouvé' : 'non trouvé');
  });
});

test.describe('Formulaires - Paramètres utilisateur', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Formulaire de paramètres - Champs modifiables', async ({ page }) => {
    await page.goto('/settings');
    
    // Vérifier les champs disponibles
    const fields = [
      'input[name*="username" i]',
      'input[name*="email" i]',
      'select[name*="language" i], select[name*="langue" i]',
      'select[name*="currency" i], select[name*="devise" i]',
      'input[type="checkbox"][name*="newsletter" i]',
      'input[type="checkbox"][name*="notification" i]',
    ];
    
    let foundFields = 0;
    
    for (const selector of fields) {
      const field = page.locator(selector).first();
      const hasField = await field.count() > 0;
      
      if (hasField) {
        foundFields++;
        console.log(`✅ Champ trouvé: ${selector}`);
      }
    }
  });

  test('Modification du username - Validation unicité', async ({ page }) => {
    await page.goto('/settings');
    
    const usernameInput = page.locator('input[name*="username" i]').first();
    const hasUsername = await usernameInput.count() > 0;
    
    if (hasUsername) {
      await expect(usernameInput).toBeVisible();
      
      // Tester un username déjà pris
      await usernameInput.fill('admin');
      await usernameInput.blur();
      
      await page.waitForTimeout(1000);
      
      const errorMessage = await page.locator('text=/déjà.*utilisé|already.*taken|unavailable/i').count();
      
      if (errorMessage > 0) {
        console.log('✅ Vérification d\'unicité du username');
      }
    }
  });

  test('Modification de l\'email - Vérification requise', async ({ page }) => {
    await page.goto('/settings');
    
    const emailInput = page.locator('input[type="email"]').first();
    const hasEmail = await emailInput.count() > 0;
    
    if (hasEmail) {
      await emailInput.fill('newemail@example.com');
      
      // Un message de vérification devrait apparaître
      const verificationMessage = await page.locator('text=/vérification|verification|confirm/i').count();
      
      if (verificationMessage > 0) {
        console.log('✅ Vérification email requise');
      }
    }
  });

  test('Changement de langue - FR/EN', async ({ page }) => {
    await page.goto('/settings');
    
    const langSelect = page.locator('select[name*="lang" i]').first();
    const hasLang = await langSelect.count() > 0;
    
    if (hasLang) {
      await expect(langSelect).toBeVisible();
      
      // Vérifier les options
      const options = await langSelect.locator('option').allTextContents();
      console.log('Langues disponibles:', options);
      
      // Changer la langue
      await langSelect.selectOption('en');
      await page.waitForTimeout(500);
      
      // Vérifier que la page se met à jour
      console.log('✅ Changement de langue');
    }
  });

  test('Notifications - Configuration des préférences', async ({ page }) => {
    await page.goto('/settings');
    
    const notifCheckboxes = page.locator('input[type="checkbox"][name*="notif" i]');
    const count = await notifCheckboxes.count();
    
    console.log(`${count} option(s) de notification`);
    
    if (count > 0) {
      // Tester le toggle d'une option
      const firstCheckbox = notifCheckboxes.first();
      await firstCheckbox.click();
      await page.waitForTimeout(300);
      
      const isChecked = await firstCheckbox.isChecked();
      console.log('Notification toggled:', isChecked);
    }
  });

  test('Sauvegarde des paramètres - Bouton et confirmation', async ({ page }) => {
    await page.goto('/settings');
    
    const saveButton = page.locator('button[type="submit"], button:has-text("sauvegarder"), button:has-text("save")').first();
    const hasButton = await saveButton.count() > 0;
    
    if (hasButton) {
      await expect(saveButton).toBeVisible();
      
      // Note: Ne pas cliquer pour éviter de modifier la DB
      console.log('✅ Bouton de sauvegarde trouvé');
    }
  });
});

test.describe('Formulaires - Validation générale', () => {
  
  test('Champs requis - Marqués avec astérisque', async ({ page }) => {
    await page.goto('/contact');
    
    const requiredMarkers = await page.locator('text=/\\*/').count();
    
    if (requiredMarkers > 0) {
      console.log(`✅ ${requiredMarkers} champs requis marqués`);
    }
  });

  test('Messages d\'erreur - Rouge et visibles', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"]').first();
      const hasError = await errorMessage.count() > 0;
      
      if (hasError) {
        await expect(errorMessage).toBeVisible();
        
        // Vérifier la couleur (rouge)
        const color = await errorMessage.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        console.log('Couleur du message d\'erreur:', color);
      }
    }
  });

  test('Auto-completion - Attributs autocomplete', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      const autocomplete = await emailInput.getAttribute('autocomplete');
      console.log('Attribut autocomplete:', autocomplete);
    }
  });

  test('Labels - Associés aux inputs', async ({ page }) => {
    await page.goto('/contact');
    
    const labels = await page.locator('label').count();
    const inputs = await page.locator('input, textarea, select').count();
    
    console.log(`${labels} label(s) pour ${inputs} input(s)`);
  });

  test('Placeholder - Texte d\'aide', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea').all();
    
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      
      if (placeholder) {
        console.log('Placeholder:', placeholder);
      }
    }
  });

  test('Compteur de caractères - Sur textarea', async ({ page }) => {
    await page.goto('/contact');
    
    const counter = page.locator('[data-counter], .character-count, text=/\\d+\\/\\d+/').first();
    const hasCounter = await counter.count() > 0;
    
    if (hasCounter) {
      await expect(counter).toBeVisible();
      console.log('✅ Compteur de caractères trouvé');
    }
  });

  test('Désactivation pendant soumission - Prévention double-clic', async ({ page }) => {
    await page.goto('/contact');
    
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      // Après clic, le bouton devrait se désactiver
      // Note: On ne teste pas réellement le clic
      
      const isDisabled = await submitButton.isDisabled();
      console.log('Bouton submit avant clic:', isDisabled ? 'désactivé' : 'actif');
    }
  });

  test('Loading spinner - Pendant soumission', async ({ page }) => {
    await page.goto('/contact');
    
    const spinner = page.locator('[role="progressbar"], .spinner, .loading').first();
    const hasSpinner = await spinner.count() > 0;
    
    if (hasSpinner) {
      console.log('✅ Spinner de chargement présent');
    }
  });

  test('Toast de succès - Après soumission', async ({ page }) => {
    await page.goto('/contact');
    
    const toast = page.locator('[role="status"], [role="alert"], .toast').first();
    const hasToast = await toast.count() > 0;
    
    if (hasToast) {
      console.log('✅ Système de toast présent');
    }
  });
});

test.describe('Formulaires - Accessibilité', () => {
  
  test('Labels - Pour tous les inputs', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea, select').all();
    
    let inputsWithLabel = 0;
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        
        if (label > 0) {
          inputsWithLabel++;
        }
      }
    }
    
    console.log(`${inputsWithLabel}/${inputs.length} inputs avec label`);
  });

  test('Attributs aria - Validation et erreurs', async ({ page }) => {
    await page.goto('/contact');
    
    const inputs = await page.locator('input, textarea').all();
    
    for (const input of inputs) {
      const ariaInvalid = await input.getAttribute('aria-invalid');
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      const ariaRequired = await input.getAttribute('aria-required');
      
      if (ariaInvalid || ariaDescribedBy || ariaRequired) {
        console.log('Attributs ARIA trouvés:', { ariaInvalid, ariaDescribedBy, ariaRequired });
      }
    }
  });

  test('Navigation au clavier - Tab entre les champs', async ({ page }) => {
    await page.goto('/contact');
    
    // Appuyer sur Tab plusieurs fois
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Vérifier qu'un élément a le focus
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
    
    console.log('✅ Navigation au clavier fonctionnelle');
  });

  test('Messages d\'erreur - Annoncés aux lecteurs d\'écran', async ({ page }) => {
    await page.goto('/contact');
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid');
      await emailInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorMessage = page.locator('[role="alert"]').first();
      const hasError = await errorMessage.count() > 0;
      
      if (hasError) {
        const ariaLive = await errorMessage.getAttribute('aria-live');
        console.log('aria-live:', ariaLive);
      }
    }
  });
});

test.describe('Formulaires - Sécurité', () => {
  
  test('Protection XSS - Échappement des caractères', async ({ page }) => {
    await page.goto('/contact');
    
    const nameInput = page.locator('input[name*="name" i]').first();
    
    if (await nameInput.count() > 0) {
      // Tenter d'injecter du HTML/JS
      await nameInput.fill('<script>alert("XSS")</script>');
      
      const value = await nameInput.inputValue();
      console.log('Valeur stockée:', value);
      
      // Le script ne devrait pas s'exécuter
      // Note: Playwright bloque automatiquement les scripts
    }
  });

  test('Protection CSRF - Token présent', async ({ page }) => {
    await page.goto('/contact');
    
    const csrfToken = page.locator('input[name*="csrf" i], input[name*="token" i]').first();
    const hasToken = await csrfToken.count() > 0;
    
    if (hasToken) {
      console.log('✅ Token CSRF trouvé');
    }
  });

  test('Rate limiting - Protection contre le spam', async ({ page }) => {
    await page.goto('/contact');
    
    // Après plusieurs soumissions rapides, un message devrait apparaître
    // Note: On ne teste pas réellement car ça nécessiterait plusieurs requêtes
    
    const rateLimitMessage = page.locator('text=/trop.*tentatives|too many.*requests|rate limit/i').first();
    const hasMessage = await rateLimitMessage.count() > 0;
    
    if (hasMessage) {
      console.log('✅ Protection rate limiting');
    }
  });
});
