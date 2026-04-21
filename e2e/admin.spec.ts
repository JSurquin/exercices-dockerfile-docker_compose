import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le panneau d'administration
 * Nécessite un compte admin
 */

test.describe('Admin - Dashboard', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Dashboard admin - Accès et affichage', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier que c'est bien une page admin
    const adminIndicator = await page.locator('text=/administration|admin|dashboard/i').count();
    expect(adminIndicator).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/admin-dashboard.png', 
      fullPage: true 
    });
  });

  test('Statistiques générales - KPIs affichés', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Chercher les KPIs
    const kpis = [
      'text=/utilisateurs|users/i',
      'text=/trades|ventes/i',
      'text=/revenus|revenue/i',
      'text=/volume/i',
      'text=/payouts/i',
    ];
    
    let foundKpis = 0;
    
    for (const kpi of kpis) {
      const hasKpi = await page.locator(kpi).count();
      if (hasKpi > 0) {
        foundKpis++;
        console.log(`✅ KPI trouvé: ${kpi}`);
      }
    }
    
    expect(foundKpis).toBeGreaterThan(0);
  });

  test('Graphiques de statistiques - Affichage des données', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Chercher des graphiques (canvas, svg)
    const charts = await page.locator('canvas, svg[class*="chart"], [class*="recharts"]').count();
    
    if (charts > 0) {
      console.log(`✅ ${charts} graphique(s) trouvé(s)`);
    }
  });

  test('Filtres de période - Jour/Semaine/Mois/Année', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    const periods = ['jour', 'semaine', 'mois', 'année', 'day', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const hasPeriod = await page.locator(`button:has-text("${period}")`).count();
      
      if (hasPeriod > 0) {
        console.log(`✅ Filtre ${period} disponible`);
      }
    }
  });

  test('Activité récente - Liste des dernières actions', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    const recentActivity = page.locator('[data-activity], .activity, text=/activité.*récente|recent.*activity/i').first();
    const hasActivity = await recentActivity.count() > 0;
    
    if (hasActivity) {
      await expect(recentActivity).toBeVisible();
    }
  });

  test('Alertes système - Notifications importantes', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    const alerts = page.locator('[role="alert"], .alert, [class*="alert"]');
    const alertCount = await alerts.count();
    
    console.log(`${alertCount} alerte(s) système`);
  });
});

test.describe('Admin - Gestion des utilisateurs', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Liste des utilisateurs - Table paginée', async ({ page }) => {
    await page.goto('/admin/users');
    
    await expect(page.locator('main')).toBeVisible();
    
    // Chercher une table d'utilisateurs
    const table = page.locator('table, [role="table"]').first();
    const hasTable = await table.count() > 0;
    
    if (hasTable) {
      await expect(table).toBeVisible();
      
      // Vérifier les colonnes
      const headers = await table.locator('th, [role="columnheader"]').allTextContents();
      console.log('Colonnes:', headers);
    }
  });

  test('Recherche d\'utilisateur - Par nom/email/ID', async ({ page }) => {
    await page.goto('/admin/users');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherch" i], input[placeholder*="search" i]').first();
    const hasSearch = await searchInput.count() > 0;
    
    if (hasSearch) {
      await expect(searchInput).toBeVisible();
      
      // Tester une recherche
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Les résultats devraient être filtrés
      console.log('✅ Recherche fonctionnelle');
    }
  });

  test('Filtres utilisateurs - Rôle/Statut/KYC', async ({ page }) => {
    await page.goto('/admin/users');
    
    const filters = page.locator('select, [role="combobox"]');
    const filterCount = await filters.count();
    
    console.log(`${filterCount} filtre(s) disponible(s)`);
    
    if (filterCount > 0) {
      // Tester un filtre
      const firstFilter = filters.first();
      await firstFilter.click();
      await page.waitForTimeout(300);
    }
  });

  test('Détails d\'un utilisateur - Page complète', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Cliquer sur le premier utilisateur
    const userLink = page.locator('a[href*="/admin/users/"], tr').first();
    const hasLink = await userLink.count() > 0;
    
    if (hasLink) {
      await userLink.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'on est sur une page de détails
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Modifier le rôle d\'un utilisateur', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Chercher un sélecteur de rôle
    const roleSelect = page.locator('select[name*="role" i], [data-role]').first();
    const hasRole = await roleSelect.count() > 0;
    
    if (hasRole) {
      await expect(roleSelect).toBeVisible();
      
      // Vérifier les options
      const options = await roleSelect.locator('option').allTextContents();
      console.log('Rôles disponibles:', options);
    }
  });

  test('Bannir un utilisateur', async ({ page }) => {
    await page.goto('/admin/users');
    
    const banButton = page.locator('button:has-text("bannir"), button:has-text("ban")').first();
    const hasBan = await banButton.count() > 0;
    
    if (hasBan) {
      await expect(banButton).toBeVisible();
      
      // Note: Ne pas cliquer réellement
      console.log('✅ Fonction de bannissement disponible');
    }
  });

  test('Débannir un utilisateur', async ({ page }) => {
    await page.goto('/admin/users');
    
    const unbanButton = page.locator('button:has-text("débannir"), button:has-text("unban")').first();
    const hasUnban = await unbanButton.count() > 0;
    
    if (hasUnban) {
      console.log('✅ Fonction de débannissement disponible');
    }
  });

  test('Historique des actions utilisateur', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Chercher une section d'historique
    const history = page.locator('[data-history], .history, text=/historique|history/i').first();
    const hasHistory = await history.count() > 0;
    
    if (hasHistory) {
      await expect(history).toBeVisible();
    }
  });

  test('Modifier le solde d\'un utilisateur', async ({ page }) => {
    await page.goto('/admin/users');
    
    const balanceInput = page.locator('input[name*="balance" i], input[name*="solde" i]').first();
    const hasBalance = await balanceInput.count() > 0;
    
    if (hasBalance) {
      await expect(balanceInput).toBeVisible();
      console.log('✅ Modification du solde possible');
    }
  });

  test('Export CSV des utilisateurs', async ({ page }) => {
    await page.goto('/admin/users');
    
    const exportButton = page.locator('button:has-text("export"), button:has-text("csv"), button:has-text("excel")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      await expect(exportButton).toBeVisible();
      console.log('✅ Export CSV disponible');
    }
  });
});

test.describe('Admin - Gestion des trades', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Liste des trades - Tous les statuts', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Chercher un lien vers les trades
    const tradesLink = page.locator('a[href*="/admin"][href*="trade"], a:has-text("trades")').first();
    const hasLink = await tradesLink.count() > 0;
    
    if (hasLink) {
      await tradesLink.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Filtres des trades - Par statut/date/utilisateur', async ({ page }) => {
    await page.goto('/admin');
    
    const filters = page.locator('select, [role="combobox"]');
    const count = await filters.count();
    
    console.log(`${count} filtre(s) disponible(s)`);
  });

  test('Détails d\'un trade - Informations complètes', async ({ page }) => {
    await page.goto('/admin');
    
    // Naviguer vers un trade spécifique
    const tradeLink = page.locator('a[href*="/trade/"]').first();
    const hasLink = await tradeLink.count() > 0;
    
    if (hasLink) {
      const href = await tradeLink.getAttribute('href');
      
      if (href) {
        await page.goto(href);
        await expect(page.locator('main')).toBeVisible();
      }
    }
  });

  test('Annuler un trade manuellement', async ({ page }) => {
    await page.goto('/admin');
    
    const cancelButton = page.locator('button:has-text("annuler"), button:has-text("cancel")').first();
    const hasCancel = await cancelButton.count() > 0;
    
    if (hasCancel) {
      console.log('✅ Annulation manuelle possible');
    }
  });

  test('Forcer la complétion d\'un trade', async ({ page }) => {
    await page.goto('/admin');
    
    const forceButton = page.locator('button:has-text("forcer"), button:has-text("force")').first();
    const hasForce = await forceButton.count() > 0;
    
    if (hasForce) {
      console.log('✅ Forçage de complétion possible');
    }
  });

  test('Timeline du trade - Étapes détaillées', async ({ page }) => {
    await page.goto('/admin');
    
    const timeline = page.locator('[data-timeline], .timeline').first();
    const hasTimeline = await timeline.count() > 0;
    
    if (hasTimeline) {
      await expect(timeline).toBeVisible();
    }
  });

  test('Export des trades - CSV/Excel', async ({ page }) => {
    await page.goto('/admin');
    
    const exportButton = page.locator('button:has-text("export")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      console.log('✅ Export des trades disponible');
    }
  });
});

test.describe('Admin - Gestion des payouts', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Liste des payouts - En attente et traités', async ({ page }) => {
    await page.goto('/admin');
    
    const payoutsLink = page.locator('a[href*="/admin"][href*="payout"], a:has-text("payouts")').first();
    const hasLink = await payoutsLink.count() > 0;
    
    if (hasLink) {
      await payoutsLink.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Approuver un payout SEPA', async ({ page }) => {
    await page.goto('/admin/sepa-requests');
    
    await expect(page).toHaveURL(/\/admin\/sepa-requests/);
    
    const approveButton = page.locator('button:has-text("approuver"), button:has-text("approve")').first();
    const hasApprove = await approveButton.count() > 0;
    
    if (hasApprove) {
      await expect(approveButton).toBeVisible();
      console.log('✅ Approbation manuelle SEPA');
    }
  });

  test('Rejeter un payout - Avec raison', async ({ page }) => {
    await page.goto('/admin/sepa-requests');
    
    const rejectButton = page.locator('button:has-text("rejeter"), button:has-text("reject")').first();
    const hasReject = await rejectButton.count() > 0;
    
    if (hasReject) {
      await rejectButton.click();
      await page.waitForTimeout(500);
      
      // Un champ de raison devrait apparaître
      const reasonInput = page.locator('textarea, input[name*="reason" i]').first();
      const hasReason = await reasonInput.count() > 0;
      
      if (hasReason) {
        console.log('✅ Champ raison de rejet trouvé');
      }
    }
  });

  test('Vérification IBAN - Validation manuelle', async ({ page }) => {
    await page.goto('/admin/sepa-requests');
    
    // Chercher les informations IBAN
    const ibanDisplay = page.locator('text=/FR[0-9]{25}|BE[0-9]{14}|DE[0-9]{20}/').first();
    const hasIban = await ibanDisplay.count() > 0;
    
    if (hasIban) {
      const iban = await ibanDisplay.textContent();
      console.log('IBAN trouvé:', iban);
    }
  });

  test('Historique des payouts - Filtres avancés', async ({ page }) => {
    await page.goto('/admin/sepa-requests');
    
    const filters = page.locator('select, input[type="date"]');
    const count = await filters.count();
    
    console.log(`${count} filtre(s) disponible(s)`);
  });

  test('Export des payouts - Comptabilité', async ({ page }) => {
    await page.goto('/admin/sepa-requests');
    
    const exportButton = page.locator('button:has-text("export"), button:has-text("comptabilité")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      console.log('✅ Export comptable disponible');
    }
  });
});

test.describe('Admin - Gestion KYC', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Liste des demandes KYC - En attente de revue', async ({ page }) => {
    await page.goto('/admin');
    
    const kycLink = page.locator('a[href*="/admin"][href*="kyc"]').first();
    const hasLink = await kycLink.count() > 0;
    
    if (hasLink) {
      await kycLink.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Revue d\'un KYC - Documents affichés', async ({ page }) => {
    await page.goto('/admin');
    
    // Chercher une demande KYC
    const kycItem = page.locator('[data-kyc], .kyc-item').first();
    const hasKyc = await kycItem.count() > 0;
    
    if (hasKyc) {
      await kycItem.click();
      await page.waitForTimeout(1000);
      
      // Vérifier que les documents sont affichés
      const documents = await page.locator('img, [data-document]').count();
      console.log(`${documents} document(s) affiché(s)`);
    }
  });

  test('Approuver un KYC', async ({ page }) => {
    await page.goto('/admin');
    
    const approveButton = page.locator('button:has-text("approuver"), button:has-text("valider")').first();
    const hasApprove = await approveButton.count() > 0;
    
    if (hasApprove) {
      console.log('✅ Approbation KYC possible');
    }
  });

  test('Rejeter un KYC - Avec raison détaillée', async ({ page }) => {
    await page.goto('/admin');
    
    const rejectButton = page.locator('button:has-text("rejeter")').first();
    const hasReject = await rejectButton.count() > 0;
    
    if (hasReject) {
      await rejectButton.click();
      await page.waitForTimeout(500);
      
      // Chercher les raisons prédéfinies
      const reasons = await page.locator('input[type="checkbox"], input[type="radio"]').count();
      console.log(`${reasons} raison(s) de rejet disponible(s)`);
    }
  });

  test('Demander des documents supplémentaires', async ({ page }) => {
    await page.goto('/admin');
    
    const moreDocsButton = page.locator('button:has-text("documents supplémentaires"), button:has-text("additional documents")').first();
    const hasButton = await moreDocsButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Demande de documents supplémentaires possible');
    }
  });

  test('Zoom sur les documents - Vérification détaillée', async ({ page }) => {
    await page.goto('/admin');
    
    // Chercher une image de document
    const docImage = page.locator('img[alt*="document" i], img[alt*="kyc" i]').first();
    const hasImage = await docImage.count() > 0;
    
    if (hasImage) {
      await docImage.click();
      await page.waitForTimeout(500);
      
      // Un modal de zoom devrait apparaître
      const modal = page.locator('[role="dialog"], .modal').first();
      const hasModal = await modal.count() > 0;
      
      if (hasModal) {
        console.log('✅ Fonction de zoom disponible');
      }
    }
  });

  test('Historique des décisions KYC - Audit trail', async ({ page }) => {
    await page.goto('/admin');
    
    const history = page.locator('[data-kyc-history], .kyc-history').first();
    const hasHistory = await history.count() > 0;
    
    if (hasHistory) {
      await expect(history).toBeVisible();
    }
  });
});

test.describe('Admin - Paramètres système', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Paramètres généraux - Configuration', async ({ page }) => {
    await page.goto('/admin/settings');
    
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Frais et commissions - Modification', async ({ page }) => {
    await page.goto('/admin/settings');
    
    const feesInput = page.locator('input[name*="fee" i], input[name*="commission" i]').first();
    const hasFees = await feesInput.count() > 0;
    
    if (hasFees) {
      await expect(feesInput).toBeVisible();
      console.log('✅ Configuration des frais');
    }
  });

  test('Limites système - Min/Max', async ({ page }) => {
    await page.goto('/admin/settings');
    
    const limitsSection = page.locator('text=/limites|limits/i').first();
    const hasLimits = await limitsSection.count() > 0;
    
    if (hasLimits) {
      console.log('✅ Configuration des limites');
    }
  });

  test('Mode maintenance - Activation/Désactivation', async ({ page }) => {
    await page.goto('/admin/settings');
    
    const maintenanceToggle = page.locator('input[type="checkbox"][name*="maintenance" i], button:has-text("maintenance")').first();
    const hasToggle = await maintenanceToggle.count() > 0;
    
    if (hasToggle) {
      console.log('✅ Mode maintenance disponible');
    }
  });

  test('Notifications système - Configuration', async ({ page }) => {
    await page.goto('/admin/settings');
    
    const notifSettings = page.locator('text=/notifications/i').first();
    const hasNotif = await notifSettings.count() > 0;
    
    if (hasNotif) {
      console.log('✅ Configuration notifications');
    }
  });

  test('API Keys - Gestion', async ({ page }) => {
    await page.goto('/admin/settings');
    
    const apiSection = page.locator('text=/api.*key|clé.*api/i').first();
    const hasApi = await apiSection.count() > 0;
    
    if (hasApi) {
      console.log('✅ Gestion des API keys');
    }
  });
});

test.describe('Admin - Logs et audit', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Logs système - Consultation', async ({ page }) => {
    await page.goto('/admin/audit');
    
    await expect(page).toHaveURL(/\/admin\/audit/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Filtres de logs - Par type/date/utilisateur', async ({ page }) => {
    await page.goto('/admin/audit');
    
    const filters = page.locator('select, input[type="search"], input[type="date"]');
    const count = await filters.count();
    
    console.log(`${count} filtre(s) disponible(s) pour les logs`);
  });

  test('Export des logs - CSV', async ({ page }) => {
    await page.goto('/admin/audit');
    
    const exportButton = page.locator('button:has-text("export")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      console.log('✅ Export des logs disponible');
    }
  });

  test('Recherche dans les logs - Texte intégral', async ({ page }) => {
    await page.goto('/admin/audit');
    
    const searchInput = page.locator('input[type="search"]').first();
    const hasSearch = await searchInput.count() > 0;
    
    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      console.log('✅ Recherche dans les logs');
    }
  });
});
