# 📋 Résumé des Tests E2E

## 🎯 Tests créés

### 1. **smoke.spec.ts** - Tests de fumée (Smoke tests)
Tests rapides pour vérifier que l'application fonctionne de base.

**Ce qui est testé :**
- ✅ Application démarre
- ✅ Page d'accueil charge
- ✅ Contenu visible
- ✅ Navigation fonctionne
- ✅ Responsive (pas de débordement)
- ✅ Performance (temps de chargement)
- ✅ SEO (meta tags)
- ✅ Header/Footer présents
- ✅ Images chargent
- ✅ Pages critiques accessibles
- ✅ Gestion 404

**Lancer ces tests :**
```bash
pnpm exec playwright test smoke
```

---

### 2. **pages.logged-out.spec.ts** - Pages publiques (Déconnecté)
Tests des pages accessibles sans authentification.

**Pages testées :**
- ✅ `/` - Page d'accueil + hero section
- ✅ `/about` - À propos
- ✅ `/contact` - Contact
- ✅ `/help` - Aide
- ✅ `/press` - Presse
- ✅ `/terms` - CGU
- ✅ `/privacy` - Confidentialité
- ✅ `/mentions-legales` - Mentions légales
- ✅ `/kyc-policy` - Politique KYC
- ✅ `/aml-policy` - Politique AML
- ✅ `/skin-sale-terms` - Conditions de vente
- ✅ `/payment-cashout` - Paiements
- ✅ `/status` - Statut du service
- ✅ `/api-docs` - Documentation API
- ✅ `/login` - Page de connexion
- ✅ `/support` - Support

**Fonctionnalités testées :**
- Navigation principale
- Footer et liens légaux
- Mobile responsive
- Changement de langue FR/EN
- Changement de thème Dark/Light
- Redirections vers login pour pages protégées
- Performance et accessibilité
- SEO

**Lancer ces tests :**
```bash
pnpm test:e2e:logged-out
```

---

### 3. **pages.logged-in.spec.ts** - Pages protégées (Connecté)
Tests des pages nécessitant une authentification.

**Pages testées :**
- ✅ `/dashboard` - Tableau de bord
- ✅ `/sell` - Vendre des skins
- ✅ `/payout` - Demande de retrait
- ✅ `/settings` - Paramètres
- ✅ `/notifications` - Notifications
- ✅ `/missions` - Missions et gamification
- ✅ `/giveaways` - Giveaways
- ✅ `/affiliate` - Programme d'affiliation
- ✅ `/kyc` - Vérification d'identité
- ✅ `/two-factor` - Authentification 2FA

**Fonctionnalités testées :**
- Menu utilisateur dans header
- Navigation entre pages protégées
- Formulaire de vente (Trade Link)
- Options de payout (SEPA/Crypto)
- Paramètres utilisateur
- Affichage notifications
- Système de missions/XP
- Participation aux giveaways
- Code de parrainage
- Déconnexion
- Performance
- Responsive mobile/tablette

**Lancer ces tests :**
```bash
pnpm test:e2e:logged-in
```

⚠️ **Prérequis :** Implémenter `/api/test/auth` (voir QUICKSTART_E2E.md)

---

### 4. **pages.mobile.spec.ts** - Tests mobile et tablette
Tests spécifiques pour les appareils mobiles.

**Appareils testés :**
- 📱 iPhone SE (375x667)
- 📱 iPad (768x1024)
- 📱 Paysage / Portrait

**Ce qui est testé :**
- ✅ Affichage mobile correct
- ✅ Pas de débordement horizontal
- ✅ Menu burger fonctionnel
- ✅ Footer accessible
- ✅ Taille tactile des boutons (min 44x44px)
- ✅ Interactions tactiles
- ✅ Formulaires mobiles
- ✅ Bottom navigation bar
- ✅ Layout tablette
- ✅ Orientation paysage/portrait
- ✅ Performance réseau 3G
- ✅ Lazy loading images
- ✅ Animations réduites (prefers-reduced-motion)
- ✅ Accessibilité mobile
- ✅ Zoom possible

**Lancer ces tests :**
```bash
pnpm exec playwright test pages.mobile
```

---

## 🚀 Commandes rapides

### Lancer tous les tests
```bash
pnpm test:e2e
```

### Tests spécifiques
```bash
pnpm test:e2e:logged-out    # Pages publiques
pnpm test:e2e:logged-in     # Pages connectées
pnpm exec playwright test smoke           # Smoke tests
pnpm exec playwright test pages.mobile    # Tests mobile
```

### Mode développement
```bash
pnpm test:e2e:ui      # Interface graphique
pnpm test:e2e:debug   # Mode debug
```

### Un seul test
```bash
pnpm exec playwright test -g "nom du test"
```

### Voir les résultats
```bash
pnpm test:e2e:report  # Rapport HTML
```

---

## 📊 Couverture des tests

| Catégorie | Nombre de tests | Statut |
|-----------|----------------|--------|
| Smoke tests | ~15 | ✅ |
| Pages publiques | ~25 | ✅ |
| Pages connectées | ~20 | ⚠️ Nécessite auth |
| Mobile/Tablette | ~20 | ✅ |
| **TOTAL** | **~80 tests** | |

---

## 🔧 Configuration

### Fichiers de configuration
- `playwright.config.ts` - Configuration principale
- `e2e/auth.setup.ts` - Setup d'authentification
- `.env.test` - Variables d'environnement

### Structure des tests
```
e2e/
├── auth.setup.ts              # Setup auth
├── smoke.spec.ts              # Tests de fumée ⚡
├── pages.logged-out.spec.ts   # Pages publiques 🌐
├── pages.logged-in.spec.ts    # Pages connectées 🔐
├── pages.mobile.spec.ts       # Tests mobile 📱
└── README.md                  # Documentation
```

---

## ✅ Checklist d'implémentation

### Pour que les tests fonctionnent complètement :

#### 1. Authentification de test ⚠️ **REQUIS**
- [ ] Implémenter `/api/test/auth/route.ts` avec better-auth
- [ ] Mettre à jour `e2e/auth.setup.ts`
- [ ] Tester la création de session : `curl http://localhost:3000/api/test/auth?role=user`

#### 2. Variables d'environnement
- [ ] Copier `.env` vers `.env.test`
- [ ] Ajouter `ENABLE_TEST_AUTH=true`
- [ ] Ajouter `NODE_ENV=test`

#### 3. Base de données de test (optionnel mais recommandé)
- [ ] Créer une DB séparée pour les tests
- [ ] Ajouter `DATABASE_URL` dans `.env.test`
- [ ] Créer un script de reset DB pour les tests

#### 4. Navigateurs
- [x] Installer Chromium : `pnpm test:e2e:install`
- [ ] Optionnel : Firefox `pnpm exec playwright install firefox`
- [ ] Optionnel : WebKit `pnpm exec playwright install webkit`

---

## 🐛 Dépannage

### Les tests échouent avec "Session non valide"
➡️ Vous devez implémenter `/api/test/auth` (voir QUICKSTART_E2E.md)

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill
pnpm dev
```

### Tests trop lents
Dans `playwright.config.ts` :
```typescript
workers: 4,  // Augmenter le nombre de workers
```

### "Element not found"
Les sélecteurs sont génériques. Adaptez-les à votre UI :
```typescript
// Au lieu de
page.getByText(/dashboard/i)

// Utiliser
page.getByRole('link', { name: 'Dashboard' })
```

---

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev)
- [Guide de démarrage](./QUICKSTART_E2E.md)
- [Documentation complète](./e2e/README.md)
- [Better Auth docs](https://www.better-auth.com)

---

## 🎯 Prochaines étapes

### Tests à ajouter :
1. **Tests admin** - Pages `/admin/*`
2. **Tests de modération** - Pages `/moderation/*`
3. **Tests de paiement** - Workflow SEPA/Crypto complet
4. **Tests de vente** - Workflow complet de vente de skin
5. **Tests d'affiliation** - Système de parrainage
6. **Tests de giveaways** - Participation et tirage
7. **Tests KYC** - Upload de documents
8. **Tests de notifications** - En temps réel
9. **Tests d'emails** - Avec MailHog
10. **Tests de performance** - Lighthouse CI

### Améliorations :
- [ ] Ajouter des tests de charge (k6)
- [ ] Ajouter des tests visuels (Percy/Applitools)
- [ ] Ajouter des tests d'accessibilité (axe-core)
- [ ] Intégrer dans la CI/CD (GitHub Actions)
- [ ] Ajouter des tests de sécurité
- [ ] Créer des fixtures de données
- [ ] Ajouter des tests de régression

---

## 💡 Bonnes pratiques

1. **Toujours utiliser des sélecteurs sémantiques**
   ```typescript
   // ✅ Bon
   page.getByRole('button', { name: 'Submit' })
   page.getByLabel('Email')
   page.getByText('Welcome')
   
   // ❌ Mauvais
   page.locator('.btn-submit')
   page.locator('#email')
   ```

2. **Attendre les éléments**
   ```typescript
   // ✅ Bon
   await expect(page.getByText('Success')).toBeVisible()
   
   // ❌ Mauvais
   await page.waitForTimeout(5000)
   ```

3. **Isoler les tests**
   - Chaque test doit être indépendant
   - Ne pas dépendre de l'ordre d'exécution
   - Nettoyer après chaque test

4. **Nommer clairement**
   ```typescript
   // ✅ Bon
   test('User can submit contact form with valid email', ...)
   
   // ❌ Mauvais
   test('test 1', ...)
   ```

---

**Créé le :** 2024
**Dernière mise à jour :** 2024
**Statut :** 🟡 En cours d'implémentation (auth requise)
