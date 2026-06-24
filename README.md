# MoonSkin - Plateforme de vente de skins CS2

![MoonSkin Logo](public/images/logo.webp)

MoonSkin est une plateforme moderne et sécurisée qui permet aux joueurs de Counter-Strike 2 de vendre leurs skins contre de l'argent réel. Construite avec Next.js 15 et intégrée à l'API Skinplace, elle offre une expérience utilisateur exceptionnelle avec des paiements SEPA et crypto.

## 🚀 Fonctionnalités

### 🔐 Authentification & Sécurité
- **Connexion Steam OpenID** - Login joueur via Steam
- **Connexion Discord** - Alternative via Better Auth (Trade Link Steam requis pour vendre)
- **E-mail / mot de passe** - Comptes admin, modérateurs et affiliés
- **KYC obligatoire** - Processus de vérification d'identité complet
- **Chiffrement SSL 256-bit** - Protection maximale des données
- **Conformité RGPD** - Respect des réglementations européennes

### 💰 Système de Trading
- **Estimation en temps réel** - Prix basés sur l'API Skinplace v3
- **Trade automatisé** - Gestion complète du processus Steam
- **Timeline transparente** - Suivi en temps réel de vos trades
- **Support tous skins** - CS2 tradables, StatTrak™, avec stickers
- **Proxy API intelligent** - Cache, retry et gestion d'erreurs

### 💳 Paiements Sécurisés
- **SEPA & carte bancaire** - Via Flexify avec vérification renforcée (KYC, OTP)
- **Cryptomonnaies** - Via Whitepay (BTC, ETH, USDT, USDC, etc.)
- **Frais transparents** - 0,5% de cashout, pas de frais cachés
- **Paiements automatiques** - Après trade hold Steam (7 jours)

### 🎮 Gamification
- **Système XP** - Gagnez de l'expérience à chaque trade
- **Niveaux & Récompenses** - Débloquez des avantages
- **Tickets & Giveaways** - Participez aux concours
- **Tableau de classement** - Comparez vos performances

### 🎨 Interface Moderne
- **Design responsive** - Optimisé mobile et desktop
- **Thèmes dark/light** - Personnalisez votre expérience
- **Multilingue** - Français, Anglais, Chinois
- **Animations fluides** - Interface moderne avec Framer Motion

## 🛠️ Technologies

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: TailwindCSS + shadcn/ui
- **Animations**: Framer Motion
- **Graphiques**: Recharts
- **Icons**: Heroicons + Lucide React
- **Themes**: next-themes
- **Notifications**: Sonner
- **Internationalisation**: next-intl
- **TypeScript**: Support complet

### Backend & APIs
- **Auth**: Better Auth (Steam OpenID, Discord, e-mail)
- **Database**: PostgreSQL + Prisma ORM
- **Paiements**: Flexify (carte / SEPA), Whitepay (crypto)
- **KYC**: KYCAID
- **Trading**: Skinplace API v3 (proxy intelligent)
- **Cache / rate limiting**: Upstash Redis (prod) ou mémoire (dev)
- **Monitoring**: Sentry
- **Validation**: Zod schemas

## 📦 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/JSurquin/cashtrade.git
cd cashtrade
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configurer les variables d'environnement**
```bash
cp env.example .env.local
# Éditer .env.local avec vos clés API (voir env.example pour la liste complète)
```

4. **Démarrer le serveur de développement**
```bash
pnpm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 🌐 Variables d'environnement

Copier `env.example` vers `.env.local`. Variables principales :

```env
# Auth (Better Auth)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
STEAM_API_KEY=your-steam-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/cashtrade_dev

# Skinplace API v3
SKINPLACE_API_KEY_PRIVATE=your-skinplace-private-key
SKINPLACE_API_KEY_PUBLIC=your-skinplace-public-key
SKINPLACE_API_URL=https://api.skin.place

# Paiements
FLEXIFY_API_KEY=your-flexify-api-key
FLEXIFY_API_SECRET=your-flexify-api-secret
WHITEPAY_API_KEY=your-whitepay-api-key
WHITEPAY_SECRET_KEY=your-whitepay-secret-key

# KYC (KYCAID)
KYCAID_API_TOKEN=your-kycaid-api-token
KYCAID_FORM_ID=your-kycaid-form-id
```

Voir `env.example` pour Flexify, Whitepay, KYCAID, Sentry, SMTP et le reste de la configuration.

## 📁 Structure du projet

```
src/app/              # Pages et routes API (App Router)
  admin/              # Backoffice
  api/                # Routes API (auth, skinplace, flexify, whitepay, kycaid…)
  dashboard/          # Espace utilisateur
  sell/               # Vente de skins
  payout/             # Retraits
  kyc/                # Vérification d'identité
  giveaways/          # Concours
  affiliate/          # Espace affilié
src/components/       # Composants React (ui, layout, sell, admin…)
src/hooks/            # Hooks React
src/lib/              # Services, utilitaires, i18n, sécurité
lib/                  # Auth Better Auth (auth.ts, auth-client.ts)
prisma/               # Schéma PostgreSQL et migrations
e2e/                  # Tests Playwright
scripts/              # Scripts CLI (cron, seed, réconciliation…)
```

## 🔧 Scripts disponibles

```bash
# Développement
pnpm run dev              # Serveur de dev (Turbopack)
pnpm run build            # Build de production
pnpm run start            # Serveur de production
pnpm run lint             # ESLint
pnpm run check            # Prisma generate + ESLint + TypeScript

# Base de données
pnpm run db:seed          # Peupler la base (seed Prisma)
npx prisma generate       # Générer le client Prisma
npx prisma migrate dev    # Appliquer les migrations en dev
npx prisma studio         # Interface Prisma Studio

# Tests
pnpm run test             # Tests unitaires (Jest)
pnpm run test:e2e         # Tests end-to-end (Playwright)
pnpm run test:e2e:smoke   # Smoke tests Playwright

# Cron / maintenance
pnpm run cron:worker      # Worker cron (trades, giveaways…)
```

## 🚦 Roadmap

### Phase 1 - MVP ✅
- [x] Authentification Steam
- [x] Processus de vente basic
- [x] KYC simple
- [x] Paiements SEPA
- [x] Interface utilisateur

### Phase 2 - Fonctionnalités avancées ✅
- [x] Support crypto (Whitepay)
- [x] Système de gamification
- [x] Interface admin complète
- [x] Support multilingue
- [x] Mobile responsive
- [x] Intégration Skinplace API v3

### Phase 3 - Optimisations ✅
- [x] Proxy API Skinplace intelligent
- [x] Base de données PostgreSQL
- [x] Cache intelligent (Memory/Redis)
- [x] TypeScript strict mode
- [x] Build optimisé Next.js 15

### Phase 4 - Extensions 📋
- [x] Tests automatisés (Jest, Playwright)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Application mobile (React Native)
- [ ] API publique (OpenAPI)
- [ ] Programme d'affiliation étendu
- [ ] Support autres jeux (Dota 2, TF2)

## 🔒 Sécurité

### Mesures de sécurité implémentées
- **Rate limiting** - Protection contre les attaques DDoS
- **Validation des données** - Sanitisation de tous les inputs
- **Chiffrement** - SSL/TLS pour toutes les communications
- **CSRF Protection** - Tokens anti-CSRF
- **Session sécurisée** - Gestion sécurisée des sessions
- **Audit logs** - Journal de toutes les actions sensibles

### Compliance
- **RGPD** - Droit à l'oubli, export des données
- **AML** - Lutte contre le blanchiment d'argent
- **KYC** - Know Your Customer obligatoire
- **PCI DSS** - Standards de sécurité pour les paiements

## 🆔 Architecture KYC

Le système KYC utilise KYCAID avec l'architecture complète conforme AMLD5/AMLD6 pour garantir la conformité réglementaire européenne.

### Entités du système

- **Applicants** - Entité racine représentant une personne ou une entreprise
- **Addresses** - Proof of Address obligatoire (conforme AMLD5)
- **Documents** - Pièces d'identité vérifiées (ID, passport, selfie)
- **Files** - Stockage binaire séparé pour les documents
- **Verifications** - Processus de vérification avec AML/PEP checks

### Flow utilisateur

1. **Création de l'applicant** - Enregistrement initial de l'utilisateur
2. **Soumission de l'adresse** - Proof of Address (adresse de résidence)
3. **Upload des documents** - Carte d'identité/Passeport + Selfie
4. **Vérification automatique** - Processus KYCAID (< 5 minutes)
5. **Résultat** - VERIFIED, REJECTED, ou PENDING

### Endpoints API KYC

```
POST   /api/kycaid/initiate      # Initier le processus KYC
GET    /api/kycaid/status        # Statut de la vérification
POST   /api/kycaid/address       # Soumettre l'adresse
GET    /api/kycaid/address       # Récupérer l'adresse
POST   /api/kycaid/document      # Upload de documents
POST   /api/kycaid/webhook       # Webhook KYCAID
```

### Configuration requise

Variables d'environnement KYCAID :

```env
KYCAID_API_TOKEN=your-kycaid-api-token
KYCAID_FORM_ID=your-kycaid-form-id
KYCAID_BASE_URL=https://api.kycaid.com
KYCAID_SANDBOX_MODE=true
KYCAID_CALLBACK_URL=
KYCAID_REDIRECT_URL=http://localhost:3000/kyc/complete
```

### Tests

Script de test du flow KYC (nécessite `.env.local` configuré) :

```bash
npx tsx scripts/test-kyc-flow.ts full
npx tsx scripts/test-kyc-flow.ts applicant
npx tsx scripts/test-kyc-flow.ts address <applicant_id>
```

### Conformité réglementaire

- ✅ **AMLD5 / AMLD6** - Proof of Address obligatoire
- ✅ **eIDAS** - Documents structurés conformes
- ✅ **RGPD** - Métadonnées séparées, audit trail complet
- ✅ **Banque / Fintech** - Standards européens

### Architecture technique

```
User → Applicant KYCAID
  ├── Addresses (1..n)     # Proof of Address
  ├── Documents (1..n)     # ID, Passport, etc.
  │   └── Files (1..n)     # Binaires séparés
  └── Verifications (1..n) # Processus de vérification
```

## 🔧 API Skinplace

### Endpoints disponibles
```
GET    /api/skinplace/inventory                    # Inventaire Steam
POST   /api/skinplace/inventory/multiple          # Inventaires multiples
POST   /api/skinplace/trade                       # Créer un trade
GET    /api/skinplace/trade/{token}               # Statut du trade
POST   /api/skinplace/purchase                    # Acheter des items
GET    /api/skinplace/purchase/history            # Historique achats
GET    /api/skinplace/balance                     # Solde utilisateur
GET    /api/skinplace/hold                        # Hold orders
GET    /api/skinplace/items/listing               # Items en vente
```

### Fonctionnalités
- **Cache intelligent** - 5 minutes TTL
- **Retry automatique** - 3 tentatives avec backoff
- **Gestion d'erreurs** - Types TypeScript stricts
- **Rate limiting** - Protection anti-abuse
- **Validation** - Paramètres et authentification

## 📊 Analytics & Monitoring

- **Performance** - Monitoring des temps de réponse
- **Erreurs** - Tracking et alertes automatiques
- **Business** - Métriques de conversion et volume
- **Sécurité** - Détection d'activités suspectes

## 🌍 Internationalisation

Langues supportées :
- 🇫🇷 **Français** - Langue principale
- 🇺🇸 **Anglais** - Marché international
- 🇨🇳 **Chinois** - Marché asiatique

Ajout de nouvelles langues via le système next-intl.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Conventions de commit
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, missing semi colons, etc
- `refactor:` - Refactoring du code
- `test:` - Ajout de tests
- `chore:` - Maintenance

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- **Email**: support@moonskin.gg
- **Discord**: [discord.gg/moonskin](https://discord.gg/moonskin)

---

**Développé avec ❤️ par l'équipe MoonSkin**

*Vendez vos skins CS2 en toute sécurité et simplicité !*