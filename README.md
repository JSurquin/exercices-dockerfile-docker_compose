# MoonSkin (Cashtrade)

![MoonSkin](public/images/logo.webp)

**MoonSkin** est la plateforme web qui permet aux joueurs de **Counter-Strike 2** de vendre leurs skins contre de l’argent réel (SEPA, carte, crypto), dans le respect des règles Steam (délai de trade hold) et des obligations **KYC / AML** en Europe.

Dépôt Git : [github.com/JSurquin/cashtrade](https://github.com/JSurquin/cashtrade) — package npm : `counter-strike-skin`.

---

## Sommaire

1. [Vue d’ensemble](#vue-densemble)
2. [Parcours utilisateur](#parcours-utilisateur)
3. [Fonctionnalités](#fonctionnalités)
4. [Stack technique](#stack-technique)
5. [Prérequis](#prérequis)
6. [Installation locale](#installation-locale)
7. [Variables d’environnement](#variables-denvironnement)
8. [Structure du dépôt](#structure-du-dépôt)
9. [Base de données](#base-de-données)
10. [Tâches planifiées (cron)](#tâches-planifiées-cron)
11. [Intégrations externes](#intégrations-externes)
12. [API partenaire (v1)](#api-partenaire-v1)
13. [Backoffice et rôles](#backoffice-et-rôles)
14. [Internationalisation et thèmes](#internationalisation-et-thèmes)
15. [Tests et qualité](#tests-et-qualité)
16. [Sécurité et conformité](#sécurité-et-conformité)
17. [Scripts npm utiles](#scripts-npm-utiles)
18. [Contribution](#contribution)
19. [Support](#support)

---

## Vue d’ensemble

| Élément | Détail |
|--------|--------|
| **Produit** | Vente de skins CS2 → solde interne → retrait (Flexify SEPA/carte, Whitepay crypto) |
| **Auth joueurs** | Steam (OpenID), Discord (Better Auth) ; trade link Steam requis pour vendre |
| **Auth staff** | E-mail / mot de passe, 2FA (TOTP / OTP e-mail), rôles admin / modérateur / affilié |
| **Source de vérité** | PostgreSQL (Prisma) ; montants en **centimes** (`Int`), jamais de flottants pour l’argent |
| **Trading** | API **Skinplace** (proxy côté serveur, cache, retries) |
| **UI** | Next.js 15 App Router, Tailwind CSS 4, composants **shadcn/ui** dans `src/components` |

---

## Parcours utilisateur

Flux métier principal (simplifié) :

```
Connexion Steam/Discord
  → Trade Link Steam validé
  → Estimation inventaire (Skinplace)
  → Confirmation vente → trade Steam (bot Skinplace)
  → Trade hold Steam (~7 jours) [ou crédit instantané si compte éligible]
  → Solde disponible sur le compte MoonSkin
  → KYC validé (KYCAID) obligatoire avant retrait
  → Retrait (Flexify et/ou Whitepay selon méthode)
  → Paiement confirmé (webhooks + réconciliation cron)
```

**États trade** (Prisma `TradeStatus`) : `CREATED` → `ACCEPTED_BY_BOT` → `IN_TRADE_HOLD` → `AVAILABLE` → (`PAYOUT_PENDING`) → `PAID` / `FAILED` / `CANCELLED`.

**États payout** (extrait) : `PENDING`, `VERIFICATION_REQUIRED`, `VERIFIED`, `PROCESSING`, états spécifiques Flexify / Whitepay, puis `PAID` ou `FAILED`. La logique de gel/débit de solde est centralisée dans `src/lib/payout-lifecycle.ts` (idempotence, transactions SQL).

---

## Fonctionnalités

### Vente et wallet

- Estimation et création de trade via routes `/api/skinplace/*` et `/api/steam/*`
- Suivi dashboard, historique, limites anti-abus (`src/lib/trade-limits.ts`)
- Solde, gel (`frozenBalanceCents`), transactions (`BalanceTransaction`)
- Retraits marchands (programme merchant), SEPA FR manuel admin si configuré

### Paiements

- **Flexify** : carte / SEPA (H2H), webhooks `/api/flexify/webhook`
- **Whitepay** : crypto (devis, confirmation, retrait), webhooks `/api/whitepay/webhook`
- Frais cashout affichés (règle produit : **0,5 %** sur le brut — voir `.cursorrules` / calculs serveur)
- **Stripe** : variables présentes dans `env.example` (usage selon déploiement)

### KYC (KYCAID)

- Parcours `/kyc`, webhooks `/api/kycaid/webhook`
- Modèles Prisma : documents, adresses, vérifications ; statuts `KycStatus` synchronisés avec KYCAID
- Payout bloqué tant que KYC non validé

### Gamification

- XP, niveaux, tickets, fragments, missions (`/missions`)
- Giveaways (`/giveaways`) : séries, tirages automatiques (cron), entrées par tickets

### Affiliation

- Cookie + paramètre URL (`ctf_affiliate_ref` via middleware)
- Dashboard affilié, commissions, candidatures, demandes de giveaways affiliés
- Admin : gestion affiliés, rankings, commissions

### Support et contenu

- **Chat** widget + modération (`/moderation`, `/admin/chat`) ; option **IA locale Ollama** (`CHAT_AI_ENABLED`)
- CMS léger : blog, presse, aide (`HelpArticle`, `BlogArticle`, `PressArticle`)
- Newsletter, notifications in-app, pages légales éditables (admin)
- Pages publiques : accueil, à propos, contact, statut, CGU, AML, KYC policy, etc.

### API développeurs / partenaires

- Clés API Bearer (`ApiClient`), scopes, rate limit, logs, webhooks sortants
- Routes publiques versionnées sous `/api/v1/partner/*`
- Documentation interactive : `/api-docs` (si activée en settings)

### Observabilité

- **Sentry** (opt-in via `SHOW_SENTRY=true`)
- **Audit logs** admin (`AuditLog`, pages `/admin/audit`)

---

## Stack technique

| Couche | Technologies |
|--------|----------------|
| Frontend | React 19, Next.js 15 (Turbopack en dev/build), Framer Motion, Recharts |
| UI | Tailwind CSS 4, Radix / shadcn, thèmes `next-themes` |
| i18n | `next-intl` + dictionnaires dans `src/lib/i18n.ts` |
| Backend | Route Handlers Next.js, validation **Zod**, services dans `src/lib/` |
| Auth | **Better Auth** (`lib/auth.ts`) — Prisma adapter, Discord, e-mail, 2FA, plugin admin |
| ORM | **Prisma 5** → PostgreSQL |
| Cache / rate limit | Upstash Redis en prod ; fallback mémoire en dev (`src/lib/security/rate-limiter.ts`) |
| E-mail | Nodemailer (`src/lib/email`) |
| PDF | jsPDF (reçus / exports selon features) |
| Tests unitaires | Jest + Testing Library |
| Tests E2E | Playwright (`e2e/`, voir [e2e/README.md](e2e/README.md)) |

---

## Prérequis

- **Node.js** ≥ 20.9 (voir `package.json` → `engines`)
- **pnpm** (gestionnaire utilisé sur le projet)
- **PostgreSQL** 14+ pour l’application
- Clés API des prestataires pour un environnement complet (Skinplace, Flexify, Whitepay, KYCAID, Steam, etc.)
- Optionnel : Docker pour la base **RAG** (pgvector) — voir ci-dessous

---

## Installation locale

```bash
git clone https://github.com/JSurquin/cashtrade.git
cd cashtrade
pnpm install
cp env.example .env.local
# Éditer .env.local (DATABASE_URL minimum pour démarrer)
```

Base de données :

```bash
npx prisma migrate dev    # applique les migrations Prisma
pnpm run db:seed          # données de démo (optionnel)
```

Lancer l’app :

```bash
pnpm run dev
# http://localhost:3000
```

Build production :

```bash
pnpm run build
pnpm run start
```

Vérification statique (CI locale) :

```bash
pnpm run check   # prisma generate + eslint + tsc --noEmit
```

---

## Variables d’environnement

Fichier modèle : **`env.example`** → copier vers **`.env.local`**.

| Domaine | Variables clés |
|---------|----------------|
| App | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` |
| Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DISCORD_*`, `STEAM_API_KEY` |
| DB | `DATABASE_URL` |
| Skinplace | `SKINPLACE_API_KEY_*`, `SKINPLACE_API_URL` |
| Flexify | `FLEXIFY_*` (clés, URLs H2H/API, callbacks) |
| Whitepay | `WHITEPAY_*` |
| KYCAID | `KYCAID_*` (token, form, sandbox, redirect) |
| E-mail | `SMTP_*` |
| Sentry | `SHOW_SENTRY`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| Chat IA | `CHAT_AI_ENABLED`, `OLLAMA_*` |
| RAG (optionnel) | `RAG_DATABASE_URL` + `pnpm run docker:rag:up` |
| Cron | `ENABLE_CRON_WORKER=false` pour désactiver le worker intégré |

Ne jamais committer `.env`, `.env.local` ni de secrets.

---

## Structure du dépôt

```
cashtrade/
├── lib/auth.ts                 # Configuration Better Auth (serveur)
├── prisma/
│   ├── schema.prisma           # Modèle de données (~50 entités)
│   ├── migrations/             # Migrations SQL versionnées
│   └── seed.ts                 # Seed développement
├── public/                     # Assets statiques (images, etc.)
├── src/
│   ├── app/                    # App Router : pages + route handlers API
│   │   ├── admin/              # Backoffice
│   │   ├── api/                # REST interne (skinplace, flexify, kycaid…)
│   │   ├── api/v1/partner/     # API partenaire externe
│   │   ├── dashboard/, sell/, payout/, kyc/, giveaways/, affiliate/…
│   ├── components/             # UI métier + shadcn (`components/ui`)
│   ├── hooks/
│   └── lib/                    # Services, i18n, intégrations, cron-jobs, tests unitaires
├── scripts/                    # CLI : cron-worker, seeds RAG, cleanup e2e, OWASP scan…
├── e2e/                        # Playwright
├── docker-compose.rag.yml      # Postgres pgvector pour RAG (optionnel)
├── env.example
└── package.json
```

Les règles produit détaillées (CTF / MoonSkin V1) sont dans **`.cursorrules`** à la racine.

---

## Base de données

- **PostgreSQL** unique pour l’app (users, trades, payouts, KYC, giveaways, chat, CMS, settings…).
- Client Prisma : import depuis `~/prisma/prisma` ou `@/…` selon les fichiers.
- Entités principales : `User`, `Trade`, `TradeItem`, `Payout`, `PaymentMethod`, modèles KYC, `Giveaway*`, `Affiliate*`, `Conversation` / `ChatMessage`, `ApiClient`, `SiteSettings`, etc.

Commandes fréquentes :

```bash
npx prisma studio          # exploration visuelle
npx prisma migrate dev     # dev : créer/appliquer migration
npx prisma migrate deploy  # prod : appliquer migrations
```

---

## Tâches planifiées (cron)

Le worker **`pnpm run cron-worker`** (ou démarrage automatique avec `pnpm dev` / `pnpm start` sauf si `ENABLE_CRON_WORKER=false`) exécute notamment :

| Job | Rôle |
|-----|------|
| `update-trades-status` | Synchronisation statuts trades / Skinplace |
| `process-trades` | Traitement post-hold, crédit solde, hooks affiliation |
| `giveaway-draw` | Tirages automatiques des giveaways |
| `security-maintenance` | Maintenance sécurité (sessions, nettoyage…) |
| `auto-close-inactive-conversations` | Fermeture conversations support inactives |
| `auto-unassign-inactive-conversations` | Désassignation modérateurs inactifs |

Des routes **`/api/cron/*`** existent aussi pour déclenchements HTTP (protection à configurer en prod).

---

## Intégrations externes

### Skinplace

- Proxy serveur : inventaire, estimation, création trade, statut, webhooks
- Cache TTL ~5 min, retries avec backoff
- Points d’entrée typiques : `/api/skinplace/*`, `/api/steam/inventory`, `/api/steam/create-trade`

### Flexify

- Payouts carte / SEPA, sandbox vs production via `FLEXIFY_ENVIRONMENT`
- Webhook : `/api/flexify/webhook`

### Whitepay

- Crypto : quote, instant, confirmation, retrait
- Webhook : `/api/whitepay/webhook`

### KYCAID

- Initiation, adresse, documents, statut, webhook
- Routes sous `/api/kycaid/*`

### Steam

- Login OpenID (`/api/auth/steam/*`), inventaire et trades côté serveur avec `STEAM_API_KEY`

### RAG (futur chatbot)

```bash
pnpm run docker:rag:up      # Postgres pgvector port 5433
pnpm run rag:seed           # seed base RAG
pnpm run docker:rag:down
```

---

## API partenaire (v1)

Authentification : en-tête `Authorization: Bearer <clé_api>`.

Exemples de routes (prefix `/api/v1/partner`) :

- `GET /me` — compte lié à la clé
- `GET /balance` — solde
- `POST /estimate` — estimation inventaire
- `POST /trades`, `GET /trades/:id` — cycle de vente
- `POST /payouts` — demandes de retrait (sous contraintes KYC / guards)
- Webhooks configurables par client API (livraisons journalisées)

Génération de clé : programme développeur utilisateur (`developerProgramEnabled`) + admin API clients.

---

## Backoffice et rôles

| Rôle | Accès typique |
|------|----------------|
| `USER` | Dashboard, vente, retraits, KYC, giveaways |
| `AFFILIATE` | Espace affilié + auth e-mail |
| `MODERATOR` | Modération chat / conversations |
| `ADMIN` | `/admin/*` : users, trades, payouts, KYC force, affiliés, CMS, settings, audit, IP bloquées, etc. |

Connexion admin : `/admin/login` (distincte du login Steam joueur).

---

## Internationalisation et thèmes

- Langues : **fr**, **en**, **cn** (`src/lib/locales.ts`, cookie locale via middleware)
- Thèmes : **clair** / **sombre** (`next-themes`)
- Textes : centralisés dans `src/lib/i18n.ts` (fichiers volumineux — rechercher par clé)

---

## Tests et qualité

```bash
pnpm run test                    # Jest (src/lib/__tests__, etc.)
pnpm run test:e2e                # Playwright complet
pnpm run test:e2e:smoke          # fumée rapide
pnpm run test:e2e:install        # navigateurs Playwright
pnpm run security:owasp          # scan OWASP (script bash)
```

Documentation détaillée E2E : **[e2e/README.md](e2e/README.md)** (projets Playwright : smoke, logged-in, admin, mobile, workflows vente/payout/KYC…).

Variables de test : voir `.env.test` / `ENABLE_TEST_AUTH` dans la doc e2e.

---

## Sécurité et conformité

Mesures implémentées (non exhaustif) :

- Rate limiting (Redis ou mémoire)
- Validation Zod sur les entrées API
- CSRF sur mutations sensibles (`src/lib/csrf-mutation-guard.ts`)
- 2FA staff, audit logs, blocage IP, comptes bannis
- KYC obligatoire avant payout ; journalisation des changements sensibles
- RGPD : pages privacy, export/suppression selon implémentation légale (données financières conservées selon obligation)

Checklist paiements / KYC (PR) : calcul en centimes, transactions DB, idempotence webhooks, tests — voir `.cursorrules`.

---

## Scripts npm utiles

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Dev Turbopack |
| `pnpm run build` / `start` | Production |
| `pnpm run check` | Prisma generate + lint + TypeScript |
| `pnpm run db:seed` | Seed BDD |
| `pnpm run cron:worker` | Worker cron standalone |
| `pnpm run test:e2e:*` | Sous-ensembles E2E (sell, payout, kyc, admin…) |
| `pnpm run test:e2e:cleanup` | Nettoyage users de test |
| `pnpm run support:clear` | Vider conversations support (dev) |

Liste complète : `package.json` → `"scripts"`.

---

## Contribution

Workflow recommandé (**trunk-based**) :

1. `git checkout main && git pull`
2. Branche `feat/...` ou `fix/...`
3. Commits [Conventional Commits](https://www.conventionalcommits.org/) en **anglais** (`feat:`, `fix:`, `docs:`, …)
4. `pnpm run check` avant PR
5. Pull Request — review obligatoire, **ne pas push direct sur main** en mode équipe

---

## Support

- E-mail : support@moonskin.gg  
- Discord : [discord.gg/moonskin](https://discord.gg/moonskin)

---

*MoonSkin — vendez vos skins CS2 en toute transparence (timeline, frais, KYC, retraits SEPA & crypto).*
