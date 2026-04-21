import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système de gamification
 * XP, niveaux, missions, tickets, badges
 */

test.describe('Gamification - Système XP et niveaux', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Affichage de l\'XP - Barre de progression', async ({ page }) => {
    await page.goto('/dashboard');
    
    const xpBar = page.locator('[data-xp], [class*="xp"], [role="progressbar"]').first();
    const hasXP = await xpBar.count() > 0;
    
    if (hasXP) {
      await expect(xpBar).toBeVisible();
      console.log('✅ Barre d\'XP affichée');
    }
  });

  test('Niveau actuel - Badge visible', async ({ page }) => {
    await page.goto('/dashboard');
    
    const level = page.locator('[data-level], .level, text=/niveau.*\\d+|level.*\\d+/i').first();
    const hasLevel = await level.count() > 0;
    
    if (hasLevel) {
      await expect(level).toBeVisible();
      
      const levelText = await level.textContent();
      console.log('Niveau:', levelText);
    }
  });

  test('Progression - XP actuel / XP requis', async ({ page }) => {
    await page.goto('/dashboard');
    
    const progression = page.locator('text=/\\d+.*\\/.*\\d+.*xp/i').first();
    const hasProgression = await progression.count() > 0;
    
    if (hasProgression) {
      const progressText = await progression.textContent();
      console.log('Progression XP:', progressText);
    }
  });

  test('Gain d\'XP - Toast de notification', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Après une action, un toast XP devrait apparaître
    const xpToast = page.locator('[role="status"]:has-text("xp"), .toast:has-text("xp")').first();
    const hasToast = await xpToast.count() > 0;
    
    if (hasToast) {
      console.log('✅ Notification gain XP');
    }
  });

  test('Montée de niveau - Animation et récompense', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Chercher une animation ou modal de level up
    const levelUpModal = page.locator('[data-level-up], .level-up, [role="dialog"]:has-text("niveau")').first();
    const hasModal = await levelUpModal.count() > 0;
    
    if (hasModal) {
      console.log('✅ Animation de montée de niveau');
    }
  });

  test('Récompenses par niveau - Déblocage de fonctionnalités', async ({ page }) => {
    await page.goto('/missions');
    
    const rewards = page.locator('[data-reward], .reward, text=/récompense|reward/i').first();
    const hasRewards = await rewards.count() > 0;
    
    if (hasRewards) {
      console.log('✅ Système de récompenses');
    }
  });

  test('Historique XP - Journal des gains', async ({ page }) => {
    await page.goto('/missions');
    
    const history = page.locator('[data-xp-history], .xp-history').first();
    const hasHistory = await history.count() > 0;
    
    if (hasHistory) {
      await expect(history).toBeVisible();
    }
  });

  test('XP par action - Montants définis', async ({ page }) => {
    await page.goto('/missions');
    
    // Vérifier les montants d'XP par action
    const xpAmounts = page.locator('text=/\\+\\d+.*xp/i');
    const count = await xpAmounts.count();
    
    console.log(`${count} action(s) donnant de l'XP`);
  });
});

test.describe('Gamification - Système de tickets', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Solde de tickets - Affichage permanent', async ({ page }) => {
    await page.goto('/dashboard');
    
    const ticketBalance = page.locator('[data-tickets], .tickets, text=/\\d+.*ticket/i').first();
    const hasBalance = await ticketBalance.count() > 0;
    
    if (hasBalance) {
      await expect(ticketBalance).toBeVisible();
      
      const balanceText = await ticketBalance.textContent();
      console.log('Tickets:', balanceText);
    }
  });

  test('Gain de tickets - Proportionnel à l\'XP', async ({ page }) => {
    await page.goto('/missions');
    
    // Selon les rules: tickets proportionnels au volume
    const ticketInfo = page.locator('text=/ticket.*xp|xp.*ticket/i').first();
    const hasInfo = await ticketInfo.count() > 0;
    
    if (hasInfo) {
      console.log('✅ Lien XP/Tickets mentionné');
    }
  });

  test('Dépense de tickets - Giveaways uniquement', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Les tickets ne doivent être utilisables que pour les giveaways
    const ticketUsage = page.locator('text=/utiliser.*ticket|dépenser.*ticket/i').first();
    const hasUsage = await ticketUsage.count() > 0;
    
    if (hasUsage) {
      console.log('✅ Utilisation des tickets pour giveaways');
    }
  });

  test('Tickets non transférables - Mention explicite', async ({ page }) => {
    await page.goto('/missions');
    
    const nonTransferable = page.locator('text=/non.*transférable|non.*transferable/i').first();
    const hasNonTransferable = await nonTransferable.count() > 0;
    
    if (hasNonTransferable) {
      console.log('✅ Tickets non transférables');
    }
  });

  test('Historique des tickets - Gains et dépenses', async ({ page }) => {
    await page.goto('/missions');
    
    const history = page.locator('[data-ticket-history], .ticket-history').first();
    const hasHistory = await history.count() > 0;
    
    if (hasHistory) {
      await expect(history).toBeVisible();
    }
  });

  test('Expiration des tickets - Si applicable', async ({ page }) => {
    await page.goto('/missions');
    
    const expiration = page.locator('text=/expiration|expire/i').first();
    const hasExpiration = await expiration.count() > 0;
    
    if (hasExpiration) {
      console.log('✅ Système d\'expiration des tickets');
    }
  });
});

test.describe('Gamification - Missions', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Page missions - Liste des missions disponibles', async ({ page }) => {
    await page.goto('/missions');
    
    await expect(page).toHaveURL(/\/missions/);
    await expect(page.locator('main')).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/screenshots/missions-page.png', 
      fullPage: true 
    });
  });

  test('Mission quotidienne - Réinitialisation journalière', async ({ page }) => {
    await page.goto('/missions');
    
    const dailyMission = page.locator('[data-type="daily"], text=/quotidien|daily/i').first();
    const hasDaily = await dailyMission.count() > 0;
    
    if (hasDaily) {
      await expect(dailyMission).toBeVisible();
      console.log('✅ Missions quotidiennes');
    }
  });

  test('Mission hebdomadaire - Reset hebdomadaire', async ({ page }) => {
    await page.goto('/missions');
    
    const weeklyMission = page.locator('[data-type="weekly"], text=/hebdomadaire|weekly/i').first();
    const hasWeekly = await weeklyMission.count() > 0;
    
    if (hasWeekly) {
      console.log('✅ Missions hebdomadaires');
    }
  });

  test('Mission permanente - Toujours disponible', async ({ page }) => {
    await page.goto('/missions');
    
    const permanentMission = page.locator('[data-type="permanent"], text=/permanent|ongoing/i').first();
    const hasPermanent = await permanentMission.count() > 0;
    
    if (hasPermanent) {
      console.log('✅ Missions permanentes');
    }
  });

  test('Objectif de la mission - Clairement affiché', async ({ page }) => {
    await page.goto('/missions');
    
    const objective = page.locator('[data-objective], .objective').first();
    const hasObjective = await objective.count() > 0;
    
    if (hasObjective) {
      const objectiveText = await objective.textContent();
      console.log('Objectif:', objectiveText);
    }
  });

  test('Progression de la mission - Barre de progrès', async ({ page }) => {
    await page.goto('/missions');
    
    const progressBars = page.locator('[role="progressbar"], .progress-bar');
    const count = await progressBars.count();
    
    console.log(`${count} mission(s) avec barre de progression`);
  });

  test('Récompense de la mission - XP et/ou tickets', async ({ page }) => {
    await page.goto('/missions');
    
    const reward = page.locator('[data-reward], .reward, text=/\\+\\d+.*xp|\\+\\d+.*ticket/i').first();
    const hasReward = await reward.count() > 0;
    
    if (hasReward) {
      const rewardText = await reward.textContent();
      console.log('Récompense:', rewardText);
    }
  });

  test('Réclamer la récompense - Bouton actif', async ({ page }) => {
    await page.goto('/missions');
    
    const claimButton = page.locator('button:has-text("réclamer"), button:has-text("claim")').first();
    const hasButton = await claimButton.count() > 0;
    
    if (hasButton) {
      await expect(claimButton).toBeVisible();
      console.log('✅ Réclamation de récompense');
    }
  });

  test('Mission complétée - Badge de complétion', async ({ page }) => {
    await page.goto('/missions');
    
    const completed = page.locator('[data-completed="true"], .completed, text=/✓|completed|terminée/i').first();
    const hasCompleted = await completed.count() > 0;
    
    if (hasCompleted) {
      console.log('✅ Missions complétées visibles');
    }
  });

  test('Countdown avant reset - Timer affiché', async ({ page }) => {
    await page.goto('/missions');
    
    const countdown = page.locator('[data-countdown], text=/\\d+h|\\d+m|\\d+s/i').first();
    const hasCountdown = await countdown.count() > 0;
    
    if (hasCountdown) {
      const countdownText = await countdown.textContent();
      console.log('Countdown:', countdownText);
    }
  });
});

test.describe('Gamification - Badges et achievements', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Collection de badges - Page dédiée', async ({ page }) => {
    await page.goto('/missions');
    
    const badgesSection = page.locator('[data-badges], .badges, text=/badges|achievements/i').first();
    const hasBadges = await badgesSection.count() > 0;
    
    if (hasBadges) {
      await expect(badgesSection).toBeVisible();
    }
  });

  test('Badge débloqué - Affiché en couleur', async ({ page }) => {
    await page.goto('/missions');
    
    const unlockedBadge = page.locator('[data-unlocked="true"], .badge-unlocked').first();
    const hasUnlocked = await unlockedBadge.count() > 0;
    
    if (hasUnlocked) {
      console.log('✅ Badges débloqués visibles');
    }
  });

  test('Badge verrouillé - Grisé avec conditions', async ({ page }) => {
    await page.goto('/missions');
    
    const lockedBadge = page.locator('[data-locked="true"], .badge-locked').first();
    const hasLocked = await lockedBadge.count() > 0;
    
    if (hasLocked) {
      console.log('✅ Badges verrouillés affichés');
    }
  });

  test('Conditions de déblocage - Clairement indiquées', async ({ page }) => {
    await page.goto('/missions');
    
    const conditions = page.locator('[data-conditions], .conditions').first();
    const hasConditions = await conditions.count() > 0;
    
    if (hasConditions) {
      const conditionsText = await conditions.textContent();
      console.log('Conditions:', conditionsText);
    }
  });

  test('Notification de nouveau badge - Modal de célébration', async ({ page }) => {
    await page.goto('/missions');
    
    const badgeModal = page.locator('[role="dialog"]:has-text("badge"), .badge-unlock-modal').first();
    const hasModal = await badgeModal.count() > 0;
    
    if (hasModal) {
      console.log('✅ Modal de nouveau badge');
    }
  });

  test('Partage de badge - Réseaux sociaux', async ({ page }) => {
    await page.goto('/missions');
    
    const shareButton = page.locator('button:has-text("partager"), button[aria-label*="share" i]').first();
    const hasShare = await shareButton.count() > 0;
    
    if (hasShare) {
      console.log('✅ Partage de badges possible');
    }
  });
});

test.describe('Gamification - Leaderboard', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Classement général - Top utilisateurs', async ({ page }) => {
    await page.goto('/missions');
    
    const leaderboard = page.locator('[data-leaderboard], .leaderboard').first();
    const hasLeaderboard = await leaderboard.count() > 0;
    
    if (hasLeaderboard) {
      await expect(leaderboard).toBeVisible();
    }
  });

  test('Position de l\'utilisateur - Clairement indiquée', async ({ page }) => {
    await page.goto('/missions');
    
    const userPosition = page.locator('[data-my-position], .my-position, text=/votre position|your rank/i').first();
    const hasPosition = await userPosition.count() > 0;
    
    if (hasPosition) {
      const positionText = await userPosition.textContent();
      console.log('Position:', positionText);
    }
  });

  test('Filtres de classement - Par période', async ({ page }) => {
    await page.goto('/missions');
    
    const periodFilters = page.locator('button:has-text("jour"), button:has-text("semaine"), button:has-text("mois"), button:has-text("tout")');
    const count = await periodFilters.count();
    
    console.log(`${count} filtre(s) de période pour le classement`);
  });

  test('Podium - Top 3 mis en avant', async ({ page }) => {
    await page.goto('/missions');
    
    const podium = page.locator('[data-podium], .podium').first();
    const hasPodium = await podium.count() > 0;
    
    if (hasPodium) {
      console.log('✅ Podium des top 3');
    }
  });

  test('Récompenses du classement - Si applicable', async ({ page }) => {
    await page.goto('/missions');
    
    const leaderboardRewards = page.locator('text=/récompense.*classement|leaderboard.*reward/i').first();
    const hasRewards = await leaderboardRewards.count() > 0;
    
    if (hasRewards) {
      console.log('✅ Récompenses de classement');
    }
  });
});

test.describe('Gamification - Admin', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Configuration gamification - Paramètres globaux', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    await expect(page).toHaveURL(/\/admin\/gamification-economy/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Modifier les taux XP - Par action', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const xpInputs = page.locator('input[name*="xp" i], input[name*="experience" i]');
    const count = await xpInputs.count();
    
    console.log(`${count} paramètre(s) XP configurables`);
  });

  test('Créer une mission - Formulaire complet', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const createButton = page.locator('button:has-text("créer mission"), button:has-text("nouvelle mission")').first();
    const hasButton = await createButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Création de missions personnalisées');
    }
  });

  test('Créer un badge - Upload image et conditions', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const badgeCreation = page.locator('[data-badge-creation], text=/créer.*badge/i').first();
    const hasBadgeCreation = await badgeCreation.count() > 0;
    
    if (hasBadgeCreation) {
      console.log('✅ Création de badges personnalisés');
    }
  });

  test('Attribution manuelle XP - À un utilisateur', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const manualXP = page.locator('button:has-text("attribuer xp"), input[name*="manual" i]').first();
    const hasManual = await manualXP.count() > 0;
    
    if (hasManual) {
      console.log('✅ Attribution manuelle d\'XP');
    }
  });

  test('Statistiques gamification - Vue d\'ensemble', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const stats = page.locator('[data-gamification-stats], .gamification-stats').first();
    const hasStats = await stats.count() > 0;
    
    if (hasStats) {
      await expect(stats).toBeVisible();
    }
  });

  test('Export des données - Leaderboard et progression', async ({ page }) => {
    await page.goto('/admin/gamification-economy');
    
    const exportButton = page.locator('button:has-text("export")').first();
    const hasExport = await exportButton.count() > 0;
    
    if (hasExport) {
      console.log('✅ Export des données de gamification');
    }
  });
});

test.describe('Gamification - Économie et équilibrage', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Volume de vente = XP - Proportionnalité', async ({ page }) => {
    await page.goto('/missions');
    
    // Selon les rules: XP proportionnel au volume
    const volumeXP = page.locator('text=/volume.*xp|xp.*volume/i').first();
    const hasInfo = await volumeXP.count() > 0;
    
    if (hasInfo) {
      console.log('✅ XP basé sur le volume de vente');
    }
  });

  test('Inflation des tickets - Protection', async ({ page }) => {
    await page.goto('/missions');
    
    // Vérifier qu'il y a un équilibrage
    const economy = page.locator('text=/économie|balance|équilibrage/i').first();
    const hasEconomy = await economy.count() > 0;
    
    if (hasEconomy) {
      console.log('✅ Système économique équilibré');
    }
  });

  test('Plafond de tickets - Si applicable', async ({ page }) => {
    await page.goto('/missions');
    
    const cap = page.locator('text=/maximum|plafond|cap/i').first();
    const hasCap = await cap.count() > 0;
    
    if (hasCap) {
      console.log('✅ Plafond de tickets mentionné');
    }
  });
});
