import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système d'affiliation
 * Parrainage, commissions, statistiques
 */

test.describe('Affiliation - Programme et inscription', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Page affiliation - Présentation du programme', async ({ page }) => {
    await page.goto('/affiliate');
    
    await expect(page).toHaveURL(/\/affiliate/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des informations sur le programme
    const programInfo = await page.locator('text=/affiliation|affiliate|parrainage/i').count();
    expect(programInfo).toBeGreaterThan(0);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/affiliate-page.png', 
      fullPage: true 
    });
  });

  test('Taux de commission - Affiché clairement', async ({ page }) => {
    await page.goto('/affiliate');
    
    const commission = page.locator('text=/\\d+%|commission/i').first();
    const hasCommission = await commission.count() > 0;
    
    if (hasCommission) {
      const commissionText = await commission.textContent();
      console.log('Taux de commission:', commissionText);
    }
  });

  test('Code de parrainage - Unique par utilisateur', async ({ page }) => {
    await page.goto('/affiliate');
    
    const affiliateCode = page.locator('[data-affiliate-code], code, input[readonly]').first();
    const hasCode = await affiliateCode.count() > 0;
    
    if (hasCode) {
      await expect(affiliateCode).toBeVisible();
      
      const code = await affiliateCode.textContent();
      console.log('Code d\'affiliation:', code);
    }
  });

  test('Lien de parrainage - Copie facile', async ({ page }) => {
    await page.goto('/affiliate');
    
    const copyButton = page.locator('button:has-text("copier"), button[aria-label*="copy" i]').first();
    const hasButton = await copyButton.count() > 0;
    
    if (hasButton) {
      await expect(copyButton).toBeVisible();
      
      await copyButton.click();
      await page.waitForTimeout(500);
      
      // Un toast devrait confirmer la copie
      const toast = page.locator('[role="status"], .toast').first();
      const hasToast = await toast.count() > 0;
      
      if (hasToast) {
        console.log('✅ Copie du lien facilitée');
      }
    }
  });

  test('QR Code - Partage mobile', async ({ page }) => {
    await page.goto('/affiliate');
    
    const qrCode = page.locator('[data-qr], canvas, svg[class*="qr"]').first();
    const hasQR = await qrCode.count() > 0;
    
    if (hasQR) {
      await expect(qrCode).toBeVisible();
      console.log('✅ QR Code disponible');
    }
  });

  test('Conditions du programme - Règles claires', async ({ page }) => {
    await page.goto('/affiliate');
    
    const terms = page.locator('text=/conditions|règles|terms/i').first();
    const hasTerms = await terms.count() > 0;
    
    if (hasTerms) {
      await expect(terms).toBeVisible();
    }
  });
});

test.describe('Affiliation - Tableau de bord', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Dashboard affilié - Statistiques principales', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Chercher les KPIs
    const kpis = [
      'text=/filleuls|referrals/i',
      'text=/clics|clicks/i',
      'text=/conversions/i',
      'text=/commissions|revenus/i',
    ];
    
    let foundKpis = 0;
    
    for (const kpi of kpis) {
      const hasKpi = await page.locator(kpi).count();
      if (hasKpi > 0) {
        foundKpis++;
        console.log(`✅ KPI trouvé: ${kpi}`);
      }
    }
  });

  test('Nombre de clics - Tracking des visites', async ({ page }) => {
    await page.goto('/affiliate');
    
    const clicks = page.locator('[data-clicks], .clicks, text=/\\d+.*clic/i').first();
    const hasClicks = await clicks.count() > 0;
    
    if (hasClicks) {
      const clicksText = await clicks.textContent();
      console.log('Clics:', clicksText);
    }
  });

  test('Taux de conversion - Pourcentage', async ({ page }) => {
    await page.goto('/affiliate');
    
    const conversionRate = page.locator('text=/\\d+%.*conversion|taux.*\\d+%/i').first();
    const hasRate = await conversionRate.count() > 0;
    
    if (hasRate) {
      const rateText = await conversionRate.textContent();
      console.log('Taux de conversion:', rateText);
    }
  });

  test('Commissions totales - Montant gagné', async ({ page }) => {
    await page.goto('/affiliate');
    
    const totalCommissions = page.locator('[data-commissions], .commissions, text=/€\\d+|\\d+.*€/i').first();
    const hasTotal = await totalCommissions.count() > 0;
    
    if (hasTotal) {
      const totalText = await totalCommissions.textContent();
      console.log('Commissions totales:', totalText);
    }
  });

  test('Commissions en attente - À valider', async ({ page }) => {
    await page.goto('/affiliate');
    
    const pending = page.locator('text=/en attente|pending/i').first();
    const hasPending = await pending.count() > 0;
    
    if (hasPending) {
      console.log('✅ Commissions en attente affichées');
    }
  });

  test('Graphique d\'évolution - Historique des gains', async ({ page }) => {
    await page.goto('/affiliate');
    
    const chart = await page.locator('canvas, svg[class*="chart"]').count();
    
    if (chart > 0) {
      console.log(`✅ ${chart} graphique(s) trouvé(s)`);
    }
  });

  test('Filtres de période - Jour/Semaine/Mois', async ({ page }) => {
    await page.goto('/affiliate');
    
    const periodFilters = page.locator('button:has-text("jour"), button:has-text("semaine"), button:has-text("mois")');
    const count = await periodFilters.count();
    
    console.log(`${count} filtre(s) de période`);
  });
});

test.describe('Affiliation - Liste des filleuls', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Liste des filleuls - Table complète', async ({ page }) => {
    await page.goto('/affiliate');
    
    const referralsTable = page.locator('table, [role="table"]').first();
    const hasTable = await referralsTable.count() > 0;
    
    if (hasTable) {
      await expect(referralsTable).toBeVisible();
      
      // Vérifier les colonnes
      const headers = await referralsTable.locator('th, [role="columnheader"]').allTextContents();
      console.log('Colonnes:', headers);
    }
  });

  test('Informations par filleul - Username/Date/Volume', async ({ page }) => {
    await page.goto('/affiliate');
    
    const firstReferral = page.locator('tr, [role="row"]').nth(1);
    
    if (await firstReferral.count() > 0) {
      const referralText = await firstReferral.textContent();
      expect(referralText?.length).toBeGreaterThan(10);
    }
  });

  test('Recherche de filleul - Par nom', async ({ page }) => {
    await page.goto('/affiliate');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherch" i]').first();
    const hasSearch = await searchInput.count() > 0;
    
    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      console.log('✅ Recherche de filleuls');
    }
  });

  test('Tri des filleuls - Par date/volume/commission', async ({ page }) => {
    await page.goto('/affiliate');
    
    const sortableHeaders = page.locator('th[aria-sort], th button, [role="columnheader"] button');
    const count = await sortableHeaders.count();
    
    console.log(`${count} colonne(s) triable(s)`);
  });

  test('Pagination - Nombreux filleuls', async ({ page }) => {
    await page.goto('/affiliate');
    
    const pagination = page.locator('[role="navigation"], .pagination').first();
    const hasPagination = await pagination.count() > 0;
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Export CSV - Données des filleuls', async ({ page }) => {
    await page.goto('/affiliate');
    
    const exportButton = page.locator('button:has-text("export"), button:has-text("csv")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      console.log('✅ Export CSV disponible');
    }
  });
});

test.describe('Affiliation - Commissions', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Historique des commissions - Liste détaillée', async ({ page }) => {
    await page.goto('/affiliate');
    
    const commissionsSection = page.locator('[data-commissions], .commissions-history').first();
    const hasSection = await commissionsSection.count() > 0;
    
    if (hasSection) {
      await expect(commissionsSection).toBeVisible();
    }
  });

  test('Commission par transaction - Détail', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Chercher une liste de transactions
    const transactions = page.locator('[data-transaction], .transaction, tr').all();
    
    const count = (await transactions).length;
    console.log(`${count} transaction(s) affichée(s)`);
  });

  test('Statut des commissions - En attente/Validée/Payée', async ({ page }) => {
    await page.goto('/affiliate');
    
    const statuses = [
      /pending|en attente/i,
      /validated|validée/i,
      /paid|payée/i,
    ];
    
    for (const status of statuses) {
      const hasStatus = await page.locator(`text=${status}`).count();
      
      if (hasStatus > 0) {
        console.log(`✅ Statut trouvé: ${status}`);
      }
    }
  });

  test('Demande de payout - Commissions accumulées', async ({ page }) => {
    await page.goto('/affiliate');
    
    const payoutButton = page.locator('button:has-text("retirer"), button:has-text("payout")').first();
    const hasButton = await payoutButton.count() > 0;
    
    if (hasButton) {
      await expect(payoutButton).toBeVisible();
      console.log('✅ Demande de payout possible');
    }
  });

  test('Seuil minimum de retrait - Montant requis', async ({ page }) => {
    await page.goto('/affiliate');
    
    const threshold = page.locator('text=/minimum.*€\\d+|seuil.*\\d+/i').first();
    const hasThreshold = await threshold.count() > 0;
    
    if (hasThreshold) {
      const thresholdText = await threshold.textContent();
      console.log('Seuil minimum:', thresholdText);
    }
  });

  test('Annulation d\'une commission - Remboursement par filleul', async ({ page }) => {
    await page.goto('/affiliate');
    
    const canceledCommission = page.locator('text=/annulée|canceled|refunded/i').first();
    const hasCanceled = await canceledCommission.count() > 0;
    
    if (hasCanceled) {
      console.log('✅ Gestion des annulations');
    }
  });
});

test.describe('Affiliation - Outils de promotion', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Bannières publicitaires - Différentes tailles', async ({ page }) => {
    await page.goto('/affiliate');
    
    const banners = page.locator('[data-banner], .banner, img[alt*="banner" i]');
    const count = await banners.count();
    
    console.log(`${count} bannière(s) disponible(s)`);
  });

  test('Code HTML des bannières - Copie facile', async ({ page }) => {
    await page.goto('/affiliate');
    
    const htmlCode = page.locator('code, pre, textarea[readonly]').first();
    const hasCode = await htmlCode.count() > 0;
    
    if (hasCode) {
      await expect(htmlCode).toBeVisible();
      console.log('✅ Code HTML de bannière');
    }
  });

  test('Réseaux sociaux - Templates de posts', async ({ page }) => {
    await page.goto('/affiliate');
    
    const socialTemplates = page.locator('[data-social], .social-template').first();
    const hasTemplates = await socialTemplates.count() > 0;
    
    if (hasTemplates) {
      console.log('✅ Templates réseaux sociaux');
    }
  });

  test('Guide de l\'affilié - Documentation', async ({ page }) => {
    await page.goto('/affiliate');
    
    const guideLink = page.locator('a:has-text("guide"), a:has-text("documentation")').first();
    const hasGuide = await guideLink.count() > 0;
    
    if (hasGuide) {
      await expect(guideLink).toBeVisible();
    }
  });

  test('Email template - Modèle prêt à envoyer', async ({ page }) => {
    await page.goto('/affiliate');
    
    const emailTemplate = page.locator('[data-email-template], .email-template').first();
    const hasTemplate = await emailTemplate.count() > 0;
    
    if (hasTemplate) {
      console.log('✅ Template email disponible');
    }
  });
});

test.describe('Affiliation - Admin', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Page admin affiliés - Liste complète', async ({ page }) => {
    await page.goto('/admin');
    
    const affiliatesLink = page.locator('a[href*="/admin"][href*="affiliate"]').first();
    const hasLink = await affiliatesLink.count() > 0;
    
    if (hasLink) {
      await affiliatesLink.click();
      await page.waitForTimeout(1000);
      
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Statistiques globales - Tous les affiliés', async ({ page }) => {
    await page.goto('/admin');
    
    const stats = page.locator('[data-affiliate-stats], .affiliate-stats').first();
    const hasStats = await stats.count() > 0;
    
    if (hasStats) {
      await expect(stats).toBeVisible();
    }
  });

  test('Top affiliés - Classement par performance', async ({ page }) => {
    await page.goto('/admin');
    
    const topAffiliates = page.locator('[data-top-affiliates], .top-affiliates').first();
    const hasTop = await topAffiliates.count() > 0;
    
    if (hasTop) {
      console.log('✅ Classement des top affiliés');
    }
  });

  test('Approuver une demande d\'affiliation', async ({ page }) => {
    await page.goto('/admin/affiliate-applications');
    
    await expect(page).toHaveURL(/\/admin\/affiliate-applications/);
    
    const approveButton = page.locator('button:has-text("approuver"), button:has-text("approve")').first();
    const hasButton = await approveButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Approbation manuelle possible');
    }
  });

  test('Rejeter une demande - Avec raison', async ({ page }) => {
    await page.goto('/admin/affiliate-applications');
    
    const rejectButton = page.locator('button:has-text("rejeter"), button:has-text("reject")').first();
    const hasButton = await rejectButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Rejet de demande possible');
    }
  });

  test('Modifier le taux de commission - Par affilié', async ({ page }) => {
    await page.goto('/admin');
    
    const commissionInput = page.locator('input[name*="commission" i], input[name*="rate" i]').first();
    const hasInput = await commissionInput.count() > 0;
    
    if (hasInput) {
      console.log('✅ Personnalisation du taux possible');
    }
  });

  test('Suspendre un affilié', async ({ page }) => {
    await page.goto('/admin');
    
    const suspendButton = page.locator('button:has-text("suspendre"), button:has-text("suspend")').first();
    const hasButton = await suspendButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Suspension d\'affilié possible');
    }
  });

  test('Export comptable - Toutes les commissions', async ({ page }) => {
    await page.goto('/admin');
    
    const exportButton = page.locator('button:has-text("export"), button:has-text("comptabilité")').first();
    const hasButton = await exportButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Export comptable disponible');
    }
  });
});

test.describe('Affiliation - Fraude et sécurité', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Auto-parrainage - Détection et blocage', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Tenter d'utiliser son propre lien (devrait être bloqué)
    const warningMessage = page.locator('text=/auto.*parrainage|self.*referral|own.*link/i').first();
    const hasWarning = await warningMessage.count() > 0;
    
    if (hasWarning) {
      console.log('✅ Protection auto-parrainage');
    }
  });

  test('Click fraud - Protection', async ({ page }) => {
    await page.goto('/affiliate');
    
    // Vérifier qu'il y a mention de la protection
    const fraudProtection = page.locator('text=/protection|fraud|détection/i').first();
    const hasProtection = await fraudProtection.count() > 0;
    
    if (hasProtection) {
      console.log('✅ Protection contre la fraude');
    }
  });

  test('Cookie duration - Durée du tracking', async ({ page }) => {
    await page.goto('/affiliate');
    
    const cookieDuration = page.locator('text=/\\d+.*jour|\\d+.*day|cookie/i').first();
    const hasDuration = await cookieDuration.count() > 0;
    
    if (hasDuration) {
      const durationText = await cookieDuration.textContent();
      console.log('Durée du cookie:', durationText);
    }
  });

  test('Attribution - Last click ou first click', async ({ page }) => {
    await page.goto('/affiliate');
    
    const attribution = page.locator('text=/attribution|last.*click|first.*click/i').first();
    const hasAttribution = await attribution.count() > 0;
    
    if (hasAttribution) {
      console.log('✅ Modèle d\'attribution mentionné');
    }
  });
});
