# Tests End-to-End (E2E) - Documentation

> Suite complète de tests E2E avec Playwright et authentification better-auth

## 📚 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement des tests](#lancement-des-tests)
- [Authentification](#authentification)
- [Structure des tests](#structure-des-tests)
- [Écrire de nouveaux tests](#écrire-de-nouveaux-tests)
- [Debugging](#debugging)
- [CI/CD](#cicd)

## Vue d'ensemble

Cette suite de tests E2E couvre **tous les aspects** de l'application MoonSkin :

### ✅ Couverture actuelle : ~900 tests

| Domaine | Fichiers | Tests | Description |
|---------|----------|-------|-------------|
| **Authentification** | `auth.spec.ts`, `auth.setup.ts` | ~20 | Sessions, rôles, déconnexion |
| **Pages publiques** | `pages.logged-out.spec.ts` | ~50 | Home, About, Contact, Legal |
| **Pages authentifiées** | `pages.logged-in.spec.ts` | ~40 | Dashboard, Settings, Profile |
| **Mobile** | `pages.mobile.spec.ts` | ~30 | Responsive, touch, burger menu |
| **Workflows** | `workflow-*.spec.ts` | ~200 | Vente, Payout, KYC |
| **Admin** | `admin.spec.ts` | ~70 | Gestion users, trades, payouts |
| **Formulaires** | `forms.spec.ts` | ~40 | Validation, soumission, erreurs |
| **Giveaways** | `giveaways.spec.ts` | ~50 | Participation, historique, admin |
| **Affiliation** | `affiliation.spec.ts` | ~40 | Programme, codes, dashboard |
| **Gamification** | `gamification.spec.ts` | ~50 | XP, niveaux, missions, badges |
| **Notifications** | `notifications.spec.ts` | ~40 | Centre, toasts, préférences |
| **Sécurité** | `security.spec.ts` | ~60 | Auth, XSS, CSRF, headers |
| **Accessibilité** | `accessibility.spec.ts` | ~50 | WCAG 2.1 AA, ARIA, clavier |
| **Performance/SEO** | `performance-seo.spec.ts` | ~40 | Core Web Vitals, meta tags |
| **API** | `api-endpoints.spec.ts` | ~25 | Endpoints, validation, erreurs |
| **Intégrations** | `integrations.spec.ts` | ~20 | Steam, Skinplace, Qonto, Binance |
| **Erreurs** | `errors-edge-cases.spec.ts` | ~50 | 404, 500, timeout, edge cases |
| **i18n/Thème** | `i18n-theme.spec.ts` | ~35 | FR/EN, Dark/Light |

## Installation

```bash
# 1. Installer Playwright et les navigateurs
pnpm test:e2e:install

# Ou manuellement
pnpm add -D @playwright/test
pnpm exec playwright install
```

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env.test` :

```bash
# Authentification de test
ENABLE_TEST_AUTH=true
NODE_ENV=test

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/moonskin_test"

# Better Auth
BETTER_AUTH_SECRET="your-secret-here"

# Autres variables nécessaires...
```

### 2. Configuration Playwright

Le fichier `playwright.config.ts` définit :

- **testDir** : `./e2e`
- **baseURL** : `http://localhost:3000`
- **Projets** :
  - `setup` : Configuration de l'authentification
  - `smoke` : Tests de base
  - `logged-out` : Tests sans authentification
  - `logged-in` : Tests utilisateur authentifié
  - `admin` : Tests administrateur
  - `mobile` : Tests mobile

### 3. Fichiers générés

Ces fichiers sont automatiquement créés :

```
.auth/
├── user.json          # Session utilisateur
└── admin.json         # Session admin

test-results/          # Résultats des tests
playwright-report/     # Rapport HTML
```

⚠️ Ajoutés dans `.gitignore`

## Lancement des tests

### Tests par type

```bash
# Tests de base (vérification rapide)
pnpm test:e2e:smoke

# Tests pages publiques
pnpm test:e2e:logged-out

# Tests utilisateur authentifié
pnpm test:e2e:logged-in

# Tests administrateur
pnpm test:e2e:admin

# Tests mobile
pnpm test:e2e:mobile
```

### Tests par fonctionnalité

```bash
# Workflow de vente
pnpm test:e2e:sell

# Workflow de payout
pnpm test:e2e:payout

# Workflow KYC
pnpm test:e2e:kyc

# Giveaways
pnpm test:e2e:giveaways

# Affiliation
pnpm test:e2e:affiliation

# Gamification
pnpm test:e2e:gamification

# Notifications
pnpm test:e2e:notifications

# Sécurité
pnpm test:e2e:security

# Accessibilité
pnpm test:e2e:accessibility

# Performance
pnpm test:e2e:performance
```

### Tests nouveaux

```bash
# Tests d'authentification
pnpm exec playwright test auth.spec

# Tests des API endpoints
pnpm exec playwright test api-endpoints.spec

# Tests des intégrations
pnpm exec playwright test integrations.spec

# Tests d'erreurs et edge cases
pnpm exec playwright test errors-edge-cases.spec

# Tests multilingue et thème
pnpm exec playwright test i18n-theme.spec
```

### Tous les tests

```bash
# Lancer tous les tests
pnpm test:e2e

# Avec interface graphique
pnpm test:e2e:ui

# En mode debug
pnpm test:e2e:debug

# En mode headed (voir le navigateur)
pnpm test:e2e:headed
```

## Authentification

### 🔐 Authentification better-auth complète

Les tests utilisent maintenant de **vraies sessions better-auth** !

#### Comment ça marche ?

1. **Setup automatique** : Avant les tests `logged-in` et `admin`, le setup :
   - Appelle `/api/test/auth?role=user` (ou `role=admin`)
   - L'endpoint crée un utilisateur de test avec better-auth
   - Les cookies de session sont sauvegardés dans `.auth/*.json`

2. **Réutilisation** : Les tests chargent automatiquement les cookies sauvegardés

#### Endpoint de test

**URL** : `/api/test/auth`

**Paramètres** :
- `role=user` : Crée un utilisateur normal
- `role=admin` : Crée un administrateur
- `role=moderator` : Crée un modérateur

**Sécurité** : Actif uniquement si `ENABLE_TEST_AUTH=true` et `NODE_ENV=test`

#### Utilisateurs de test créés

- **Email** : `test-{role}@moonskin.test`
- **Password** : Généré automatiquement
- **SteamID** : `test-{role}-76561198000000000`
- **Rôle** : USER, ADMIN ou MODERATOR

#### Nettoyage

```bash
# Supprimer tous les utilisateurs de test
pnpm test:e2e:cleanup
```

### Exemple d'utilisation

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mon test', () => {
  // Utilise la session user
  test.use({ storageState: '.auth/user.json' });
  
  test('Test authentifié', async ({ page }) => {
    await page.goto('/dashboard');
    // Automatiquement authentifié !
  });
});
```

## Structure des tests

```
e2e/
├── auth.setup.ts              # ✨ Setup authentification better-auth
├── smoke.spec.ts              # Tests de base
│
├── pages.logged-out.spec.ts   # Pages publiques
├── pages.logged-in.spec.ts    # Pages authentifiées
├── pages.mobile.spec.ts       # Responsive mobile
│
├── workflow-sell.spec.ts      # Workflow vente
├── workflow-payout.spec.ts    # Workflow payout
├── workflow-kyc.spec.ts       # Workflow KYC
│
├── admin.spec.ts              # Administration
├── forms.spec.ts              # Formulaires
│
├── giveaways.spec.ts          # Giveaways
├── affiliation.spec.ts        # Affiliation
├── gamification.spec.ts       # Gamification
├── notifications.spec.ts      # Notifications
│
├── security.spec.ts           # Sécurité
├── accessibility.spec.ts      # Accessibilité
├── performance-seo.spec.ts    # Performance & SEO
│
├── auth.spec.ts               # ✨ Tests authentification
├── api-endpoints.spec.ts      # ✨ Tests API
├── integrations.spec.ts       # ✨ Tests intégrations
├── errors-edge-cases.spec.ts  # ✨ Tests erreurs
└── i18n-theme.spec.ts         # ✨ Tests i18n/thème
```

## Écrire de nouveaux tests

### 1. Test basique

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ma fonctionnalité', () => {
  test('Description du test', async ({ page }) => {
    await page.goto('/ma-page');
    
    await expect(page).toHaveTitle(/Titre attendu/);
  });
});
```

### 2. Test authentifié

```typescript
test.describe('Ma fonctionnalité', () => {
  test.use({ storageState: '.auth/user.json' });
  
  test('Test authentifié', async ({ page }) => {
    await page.goto('/dashboard');
    // Déjà connecté
  });
});
```

### 3. Test admin

```typescript
test.describe('Admin', () => {
  test.use({ storageState: '.auth/admin.json' });
  
  test('Test admin', async ({ page }) => {
    await page.goto('/admin');
    // Connecté en tant qu'admin
  });
});
```

### 4. Test mobile

Créer un fichier `*.mobile.spec.ts` :

```typescript
// Automatiquement exécuté avec device iPhone 13
test.describe('Mobile', () => {
  test('Test mobile', async ({ page }) => {
    await page.goto('/');
    // Viewport mobile
  });
});
```

### Bonnes pratiques

1. **Data-testid** : Utilisez `[data-testid="element"]` pour cibler les éléments
2. **Attente** : Utilisez `waitForLoadState()` au lieu de `waitForTimeout()`
3. **Assertions** : Utilisez les assertions Playwright
4. **Isolation** : Chaque test doit être indépendant
5. **Nettoyage** : Nettoyez les données après les tests si nécessaire

```typescript
// ✅ Bon
await page.getByTestId('submit-button').click();
await page.waitForLoadState('networkidle');
await expect(page.getByText('Success')).toBeVisible();

// ❌ Mauvais
await page.locator('div > button.submit').click();
await page.waitForTimeout(2000);
const text = await page.textContent('body');
expect(text).toContain('Success');
```

## Debugging

### Mode UI

```bash
# Interface graphique interactive
pnpm test:e2e:ui
```

### Mode debug

```bash
# Ouvre l'inspecteur Playwright
pnpm test:e2e:debug

# Debug un test spécifique
pnpm exec playwright test auth.spec --debug
```

### Mode headed

```bash
# Voir le navigateur en action
pnpm test:e2e:headed
```

### Traces

```bash
# Voir le rapport HTML
pnpm test:e2e:report
```

Les traces incluent :
- Screenshots à chaque étape
- Vidéos des tests échoués
- Logs réseau
- Console logs

### Logs du serveur

```bash
# Terminal 1 : Serveur
pnpm dev

# Terminal 2 : Tests
pnpm test:e2e:logged-in

# Les logs de /api/test/auth apparaissent dans Terminal 1
```

## CI/CD

### Configuration pour GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          ENABLE_TEST_AUTH: true
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Variables CI nécessaires

- `DATABASE_URL` : URL de la base de données de test
- `BETTER_AUTH_SECRET` : Secret better-auth
- `ENABLE_TEST_AUTH=true` : Active l'endpoint de test
- `NODE_ENV=test` : Mode test

## Troubleshooting

### Tests timeout

**Problème** : Les tests dépassent le timeout

**Solutions** :
1. Augmenter le timeout dans `playwright.config.ts`
2. Vérifier que le serveur démarre correctement
3. Utiliser `--headed` pour voir ce qui se passe

### Endpoint not available

**Problème** : `/api/test/auth` retourne 403

**Solution** : Vérifier `.env.test` contient `ENABLE_TEST_AUTH=true`

### Session non persistée

**Problème** : Les tests `logged-in` ne sont pas authentifiés

**Solutions** :
1. Vérifier que `.auth/*.json` existe
2. Relancer le setup : `pnpm exec playwright test --project=setup`
3. Nettoyer : `rm -rf .auth && pnpm test:e2e:logged-in`

### Database errors

**Problème** : Erreurs de connexion à la base de données

**Solutions** :
1. Vérifier `DATABASE_URL` dans `.env.test`
2. Vérifier que les migrations sont appliquées
3. Nettoyer les utilisateurs de test : `pnpm test:e2e:cleanup`

## Documentation supplémentaire

- 📖 [Guide rapide](./QUICKSTART_E2E_AUTH.md)
- 📖 [Intégration Better-Auth](./BETTER_AUTH_INTEGRATION.md)
- 📖 [Playwright Documentation](https://playwright.dev)
- 📖 [Better-Auth Documentation](https://better-auth.com)

## Résumé

✅ **~900 tests E2E** couvrant tous les aspects de l'application
✅ **Authentification réelle** avec better-auth
✅ **CI/CD ready** avec retry et rapports
✅ **Mobile testing** avec différents devices
✅ **Accessibilité** WCAG 2.1 AA
✅ **Performance** Core Web Vitals
✅ **Sécurité** XSS, CSRF, headers
✅ **Multilingue** FR/EN
✅ **Multi-thème** Dark/Light

🎉 **Suite de tests complète et production-ready !**
