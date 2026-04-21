# 🚀 Guide Rapide - Tests E2E Playwright

## ⚡ Commandes Essentielles

### Installation
```bash
# Installer les navigateurs (une seule fois)
pnpm test:e2e:install
```

### Lancer les tests

#### Tests rapides (5 min)
```bash
# Smoke tests - Validation basique
pnpm test:e2e:smoke

# Pages publiques seulement
pnpm test:e2e:logged-out
```

#### Tests complets (30+ min)
```bash
# TOUS les tests
pnpm test:e2e

# Avec interface graphique (recommandé)
pnpm test:e2e:ui
```

#### Tests par fonctionnalité (5-10 min chacun)
```bash
pnpm test:e2e:sell           # Workflow de vente
pnpm test:e2e:payout         # SEPA & Crypto
pnpm test:e2e:kyc            # Vérification d'identité
pnpm test:e2e:giveaways      # Système de giveaways
pnpm test:e2e:affiliation    # Programme d'affiliation
pnpm test:e2e:gamification   # XP, missions, badges
pnpm test:e2e:notifications  # Système de notifications
pnpm test:e2e:forms          # Tous les formulaires
pnpm test:e2e:security       # Tests de sécurité
pnpm test:e2e:accessibility  # Accessibilité WCAG
pnpm test:e2e:performance    # Performance & SEO
```

#### Tests par rôle
```bash
pnpm test:e2e:admin          # Interface admin
pnpm test:e2e:logged-in      # Utilisateur connecté
pnpm test:e2e:mobile         # Mobile/Tablette
```

### Modes spéciaux

```bash
# Mode UI - Interface graphique interactive
pnpm test:e2e:ui

# Mode Debug - Step by step
pnpm test:e2e:debug

# Mode Headed - Voir le navigateur
pnpm test:e2e:headed

# Rapport HTML - Voir les résultats
pnpm test:e2e:report
```

### Tests spécifiques

```bash
# Un seul fichier
pnpm exec playwright test workflow-sell

# Un seul test par nom
pnpm exec playwright test -g "Page d'accueil"

# Un navigateur spécifique
pnpm exec playwright test --project=chromium
```

---

## 📊 Structure des tests

```
e2e/
├── smoke.spec.ts              ⚡ Tests rapides (16 tests)
├── pages.logged-out.spec.ts   🌐 Pages publiques (30 tests)
├── pages.logged-in.spec.ts    🔐 Pages connectées (25 tests)
├── pages.mobile.spec.ts       📱 Mobile (25 tests)
├── workflow-sell.spec.ts      💰 Vente (45 tests)
├── workflow-payout.spec.ts    💳 Payout (50 tests)
├── workflow-kyc.spec.ts       🆔 KYC (60 tests)
├── admin.spec.ts              👑 Admin (70 tests)
├── forms.spec.ts              📝 Formulaires (50 tests)
├── giveaways.spec.ts          🎁 Giveaways (60 tests)
├── affiliation.spec.ts        🤝 Affiliation (50 tests)
├── gamification.spec.ts       🎮 Gamification (55 tests)
├── notifications.spec.ts      🔔 Notifications (50 tests)
├── security.spec.ts           🔒 Sécurité (60 tests)
├── accessibility.spec.ts      ♿ Accessibilité (45 tests)
└── performance-seo.spec.ts    ⚡ Performance (50 tests)

TOTAL: 750+ tests
```

---

## ⚠️ Important - Tests connectés

Les tests nécessitant une authentification (marked `logged-in`, `admin`) requièrent :

1. **Implémenter** `/src/app/api/test/auth/route.ts`
2. **Activer** dans `.env.test` :
   ```bash
   ENABLE_TEST_AUTH=true
   NODE_ENV=test
   ```
3. **Mettre à jour** `e2e/auth.setup.ts`

Voir `QUICKSTART_E2E.md` pour les détails.

---

## 🎯 Workflow recommandé

### 1. Premier lancement
```bash
# Installer les navigateurs
pnpm test:e2e:install

# Lancer les smoke tests
pnpm test:e2e:smoke
```

### 2. Développement
```bash
# Lancer les tests en UI pendant le dev
pnpm test:e2e:ui

# Ou cibler une fonctionnalité spécifique
pnpm test:e2e:sell
```

### 3. Avant un commit
```bash
# Tests rapides pour validation
pnpm test:e2e:smoke

# Si tout est OK, commit
git add .
git commit -m "feat: nouvelle fonctionnalité"
```

### 4. Avant un déploiement
```bash
# Tous les tests
pnpm test:e2e

# Vérifier le rapport
pnpm test:e2e:report
```

---

## 🐛 Dépannage

### Les tests échouent
```bash
# Vérifier que le serveur tourne
pnpm dev

# Lancer en mode debug
pnpm test:e2e:debug
```

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill
pnpm dev
```

### Tests trop lents
```bash
# Lancer seulement les smoke tests
pnpm test:e2e:smoke

# Ou un workflow spécifique
pnpm test:e2e:sell
```

### Voir ce qui se passe
```bash
# Mode headed (voir le navigateur)
pnpm test:e2e:headed

# Ou UI mode
pnpm test:e2e:ui
```

---

## 📚 Documentation complète

- `QUICKSTART_E2E.md` - Démarrage rapide détaillé
- `e2e/README.md` - Documentation technique complète
- `E2E_COVERAGE_COMPLETE.md` - Liste de TOUS les tests
- `TESTS_E2E_SUMMARY.md` - Résumé et organisation

---

## ✨ Tips & Tricks

### Filtrer les tests
```bash
# Par nom
pnpm exec playwright test -g "SEPA"

# Par fichier
pnpm exec playwright test workflow-payout

# Par projet
pnpm exec playwright test --project=smoke
```

### Screenshots
Les screenshots sont automatiques en cas d'échec :
```
test-results/screenshots/
```

### Traces
Les traces sont sauvegardées en cas d'échec :
```bash
pnpm exec playwright show-trace test-results/.../trace.zip
```

### Parallélisation
Modifier `playwright.config.ts` :
```typescript
workers: 4, // Augmenter pour plus de vitesse
```

---

## 🎉 C'est tout !

Vous avez maintenant **750+ tests E2E** pour assurer la qualité de votre application.

**Commencez par :**
```bash
pnpm test:e2e:smoke
```

**Puis explorez :**
```bash
pnpm test:e2e:ui
```

Happy testing! 🚀
