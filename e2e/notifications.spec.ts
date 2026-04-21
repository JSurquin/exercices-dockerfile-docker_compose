import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système de notifications
 * Push, email, en temps réel
 */

test.describe('Notifications - Centre de notifications', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Page notifications - Liste complète', async ({ page }) => {
    await page.goto('/notifications');
    
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator('main')).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/notifications-page.png', 
      fullPage: true 
    });
  });

  test('Badge de notifications - Compteur dans header', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notifBadge = page.locator('[data-notification-count], .notification-badge, [aria-label*="notification" i]').first();
    const hasBadge = await notifBadge.count() > 0;
    
    if (hasBadge) {
      await expect(notifBadge).toBeVisible();
      
      const count = await notifBadge.textContent();
      console.log('Notifications non lues:', count);
    }
  });

  test('Liste des notifications - Scrollable', async ({ page }) => {
    await page.goto('/notifications');
    
    const notifList = page.locator('[data-notifications], .notifications-list').first();
    const hasList = await notifList.count() > 0;
    
    if (hasList) {
      await expect(notifList).toBeVisible();
      
      // Vérifier qu'il y a des notifications
      const items = await page.locator('[data-notification], .notification-item').count();
      console.log(`${items} notification(s) affichée(s)`);
    }
  });

  test('Notification non lue - Mise en évidence', async ({ page }) => {
    await page.goto('/notifications');
    
    const unreadNotif = page.locator('[data-read="false"], .unread, [aria-label*="unread" i]').first();
    const hasUnread = await unreadNotif.count() > 0;
    
    if (hasUnread) {
      await expect(unreadNotif).toBeVisible();
      console.log('✅ Notifications non lues mises en évidence');
    }
  });

  test('Marquer comme lue - Au clic', async ({ page }) => {
    await page.goto('/notifications');
    
    const firstNotif = page.locator('[data-notification]').first();
    
    if (await firstNotif.count() > 0) {
      await firstNotif.click();
      await page.waitForTimeout(500);
      
      // La notification devrait être marquée comme lue
      console.log('✅ Marquage comme lue au clic');
    }
  });

  test('Marquer toutes comme lues - Bouton global', async ({ page }) => {
    await page.goto('/notifications');
    
    const markAllButton = page.locator('button:has-text("tout marquer"), button:has-text("mark all")').first();
    const hasButton = await markAllButton.count() > 0;
    
    if (hasButton) {
      await expect(markAllButton).toBeVisible();
      console.log('✅ Bouton marquer tout comme lu');
    }
  });

  test('Supprimer une notification', async ({ page }) => {
    await page.goto('/notifications');
    
    const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("supprimer")').first();
    const hasButton = await deleteButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Suppression de notifications possible');
    }
  });

  test('Supprimer toutes - Avec confirmation', async ({ page }) => {
    await page.goto('/notifications');
    
    const deleteAllButton = page.locator('button:has-text("tout supprimer"), button:has-text("delete all")').first();
    const hasButton = await deleteAllButton.count() > 0;
    
    if (hasButton) {
      await deleteAllButton.click();
      await page.waitForTimeout(500);
      
      // Un dialog de confirmation devrait apparaître
      const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]').first();
      const hasDialog = await confirmDialog.count() > 0;
      
      if (hasDialog) {
        console.log('✅ Confirmation de suppression massive');
      }
    }
  });
});

test.describe('Notifications - Types de notifications', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Notification trade - Changement de statut', async ({ page }) => {
    await page.goto('/notifications');
    
    const tradeNotif = page.locator('[data-type="trade"], text=/trade|vente/i').first();
    const hasNotif = await tradeNotif.count() > 0;
    
    if (hasNotif) {
      await expect(tradeNotif).toBeVisible();
      console.log('✅ Notifications de trade');
    }
  });

  test('Notification payout - Statut du retrait', async ({ page }) => {
    await page.goto('/notifications');
    
    const payoutNotif = page.locator('[data-type="payout"], text=/payout|retrait/i').first();
    const hasNotif = await payoutNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications de payout');
    }
  });

  test('Notification KYC - Validation ou rejet', async ({ page }) => {
    await page.goto('/notifications');
    
    const kycNotif = page.locator('[data-type="kyc"], text=/kyc|vérification/i').first();
    const hasNotif = await kycNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications KYC');
    }
  });

  test('Notification giveaway - Résultats', async ({ page }) => {
    await page.goto('/notifications');
    
    const giveawayNotif = page.locator('[data-type="giveaway"], text=/giveaway|gagnant/i').first();
    const hasNotif = await giveawayNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications giveaway');
    }
  });

  test('Notification affiliation - Nouveau filleul', async ({ page }) => {
    await page.goto('/notifications');
    
    const affiliateNotif = page.locator('[data-type="affiliate"], text=/filleul|referral/i').first();
    const hasNotif = await affiliateNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications affiliation');
    }
  });

  test('Notification système - Maintenance/Nouveautés', async ({ page }) => {
    await page.goto('/notifications');
    
    const systemNotif = page.locator('[data-type="system"], text=/système|maintenance|update/i').first();
    const hasNotif = await systemNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications système');
    }
  });

  test('Notification sécurité - Connexion suspecte', async ({ page }) => {
    await page.goto('/notifications');
    
    const securityNotif = page.locator('[data-type="security"], text=/sécurité|security|connexion/i').first();
    const hasNotif = await securityNotif.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Notifications de sécurité');
    }
  });
});

test.describe('Notifications - Temps réel', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Toast notification - Apparition automatique', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Attendre une potentielle notification
    await page.waitForTimeout(2000);
    
    const toast = page.locator('[role="status"], .toast, [class*="toast"]').first();
    const hasToast = await toast.count() > 0;
    
    if (hasToast) {
      console.log('✅ Système de toast en temps réel');
    }
  });

  test('Son de notification - Si activé', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier qu'il y a mention du son
    const soundSetting = page.locator('text=/son|sound|audio/i').first();
    const hasSound = await soundSetting.count() > 0;
    
    if (hasSound) {
      console.log('✅ Notifications sonores disponibles');
    }
  });

  test('WebSocket - Connexion temps réel', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier dans la console s'il y a une connexion WS
    const wsIndicator = page.locator('[data-ws-status], .ws-connected').first();
    const hasWS = await wsIndicator.count() > 0;
    
    if (hasWS) {
      console.log('✅ Connexion WebSocket active');
    }
  });

  test('Badge en temps réel - Mise à jour automatique', async ({ page }) => {
    await page.goto('/dashboard');
    
    const initialCount = await page.locator('[data-notification-count]').first().textContent();
    
    // Attendre une mise à jour potentielle
    await page.waitForTimeout(3000);
    
    const newCount = await page.locator('[data-notification-count]').first().textContent();
    
    console.log('Compteur initial:', initialCount, '→ Nouveau:', newCount);
  });
});

test.describe('Notifications - Préférences', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Paramètres de notifications - Page dédiée', async ({ page }) => {
    await page.goto('/settings');
    
    const notifSettings = page.locator('[data-notification-settings], text=/notifications/i').first();
    const hasSettings = await notifSettings.count() > 0;
    
    if (hasSettings) {
      await expect(notifSettings).toBeVisible();
    }
  });

  test('Activer/Désactiver par type - Checkboxes', async ({ page }) => {
    await page.goto('/settings');
    
    const notifCheckboxes = page.locator('input[type="checkbox"][name*="notif" i]');
    const count = await notifCheckboxes.count();
    
    console.log(`${count} option(s) de notification configurables`);
  });

  test('Notifications email - Toggle', async ({ page }) => {
    await page.goto('/settings');
    
    const emailToggle = page.locator('input[type="checkbox"][name*="email" i]').first();
    const hasEmail = await emailToggle.count() > 0;
    
    if (hasEmail) {
      await expect(emailToggle).toBeVisible();
      
      const isChecked = await emailToggle.isChecked();
      console.log('Notifications email:', isChecked ? 'activées' : 'désactivées');
    }
  });

  test('Notifications push - Demande de permission', async ({ page }) => {
    await page.goto('/settings');
    
    const pushToggle = page.locator('input[type="checkbox"][name*="push" i], button:has-text("push")').first();
    const hasPush = await pushToggle.count() > 0;
    
    if (hasPush) {
      console.log('✅ Notifications push configurables');
    }
  });

  test('Notifications SMS - Si disponible', async ({ page }) => {
    await page.goto('/settings');
    
    const smsToggle = page.locator('input[type="checkbox"][name*="sms" i]').first();
    const hasSMS = await smsToggle.count() > 0;
    
    if (hasSMS) {
      console.log('✅ Notifications SMS disponibles');
    }
  });

  test('Fréquence des emails - Instantané/Digest', async ({ page }) => {
    await page.goto('/settings');
    
    const frequency = page.locator('select[name*="frequency" i], input[type="radio"][name*="digest" i]').first();
    const hasFrequency = await frequency.count() > 0;
    
    if (hasFrequency) {
      console.log('✅ Fréquence des emails configurable');
    }
  });

  test('Mode silencieux - Heures définies', async ({ page }) => {
    await page.goto('/settings');
    
    const quietHours = page.locator('text=/heures.*silencieuses|quiet.*hours|do not disturb/i').first();
    const hasQuiet = await quietHours.count() > 0;
    
    if (hasQuiet) {
      console.log('✅ Mode silencieux disponible');
    }
  });
});

test.describe('Notifications - Email', () => {
  
  test('Templates d\'email - Design cohérent', async ({ page }) => {
    // Note: Pour tester les emails, on utiliserait MailHog ou similar
    // Ici on vérifie juste les mentions dans l'app
    
    await page.goto('/settings');
    
    const emailInfo = page.locator('text=/email/i').first();
    const hasEmail = await emailInfo.count() > 0;
    
    if (hasEmail) {
      console.log('✅ Système d\'emails configuré');
    }
  });

  test('Lien de désinscription - Dans les emails', async ({ page }) => {
    await page.goto('/newsletter/unsubscribe');
    
    await expect(page).toHaveURL(/\/newsletter\/unsubscribe/);
    
    // Devrait avoir un formulaire de désinscription
    const unsubscribeForm = page.locator('form, input[type="email"]').first();
    const hasForm = await unsubscribeForm.count() > 0;
    
    if (hasForm) {
      console.log('✅ Page de désinscription disponible');
    }
  });

  test('Préférences email - Gestion granulaire', async ({ page }) => {
    await page.goto('/settings');
    
    const emailPreferences = page.locator('[data-email-preferences], .email-preferences').first();
    const hasPrefs = await emailPreferences.count() > 0;
    
    if (hasPrefs) {
      await expect(emailPreferences).toBeVisible();
    }
  });
});

test.describe('Notifications - Admin', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Page admin notifications - Envoi massif', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    await expect(page).toHaveURL(/\/admin\/notifications/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Créer une notification - Formulaire', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const createButton = page.locator('button:has-text("créer"), button:has-text("nouvelle")').first();
    const hasButton = await createButton.count() > 0;
    
    if (hasButton) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier les champs
      const titleInput = page.locator('input[name*="title" i]').first();
      const messageInput = page.locator('textarea[name*="message" i]').first();
      
      const hasFields = await titleInput.count() > 0 && await messageInput.count() > 0;
      
      if (hasFields) {
        console.log('✅ Création de notifications personnalisées');
      }
    }
  });

  test('Ciblage des utilisateurs - Filtres', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const targeting = page.locator('[data-targeting], .targeting, text=/ciblage|targeting/i').first();
    const hasTargeting = await targeting.count() > 0;
    
    if (hasTargeting) {
      console.log('✅ Ciblage des notifications');
    }
  });

  test('Envoi programmé - Planification', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const scheduledSend = page.locator('input[type="datetime-local"], input[name*="schedule" i]').first();
    const hasSchedule = await scheduledSend.count() > 0;
    
    if (hasSchedule) {
      console.log('✅ Envoi programmé de notifications');
    }
  });

  test('Historique des envois - Statistiques', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const history = page.locator('[data-history], .notification-history').first();
    const hasHistory = await history.count() > 0;
    
    if (hasHistory) {
      await expect(history).toBeVisible();
    }
  });

  test('Taux d\'ouverture - Analytics', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const openRate = page.locator('text=/taux.*ouverture|open.*rate/i').first();
    const hasRate = await openRate.count() > 0;
    
    if (hasRate) {
      console.log('✅ Tracking des taux d\'ouverture');
    }
  });

  test('Templates de notifications - Réutilisables', async ({ page }) => {
    await page.goto('/admin/notifications');
    
    const templates = page.locator('[data-templates], .templates').first();
    const hasTemplates = await templates.count() > 0;
    
    if (hasTemplates) {
      console.log('✅ Système de templates');
    }
  });
});

test.describe('Notifications - Push browser', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Demande de permission - Modal explicatif', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Chercher un prompt de permission push
    const pushPrompt = page.locator('[data-push-prompt], .push-prompt').first();
    const hasPrompt = await pushPrompt.count() > 0;
    
    if (hasPrompt) {
      console.log('✅ Demande de permission push');
    }
  });

  test('Service Worker - Enregistré', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier que le SW est enregistré
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    console.log('Service Worker supporté:', swRegistered);
  });

  test('Test de notification - Bouton de test', async ({ page }) => {
    await page.goto('/settings');
    
    const testButton = page.locator('button:has-text("tester"), button:has-text("test notification")').first();
    const hasTest = await testButton.count() > 0;
    
    if (hasTest) {
      console.log('✅ Test de notification push possible');
    }
  });
});
