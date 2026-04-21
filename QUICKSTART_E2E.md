# 🚀 Guide de démarrage rapide - Tests E2E

## Installation rapide

```bash
# 1. Installer les navigateurs Playwright
pnpm test:e2e:install

# 2. Démarrer le serveur de développement (dans un autre terminal)
pnpm dev

# 3. Lancer les tests
pnpm test:e2e
```

## 📝 Scripts disponibles

```bash
# Tests complets
pnpm test:e2e              # Tous les tests
pnpm test:e2e:logged-out   # Pages publiques seulement
pnpm test:e2e:logged-in    # Pages connectées seulement

# Mode développement
pnpm test:e2e:ui           # Interface graphique Playwright
pnpm test:e2e:debug        # Mode debug (step-by-step)

# Rapport
pnpm test:e2e:report       # Voir le dernier rapport HTML
```

## 🔧 Configuration rapide

### 1. Activer l'authentification de test

Dans votre `.env.test` :

```bash
ENABLE_TEST_AUTH=true
NODE_ENV=test
```

### 2. Implémenter l'endpoint de test

Le fichier `/src/app/api/test/auth/route.ts` est créé mais nécessite l'implémentation de better-auth.

Cherchez le `TODO` dans ce fichier et ajoutez :

```typescript
import { auth } from '@/lib/auth';

const session = await auth.api.createSession({
  userId: user.id,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

response.cookies.set('better-auth.session_token', session.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60,
  path: '/',
});
```

### 3. Mettre à jour le setup d'authentification

Dans `e2e/auth.setup.ts`, remplacez le mock par :

```typescript
setup('authenticate as user', async ({ page, context }) => {
  await page.goto('/api/test/auth?role=user');
  await page.waitForURL('/dashboard');
  await context.storageState({ path: authFile });
});
```

## 🎯 Premier test

Créez `e2e/my-first.spec.ts` :

```typescript
import { test, expect } from '@playwright/test';

test('mon premier test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

Lancez-le :

```bash
pnpm exec playwright test my-first.spec.ts
```

## 🐛 Déboguer un test qui échoue

```bash
# 1. Voir les traces
pnpm exec playwright show-trace test-results/.../trace.zip

# 2. Relancer en mode debug
pnpm exec playwright test --debug my-test.spec.ts

# 3. Voir le navigateur
pnpm exec playwright test --headed my-test.spec.ts
```

## 📊 Voir les résultats

Les tests génèrent :
- **Screenshots** : `test-results/screenshots/`
- **Vidéos** : `test-results/videos/` (en cas d'échec)
- **Traces** : `test-results/traces/` (en cas d'échec)
- **Rapport HTML** : `playwright-report/`

```bash
pnpm test:e2e:report
```

## ✅ Checklist avant commit

- [ ] Tests passent localement : `pnpm test:e2e`
- [ ] Pas d'erreurs de lint : `pnpm lint`
- [ ] TypeScript compile : `pnpm check`
- [ ] Screenshots mis à jour si UI changée

## 📚 Documentation complète

Voir `e2e/README.md` pour la documentation complète.

## ❓ Problèmes fréquents

### "Session non valide"

→ Implémentez l'endpoint `/api/test/auth` avec better-auth

### "Timeout en attendant le serveur"

→ Vérifiez que le port 3000 est libre : `lsof -ti:3000 | xargs kill`

### "Element not found"

→ Utilisez des sélecteurs plus robustes : `getByRole`, `getByText`

### Tests lents

→ Activez `fullyParallel: true` dans `playwright.config.ts`
