# 🚀 Guide rapide - Tests E2E avec Better-Auth

## Prérequis

1. **Variables d'environnement** : Assurez-vous que `.env.test` contient :
```bash
ENABLE_TEST_AUTH=true
NODE_ENV=test

# Toutes les autres variables de .env doivent aussi être présentes
# Notamment DATABASE_URL, BETTER_AUTH_SECRET, etc.
```

2. **Base de données** : La base de données doit être accessible et migrée

3. **Serveur de développement** : Le serveur Next.js doit tourner (ou playwright le démarre automatiquement)

## Démarrage rapide

### 1. Installation

```bash
# Installer Playwright et les navigateurs
pnpm test:e2e:install
```

### 2. Lancer les tests

```bash
# Tests smoke (vérification rapide)
pnpm test:e2e:smoke

# Tests de pages publiques
pnpm test:e2e:logged-out

# Tests avec authentification
pnpm test:e2e:logged-in

# Tests admin
pnpm test:e2e:admin

# Tous les tests
pnpm test:e2e

# Mode UI (interface graphique)
pnpm test:e2e:ui

# Mode debug
pnpm test:e2e:debug
```

### 3. Tests spécifiques

```bash
# Tests d'authentification
pnpm exec playwright test auth.spec

# Tests des API endpoints
pnpm exec playwright test api-endpoints.spec

# Tests des intégrations
pnpm exec playwright test integrations.spec

# Tests d'erreurs
pnpm exec playwright test errors-edge-cases.spec

# Tests i18n et thème
pnpm exec playwright test i18n-theme.spec
```

## Comment ça marche ?

### Authentification automatique

Les tests `logged-in` et `admin` utilisent un setup qui :

1. Appelle `/api/test/auth?role=user` (ou `role=admin`)
2. L'endpoint crée un utilisateur de test et une session better-auth
3. Les cookies sont sauvegardés dans `.auth/user.json` ou `.auth/admin.json`
4. Les tests réutilisent automatiquement ces cookies

### Exemple de test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // Utilise la session user créée par le setup
  test.use({ storageState: '.auth/user.json' });
  
  test('Accès au dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Automatiquement authentifié !
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

## Nettoyage

```bash
# Supprimer tous les utilisateurs de test de la base de données
pnpm test:e2e:cleanup
```

## Debugging

### Voir les logs du serveur

Les logs de l'endpoint `/api/test/auth` apparaissent dans la console du serveur Next.js :

```bash
# Terminal 1 : Serveur
pnpm dev

# Terminal 2 : Tests
pnpm test:e2e:logged-in
```

### Mode debug Playwright

```bash
# Ouvre l'inspecteur Playwright
pnpm test:e2e:debug

# Lance un test spécifique en mode debug
pnpm exec playwright test auth.spec --debug
```

### Mode headed (voir le navigateur)

```bash
pnpm test:e2e:headed
```

### Voir les traces

Après l'exécution, si un test échoue :

```bash
pnpm test:e2e:report
```

## Troubleshooting

### Erreur : "Endpoint not available"

✅ **Solution** : Vérifiez que `.env.test` contient `ENABLE_TEST_AUTH=true`

### Erreur : "Failed to connect to database"

✅ **Solution** : Vérifiez que `DATABASE_URL` est définie dans `.env.test`

### Erreur : "Failed to create test user"

✅ **Solution** : 
1. Vérifiez que les migrations sont appliquées
2. Nettoyez les utilisateurs de test : `pnpm test:e2e:cleanup`

### Les tests timeout

✅ **Solution** : 
1. Augmentez le timeout dans `playwright.config.ts`
2. Vérifiez que le serveur démarre correctement
3. Utilisez `--headed` pour voir ce qui se passe

### Session non persistée

✅ **Solution** : 
1. Vérifiez que `.auth/` existe et contient les fichiers JSON
2. Relancez le setup : `pnpm exec playwright test --project=setup`

## Structure des tests

```
e2e/
├── auth.setup.ts              # Configuration de l'authentification
├── smoke.spec.ts              # Tests de base
├── pages.logged-out.spec.ts   # Tests pages publiques
├── pages.logged-in.spec.ts    # Tests pages authentifiées
├── pages.mobile.spec.ts       # Tests mobile
├── workflow-sell.spec.ts      # Tests du workflow vente
├── workflow-payout.spec.ts    # Tests du workflow payout
├── workflow-kyc.spec.ts       # Tests du workflow KYC
├── admin.spec.ts              # Tests administration
├── forms.spec.ts              # Tests des formulaires
├── giveaways.spec.ts          # Tests des giveaways
├── affiliation.spec.ts        # Tests de l'affiliation
├── gamification.spec.ts       # Tests de la gamification
├── notifications.spec.ts      # Tests des notifications
├── security.spec.ts           # Tests de sécurité
├── accessibility.spec.ts      # Tests d'accessibilité
├── performance-seo.spec.ts    # Tests de performance et SEO
├── auth.spec.ts               # ✨ Tests d'authentification
├── api-endpoints.spec.ts      # ✨ Tests des endpoints API
├── integrations.spec.ts       # ✨ Tests des intégrations
├── errors-edge-cases.spec.ts  # ✨ Tests d'erreurs et edge cases
└── i18n-theme.spec.ts         # ✨ Tests multilingue et thème
```

## Commandes utiles

```bash
# Voir la liste des tests
pnpm exec playwright test --list

# Lancer un seul test
pnpm exec playwright test -g "nom du test"

# Lancer les tests d'un fichier
pnpm exec playwright test auth.spec.ts

# Mode UI avec un projet spécifique
pnpm exec playwright test --ui --project=logged-in

# Générer un rapport HTML
pnpm exec playwright test && pnpm test:e2e:report

# Mettre à jour les snapshots
pnpm exec playwright test --update-snapshots
```

## CI/CD

Les tests sont configurés pour fonctionner en CI avec :
- Retry automatique (2 fois)
- Worker unique pour éviter les conflits
- Screenshots et vidéos en cas d'échec
- Rapport JUnit pour l'intégration CI

```yaml
# Exemple GitHub Actions
- name: Run E2E tests
  run: pnpm test:e2e
  env:
    ENABLE_TEST_AUTH: true
    NODE_ENV: test
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Bonnes pratiques

1. **Nettoyage** : Lancez `pnpm test:e2e:cleanup` régulièrement pour supprimer les utilisateurs de test
2. **Isolation** : Chaque test devrait être indépendant
3. **Data-attributes** : Utilisez `data-testid` pour cibler les éléments
4. **Attente** : Utilisez `waitForLoadState()` au lieu de `waitForTimeout()`
5. **Assertions** : Utilisez les assertions Playwright (`expect(page).toHaveURL()`)

## Support

Pour plus d'informations :
- 📖 [Documentation complète](./BETTER_AUTH_INTEGRATION.md)
- 📖 [Playwright Docs](https://playwright.dev)
- 📖 [Better-Auth Docs](https://better-auth.com)
