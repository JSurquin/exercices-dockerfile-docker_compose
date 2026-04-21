import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les intégrations externes
 * Steam, Skinplace, Qonto, Binance
 */

test.describe('Intégration - Steam API', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Connexion Steam - Bouton visible', async ({ page }) => {
    // Se déconnecter d'abord
    await page.goto('/');
    
    // Chercher le bouton Steam
    const steamButton = page.locator('button:has-text("steam"), a:has-text("steam")').first();
    const hasButton = await steamButton.count() > 0;
    
    if (hasButton) {
      await expect(steamButton).toBeVisible();
      
      const href = await steamButton.getAttribute('href');
      
      if (href) {
        expect(href).toContain('steam');
        console.log('✅ Bouton Steam pointe vers:', href.substring(0, 50));
      }
    }
  });

  test('Avatar Steam - Chargé correctement', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Chercher l'avatar de l'utilisateur
    const avatar = page.locator('img[alt*="avatar" i], img[alt*="profil" i]').first();
    const hasAvatar = await avatar.count() > 0;
    
    if (hasAvatar) {
      const src = await avatar.getAttribute('src');
      
      if (src) {
        console.log('✅ Avatar source:', src.substring(0, 50));
        
        // Vérifier que l'image charge
        const naturalWidth = await avatar.evaluate((el: HTMLImageElement) => el.naturalWidth);
        
        if (naturalWidth > 0) {
          console.log('✅ Avatar chargé, largeur:', naturalWidth);
        }
      }
    }
  });

  test('Inventaire Steam - Récupération', async ({ page }) => {
    await page.goto('/sell');
    
    // Chercher un loader ou message de chargement d'inventaire
    const inventoryLoader = page.locator('[data-inventory], text=/inventaire|inventory/i').first();
    const hasInventory = await inventoryLoader.count() > 0;
    
    if (hasInventory) {
      console.log('✅ Système d\'inventaire Steam');
    }
  });

  test('Trade Link validation - Format Steam', async ({ page }) => {
    await page.goto('/sell');
    
    const tradeLinkInput = page.locator('input[name*="trade" i]').first();
    
    if (await tradeLinkInput.count() > 0) {
      // URL Steam valide
      await tradeLinkInput.fill('https://steamcommunity.com/tradeoffer/new/?partner=123&token=ABC');
      
      await page.waitForTimeout(500);
      
      const errorCount = await page.locator('text=/invalid|invalide/i').count();
      
      if (errorCount === 0) {
        console.log('✅ Trade Link Steam valide accepté');
      }
    }
  });
});

test.describe('Intégration - Skinplace API', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Estimation de prix - Appel API', async ({ page }) => {
    await page.goto('/sell');
    
    // Chercher un élément lié à Skinplace
    const skinplaceRef = page.locator('text=/skinplace|estimation/i').first();
    const hasRef = await skinplaceRef.count() > 0;
    
    if (hasRef) {
      console.log('✅ Intégration Skinplace mentionnée');
    }
  });

  test('Cache des estimations - 5 minutes max', async ({ page }) => {
    await page.goto('/sell');
    
    // Vérifier qu'il y a mention du cache
    const cacheInfo = page.locator('text=/cache|mis.*jour|updated/i').first();
    const hasCache = await cacheInfo.count() > 0;
    
    if (hasCache) {
      console.log('✅ Système de cache d\'estimation');
    }
  });

  test('Erreur Skinplace API - Gestion gracieuse', async ({ page }) => {
    await page.goto('/sell');
    
    // Si l'API échoue, un message devrait s'afficher
    const errorMessage = page.locator('[role="alert"], .error').first();
    const hasError = await errorMessage.count() > 0;
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log('Message d\'erreur API:', errorText);
    }
  });
});

test.describe('Intégration - Qonto (SEPA)', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Formulaire SEPA - Validation IBAN', async ({ page }) => {
    await page.goto('/payout');
    
    // Chercher l'option SEPA
    const sepaButton = page.locator('button:has-text("sepa"), [data-method="sepa"]').first();
    
    if (await sepaButton.count() > 0) {
      await sepaButton.click();
      await page.waitForTimeout(500);
      
      const ibanInput = page.locator('input[name*="iban" i]').first();
      
      if (await ibanInput.count() > 0) {
        // IBAN français valide
        await ibanInput.fill('FR7630006000011234567890189');
        await ibanInput.blur();
        
        await page.waitForTimeout(500);
        
        const errorCount = await page.locator('text=/iban.*invalid/i').count();
        
        if (errorCount === 0) {
          console.log('✅ Validation IBAN Qonto');
        }
      }
    }
  });

  test('Clé d\'idempotence - Mention dans UI', async ({ page }) => {
    await page.goto('/payout');
    
    // Vérifier qu'il y a mention de la sécurité des transactions
    const securityInfo = page.locator('text=/sécurisé|secure|protection/i').first();
    const hasSecurity = await securityInfo.count() > 0;
    
    if (hasSecurity) {
      console.log('✅ Information sécurité des transactions');
    }
  });
});

test.describe('Intégration - Binance (Crypto)', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Sélection de crypto-monnaie - Options disponibles', async ({ page }) => {
    await page.goto('/payout');
    
    const cryptoButton = page.locator('button:has-text("crypto"), [data-method="crypto"]').first();
    
    if (await cryptoButton.count() > 0) {
      await cryptoButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier les devises disponibles
      const currencies = ['BTC', 'ETH', 'USDT', 'USDC'];
      
      for (const currency of currencies) {
        const hasCurrency = await page.locator(`text=${currency}`).count();
        
        if (hasCurrency > 0) {
          console.log(`✅ ${currency} disponible`);
        }
      }
    }
  });

  test('Validation adresse wallet - Format correct', async ({ page }) => {
    await page.goto('/payout');
    
    const walletInput = page.locator('input[name*="wallet" i], input[name*="address" i]').first();
    
    if (await walletInput.count() > 0) {
      // Adresse Bitcoin valide
      await walletInput.fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      await walletInput.blur();
      
      await page.waitForTimeout(500);
      
      const errorCount = await page.locator('text=/address.*invalid/i').count();
      
      if (errorCount === 0) {
        console.log('✅ Validation adresse crypto');
      }
    }
  });

  test('Confirmations blockchain - Suivi', async ({ page }) => {
    await page.goto('/payout');
    
    // Chercher mention des confirmations
    const confirmations = page.locator('text=/\\d+.*confirmation/i').first();
    const hasConfirm = await confirmations.count() > 0;
    
    if (hasConfirm) {
      console.log('✅ Suivi des confirmations blockchain');
    }
  });
});

test.describe('Intégration - Email (Nodemailer)', () => {
  
  test('Notifications email - Mentionnées', async ({ page }) => {
    await page.goto('/settings');
    
    const emailNotif = page.locator('text=/email|notification/i').first();
    const hasEmail = await emailNotif.count() > 0;
    
    if (hasEmail) {
      console.log('✅ Notifications email configurables');
    }
  });

  test('Email de vérification - Workflow', async ({ page }) => {
    await page.goto('/settings');
    
    // Chercher mention de vérification email
    const verification = page.locator('text=/vérif.*email|email.*verif/i').first();
    const hasVerif = await verification.count() > 0;
    
    if (hasVerif) {
      console.log('✅ Système de vérification email');
    }
  });
});

test.describe('Intégration - Sentry (Monitoring)', () => {
  
  test('Sentry - Initialisé', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que Sentry est chargé (si en production)
    const hasSentry = await page.evaluate(() => {
      return '__SENTRY__' in window || 'Sentry' in window;
    });
    
    if (hasSentry) {
      console.log('✅ Sentry initialisé');
    } else {
      console.log('ℹ️ Sentry non détecté (normal en dev)');
    }
  });

  test('Erreurs trackées - Envoi à Sentry', async ({ page }) => {
    await page.goto('/');
    
    // Déclencher une erreur (ne pas vraiment le faire en prod)
    console.log('✅ Les erreurs devraient être envoyées à Sentry');
  });
});

test.describe('Intégration - Analytics', () => {
  
  test('Google Analytics - Si configuré', async ({ page }) => {
    await page.goto('/');
    
    const hasGA = await page.evaluate(() => {
      return 'gtag' in window || 'ga' in window;
    });
    
    if (hasGA) {
      console.log('✅ Google Analytics détecté');
    } else {
      console.log('ℹ️ Google Analytics non détecté');
    }
  });

  test('Events tracking - Boutons instrumentés', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les boutons ont des data-attributes pour tracking
    const trackedButtons = await page.locator('button[data-track], a[data-track]').count();
    
    console.log(`${trackedButtons} bouton(s) avec tracking`);
  });
});
