# Configuration Sentry pour MoonSkin

Ce document décrit comment finaliser la configuration Sentry une fois ton compte créé.

## Étape 1 : Créer un compte Sentry

1. Va sur [sentry.io/signup](https://sentry.io/signup/)
2. Crée ton compte (gratuit pour les petits projets)
3. Crée une nouvelle organisation ou utilise celle par défaut
4. Crée un nouveau projet **Next.js** (choisis le framework Next.js)

## Étape 2 : Récupérer les credentials

Après la création du projet, Sentry te fournit :

### DSN (Data Source Name)

- **Client** : `NEXT_PUBLIC_SENTRY_DSN` — utilisé côté navigateur (instrumentation-client.ts)
- **Server/Edge** : `SENTRY_DSN` — utilisé côté serveur

Tu peux utiliser le même DSN pour les deux. Pour MoonSkin, un seul DSN suffit.

Exemple : `https://abc123@o123456.ingest.sentry.io/7890123`

### Auth Token (optionnel mais recommandé)

Pour l'upload des **source maps** (stack traces lisibles en production) :

1. Va dans **Settings → Auth Tokens**
2. Crée un token avec le scope `project:releases`
3. Ajoute-le en variable `SENTRY_AUTH_TOKEN` dans ton CI/CD (Vercel, GitHub Actions, etc.)
4. **Important** : ne commite jamais ce token dans le repo

## Étape 3 : Configurer les variables d'environnement

Ajoute ces variables dans ton `.env.local` (développement) et dans ton déploiement (Vercel, etc.) :

```bash
# Obligatoire pour activer Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optionnel : source maps en CI
SENTRY_AUTH_TOKEN=sntrys_xxx

# Optionnel : override si tu as une autre org/projet
SENTRY_ORG=moonskin
SENTRY_PROJECT=counter-strike-skin
```

## Étape 4 : Vérifier le bon fonctionnement

### Test d'erreur

1. Lance l'app : `pnpm dev`
2. Ajoute temporairement ce bouton sur une page :

```tsx
<button
  type="button"
  onClick={() => {
    throw new Error("Sentry Test Error");
  }}
>
  Tester Sentry
</button>
```

3. Clique sur le bouton
4. Va dans **Issues** sur ton dashboard Sentry — l'erreur doit apparaître en quelques secondes

### Ce qui est déjà instrumenté

- **error.tsx** : erreurs dans les routes
- **global-error.tsx** : erreurs critiques (root layout)
- **instrumentation.ts** : erreurs serveur (Server Components, middleware)
- **Session Replay** : 10 % des sessions + 100 % des sessions avec erreur
- **Tracing** : 10 % en prod, 100 % en dev
- **User Feedback** : widget pour signaler des bugs (coin bas droit)

## Fonctionnalités incluses

| Fonctionnalité   | Description                            |
|------------------|----------------------------------------|
| Error Monitoring | Capture des erreurs client et serveur  |
| Session Replay   | Enregistrements des sessions (10 %)    |
| Performance      | Tracing des requêtes et navigations    |
| User Feedback    | Widget de signalement de bugs          |
| Source Maps      | Stack traces lisibles en production    |

## Note sur Turbopack

Avec **Next.js 15.3.x**, Sentry recommande **Next.js 15.4.1+** pour une compatibilité optimale avec Turbopack. Si tu vois des warnings au build :

- **Option 1** : Mettre à jour Next.js : `pnpm add next@latest`
- **Option 2** : Pour le build production, retirer `--turbopack` du script `build` dans `package.json`

En dev (`pnpm dev`), Sentry fonctionne normalement. Les warnings sont inoffensifs.

## Tunneling (optionnel)

Si des ad-blockers bloquent les events Sentry, tu peux activer le tunneling :

1. Dans `next.config.ts`, ajoute : `tunnelRoute: "/monitoring"`
2. Dans `middleware.ts`, exclut la route dans le matcher : `/((?!monitoring|api|_next/...).*)`

Cela redirige les events via ton serveur Next.js.

## Références

- [Documentation Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Configuration avancée](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/)
