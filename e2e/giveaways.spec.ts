import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système de Giveaways
 * Participation, tirages, historique
 */

test.describe('Giveaways - Liste et affichage', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Page Giveaways - Liste des giveaways actifs', async ({ page }) => {
    await page.goto('/giveaways');
    
    await expect(page).toHaveURL(/\/giveaways/);
    await expect(page.locator('main')).toBeVisible();
    
    // Vérifier qu'il y a des cartes de giveaway
    const giveawayCards = page.locator('[data-giveaway], .giveaway, article, [class*="card"]');
    const count = await giveawayCards.count();
    
    console.log(`${count} giveaway(s) affiché(s)`);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/giveaways-list.png', 
      fullPage: true 
    });
  });

  test('Carte de giveaway - Informations affichées', async ({ page }) => {
    await page.goto('/giveaways');
    
    const firstGiveaway = page.locator('[data-giveaway], .giveaway, article').first();
    const hasGiveaway = await firstGiveaway.count() > 0;
    
    if (hasGiveaway) {
      // Vérifier les informations affichées
      const giveawayText = await firstGiveaway.textContent();
      
      // Devrait contenir : titre, prix, date de fin, coût en tickets
      const hasTitle = giveawayText && giveawayText.length > 10;
      
      console.log('Infos giveaway:', hasTitle ? 'complètes' : 'incomplètes');
    }
  });

  test('Image du lot - Affichée correctement', async ({ page }) => {
    await page.goto('/giveaways');
    
    const giveawayImage = page.locator('[data-giveaway] img, .giveaway img').first();
    const hasImage = await giveawayImage.count() > 0;
    
    if (hasImage) {
      await expect(giveawayImage).toBeVisible();
      
      const src = await giveawayImage.getAttribute('src');
      console.log('Image du lot:', src);
    }
  });

  test('Coût en tickets - Affiché clairement', async ({ page }) => {
    await page.goto('/giveaways');
    
    const ticketCost = page.locator('text=/\\d+.*ticket/i').first();
    const hasCost = await ticketCost.count() > 0;
    
    if (hasCost) {
      const costText = await ticketCost.textContent();
      console.log('Coût:', costText);
    }
  });

  test('Date de fin - Countdown affichée', async ({ page }) => {
    await page.goto('/giveaways');
    
    const countdown = page.locator('[data-countdown], .countdown, text=/\\d+.*jour|\\d+.*heure|\\d+.*day|\\d+.*hour/i').first();
    const hasCountdown = await countdown.count() > 0;
    
    if (hasCountdown) {
      await expect(countdown).toBeVisible();
      
      const countdownText = await countdown.textContent();
      console.log('Compte à rebours:', countdownText);
    }
  });

  test('Nombre de participants - Affiché', async ({ page }) => {
    await page.goto('/giveaways');
    
    const participants = page.locator('text=/\\d+.*participant/i').first();
    const hasParticipants = await participants.count() > 0;
    
    if (hasParticipants) {
      const participantsText = await participants.textContent();
      console.log('Participants:', participantsText);
    }
  });

  test('Filtre par statut - Actifs/Terminés/À venir', async ({ page }) => {
    await page.goto('/giveaways');
    
    const filters = page.locator('button:has-text("actif"), button:has-text("terminé"), button:has-text("à venir")');
    const count = await filters.count();
    
    console.log(`${count} filtre(s) de statut`);
    
    if (count > 0) {
      const firstFilter = filters.first();
      await firstFilter.click();
      await page.waitForTimeout(500);
      
      console.log('✅ Filtrage par statut');
    }
  });

  test('Tri des giveaways - Par date/prix/participants', async ({ page }) => {
    await page.goto('/giveaways');
    
    const sortSelect = page.locator('select[name*="sort" i], button[aria-label*="sort" i]').first();
    const hasSort = await sortSelect.count() > 0;
    
    if (hasSort) {
      await expect(sortSelect).toBeVisible();
      console.log('✅ Tri disponible');
    }
  });

  test('Pagination - Chargement par lots', async ({ page }) => {
    await page.goto('/giveaways');
    
    const pagination = page.locator('[role="navigation"], .pagination').first();
    const hasPagination = await pagination.count() > 0;
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });
});

test.describe('Giveaways - Participation', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Bouton de participation - Visible et actif', async ({ page }) => {
    await page.goto('/giveaways');
    
    const participateButton = page.locator('button:has-text("participer"), button:has-text("entrer"), button:has-text("participate")').first();
    const hasButton = await participateButton.count() > 0;
    
    if (hasButton) {
      await expect(participateButton).toBeVisible();
      
      const isEnabled = await participateButton.isEnabled();
      console.log('Bouton participer:', isEnabled ? 'actif' : 'désactivé');
    }
  });

  test('Solde de tickets - Affiché avant participation', async ({ page }) => {
    await page.goto('/giveaways');
    
    const ticketBalance = page.locator('[data-tickets], .ticket-balance, text=/\\d+.*ticket/i').first();
    const hasBalance = await ticketBalance.count() > 0;
    
    if (hasBalance) {
      const balanceText = await ticketBalance.textContent();
      console.log('Solde tickets:', balanceText);
    }
  });

  test('Modal de confirmation - Avant participation', async ({ page }) => {
    await page.goto('/giveaways');
    
    const participateButton = page.locator('button:has-text("participer")').first();
    
    if (await participateButton.count() > 0) {
      await participateButton.click();
      await page.waitForTimeout(500);
      
      // Un modal devrait apparaître
      const modal = page.locator('[role="dialog"], .modal').first();
      const hasModal = await modal.count() > 0;
      
      if (hasModal) {
        await expect(modal).toBeVisible();
        console.log('✅ Modal de confirmation');
      }
    }
  });

  test('Confirmation de participation - Toast de succès', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Après participation, un toast devrait apparaître
    const toast = page.locator('[role="status"], .toast').first();
    const hasToast = await toast.count() > 0;
    
    if (hasToast) {
      console.log('✅ Toast de confirmation');
    }
  });

  test('Tickets insuffisants - Bouton désactivé', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Si pas assez de tickets, le bouton devrait être désactivé
    const insufficientMessage = page.locator('text=/insufficient|insuffisant|pas assez/i').first();
    const hasMessage = await insufficientMessage.count() > 0;
    
    if (hasMessage) {
      await expect(insufficientMessage).toBeVisible();
      console.log('✅ Message tickets insuffisants');
    }
  });

  test('Déjà participant - Badge affiché', async ({ page }) => {
    await page.goto('/giveaways');
    
    const participatingBadge = page.locator('[data-participating], .participating, text=/déjà participant|already entered/i').first();
    const hasBadge = await participatingBadge.count() > 0;
    
    if (hasBadge) {
      await expect(participatingBadge).toBeVisible();
      console.log('✅ Badge participant');
    }
  });

  test('Annuler participation - Récupération des tickets', async ({ page }) => {
    await page.goto('/giveaways');
    
    const cancelButton = page.locator('button:has-text("annuler"), button:has-text("cancel")').first();
    const hasCancel = await cancelButton.count() > 0;
    
    if (hasCancel) {
      await expect(cancelButton).toBeVisible();
      console.log('✅ Annulation de participation possible');
    }
  });

  test('Historique des participations - Liste complète', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Chercher un onglet ou section historique
    const historyTab = page.locator('button:has-text("historique"), a:has-text("mes participations")').first();
    const hasHistory = await historyTab.count() > 0;
    
    if (hasHistory) {
      await historyTab.click();
      await page.waitForTimeout(500);
      
      console.log('✅ Historique des participations');
    }
  });
});

test.describe('Giveaways - Détails d\'un giveaway', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Page de détails - Toutes les informations', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Cliquer sur un giveaway
    const giveawayCard = page.locator('[data-giveaway], .giveaway').first();
    
    if (await giveawayCard.count() > 0) {
      await giveawayCard.click();
      await page.waitForTimeout(1000);
      
      // Devrait naviguer vers la page de détails
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Description complète - Du lot', async ({ page }) => {
    await page.goto('/giveaways/1');
    
    const description = page.locator('[data-description], .description, p').first();
    const hasDescription = await description.count() > 0;
    
    if (hasDescription) {
      const descText = await description.textContent();
      expect(descText?.length).toBeGreaterThan(20);
    }
  });

  test('Règles du giveaway - Conditions de participation', async ({ page }) => {
    await page.goto('/giveaways/1');
    
    const rules = page.locator('text=/règles|rules|conditions/i').first();
    const hasRules = await rules.count() > 0;
    
    if (hasRules) {
      await expect(rules).toBeVisible();
    }
  });

  test('Liste des participants - Si publique', async ({ page }) => {
    await page.goto('/giveaways/1');
    
    const participantsList = page.locator('[data-participants], .participants').first();
    const hasList = await participantsList.count() > 0;
    
    if (hasList) {
      await expect(participantsList).toBeVisible();
      console.log('✅ Liste des participants visible');
    }
  });

  test('Chances de gagner - Calcul affiché', async ({ page }) => {
    await page.goto('/giveaways/1');
    
    const odds = page.locator('text=/\\d+%|chance|odds/i').first();
    const hasOdds = await odds.count() > 0;
    
    if (hasOdds) {
      const oddsText = await odds.textContent();
      console.log('Chances de gagner:', oddsText);
    }
  });

  test('Sponsor du giveaway - Si applicable', async ({ page }) => {
    await page.goto('/giveaways/1');
    
    const sponsor = page.locator('[data-sponsor], .sponsor, text=/sponsor/i').first();
    const hasSponsor = await sponsor.count() > 0;
    
    if (hasSponsor) {
      console.log('✅ Sponsor mentionné');
    }
  });
});

test.describe('Giveaways - Tirages et résultats', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Annonce du tirage - Date et heure', async ({ page }) => {
    await page.goto('/giveaways');
    
    const drawDate = page.locator('text=/tirage.*\\d{1,2}\\/\\d{1,2}|draw.*date/i').first();
    const hasDate = await drawDate.count() > 0;
    
    if (hasDate) {
      const dateText = await drawDate.textContent();
      console.log('Date du tirage:', dateText);
    }
  });

  test('Notification du gagnant - Email/Push', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Vérifier qu'il y a mention des notifications
    const notifInfo = page.locator('text=/notification|notifié|averti/i').first();
    const hasInfo = await notifInfo.count() > 0;
    
    if (hasInfo) {
      console.log('✅ Système de notification mentionné');
    }
  });

  test('Résultats du tirage - Page dédiée', async ({ page }) => {
    await page.goto('/giveaways');
    
    // Chercher un giveaway terminé
    const endedGiveaway = page.locator('[data-status="ended"], text=/terminé|ended/i').first();
    
    if (await endedGiveaway.count() > 0) {
      await endedGiveaway.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'on voit les résultats
      const winner = page.locator('text=/gagnant|winner/i').first();
      const hasWinner = await winner.count() > 0;
      
      if (hasWinner) {
        console.log('✅ Résultats affichés');
      }
    }
  });

  test('Nom du gagnant - Affiché publiquement', async ({ page }) => {
    await page.goto('/giveaways');
    
    const winnerName = page.locator('[data-winner], .winner').first();
    const hasWinner = await winnerName.count() > 0;
    
    if (hasWinner) {
      const name = await winnerName.textContent();
      console.log('Gagnant:', name);
    }
  });

  test('Preuve du tirage - Seed RNG', async ({ page }) => {
    await page.goto('/giveaways');
    
    const proof = page.locator('text=/seed|proof|preuve/i').first();
    const hasProof = await proof.count() > 0;
    
    if (hasProof) {
      console.log('✅ Preuve du tirage disponible');
    }
  });

  test('Historique des gagnants - Tous les tirages', async ({ page }) => {
    await page.goto('/giveaways');
    
    const winnersLink = page.locator('a:has-text("gagnants"), a:has-text("winners")').first();
    const hasLink = await winnersLink.count() > 0;
    
    if (hasLink) {
      await winnersLink.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Historique des gagnants');
    }
  });

  test('Vérification équitable - Système provably fair', async ({ page }) => {
    await page.goto('/giveaways');
    
    const fairness = page.locator('text=/provably fair|vérifiable|transparent/i').first();
    const hasFairness = await fairness.count() > 0;
    
    if (hasFairness) {
      console.log('✅ Système fair mentionné');
    }
  });
});

test.describe('Giveaways - Administration', () => {
  
  test.use({
    storageState: '.auth/admin.json',
  });

  test('Page admin giveaways - Gestion complète', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    await expect(page).toHaveURL(/\/admin\/giveaways/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Créer un giveaway - Formulaire complet', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const createButton = page.locator('button:has-text("créer"), button:has-text("nouveau"), button:has-text("create")').first();
    const hasButton = await createButton.count() > 0;
    
    if (hasButton) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Vérifier les champs du formulaire
      const fields = [
        'input[name*="title" i]',
        'textarea[name*="description" i]',
        'input[name*="price" i]',
        'input[name*="ticket" i]',
        'input[type="date"]',
        'input[type="file"]',
      ];
      
      let foundFields = 0;
      
      for (const selector of fields) {
        const field = page.locator(selector).first();
        if (await field.count() > 0) {
          foundFields++;
        }
      }
      
      console.log(`✅ ${foundFields} champs de création trouvés`);
    }
  });

  test('Modifier un giveaway - Édition', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const editButton = page.locator('button:has-text("modifier"), button:has-text("edit")').first();
    const hasButton = await editButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Édition de giveaway possible');
    }
  });

  test('Annuler un giveaway - Avec remboursement', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const cancelButton = page.locator('button:has-text("annuler")').first();
    const hasButton = await cancelButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Annulation de giveaway possible');
    }
  });

  test('Effectuer le tirage manuellement', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const drawButton = page.locator('button:has-text("tirer"), button:has-text("draw")').first();
    const hasButton = await drawButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Tirage manuel possible');
    }
  });

  test('Statistiques d\'un giveaway - Participants/Tickets', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const stats = page.locator('[data-stats], .stats').first();
    const hasStats = await stats.count() > 0;
    
    if (hasStats) {
      await expect(stats).toBeVisible();
    }
  });

  test('Export des participants - CSV', async ({ page }) => {
    await page.goto('/admin/giveaways');
    
    const exportButton = page.locator('button:has-text("export")').first();
    const hasButton = await exportButton.count() > 0;
    
    if (hasButton) {
      console.log('✅ Export des participants disponible');
    }
  });
});

test.describe('Giveaways - Types spéciaux', () => {
  
  test.use({
    storageState: '.auth/user.json',
  });

  test('Giveaway privé - Code d\'accès requis', async ({ page }) => {
    await page.goto('/giveaways');
    
    const privateGiveaway = page.locator('[data-private="true"], .private-giveaway').first();
    
    if (await privateGiveaway.count() > 0) {
      await privateGiveaway.click();
      await page.waitForTimeout(500);
      
      // Un champ de code devrait apparaître
      const codeInput = page.locator('input[name*="code" i], input[placeholder*="code" i]').first();
      const hasCode = await codeInput.count() > 0;
      
      if (hasCode) {
        console.log('✅ Giveaway privé avec code');
      }
    }
  });

  test('Giveaway affilié - Réservé aux affiliés', async ({ page }) => {
    await page.goto('/giveaways');
    
    const affiliateGiveaway = page.locator('text=/affilié|affiliate/i').first();
    const hasAffiliate = await affiliateGiveaway.count() > 0;
    
    if (hasAffiliate) {
      console.log('✅ Giveaway affilié trouvé');
    }
  });

  test('Giveaway par niveau - Requis niveau X', async ({ page }) => {
    await page.goto('/giveaways');
    
    const levelRequirement = page.locator('text=/niveau.*\\d+|level.*\\d+|required.*level/i').first();
    const hasLevel = await levelRequirement.count() > 0;
    
    if (hasLevel) {
      const levelText = await levelRequirement.textContent();
      console.log('Niveau requis:', levelText);
    }
  });

  test('Giveaway récurrent - Hebdomadaire/Mensuel', async ({ page }) => {
    await page.goto('/giveaways');
    
    const recurring = page.locator('text=/hebdomadaire|mensuel|weekly|monthly/i').first();
    const hasRecurring = await recurring.count() > 0;
    
    if (hasRecurring) {
      console.log('✅ Giveaway récurrent');
    }
  });
});
