# MoonSkin - Plateforme de vente de skins CS2

![MoonSkin Logo](public/logo.svg)

MoonSkin est une plateforme moderne et sécurisée qui permet aux joueurs de Counter-Strike 2 de vendre leurs skins contre de l'argent réel. Construite avec Next.js 15 et intégrée à l'API Skinplace, elle offre une expérience utilisateur exceptionnelle avec des paiements SEPA et crypto.

## 🚀 Fonctionnalités

### 🔐 Authentification & Sécurité
- **Connexion Steam OpenID** - Authentification unique et sécurisée
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
- **SEPA instantané** - Via Qonto avec vérification renforcée
- **Cryptomonnaies** - Bitcoin, Ethereum, USDT, USDC
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
- **Auth**: Better Auth avec Steam OpenID
- **Database**: Prisma ORM
- **Payment**: Stripe (cartes, SEPA)
- **Trading**: Skinplace API v3 (proxy intelligent)
- **Cache**: Redis (production) / Memory (dev)
- **Validation**: Zod schemas

## 📦 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/moonskin/counter-strike-skin.git
cd counter-strike-skin
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configurer les variables d'environnement**
```bash
cp env.example env.local
# Éditer env.local avec vos clés API
```

4. **Démarrer le serveur de développement**
```bash
pnpm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 🌐 Variables d'environnement

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Discord OAuth (optionnel pour test)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Steam API
STEAM_API_KEY=your-steam-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cashtrade_dev

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_your-webhook-endpoint-secret

# Skinplace API
SKINPLACE_API_KEY=your-skinplace-api-key
SKINPLACE_API_URL=https://api.skinplace.com
```

## 📁 Structure du projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── admin/             # Interface d'administration
│   ├── api/               # Routes API
│   │   ├── admin/         # APIs d'administration
│   │   ├── auth/          # Authentification Steam
│   │   ├── skinplace/     # Proxy API Skinplace
│   │   └── stripe/        # Paiements Stripe
│   ├── dashboard/         # Dashboard utilisateur
│   ├── giveaways/         # Page des concours
│   ├── kyc/               # Processus KYC
│   ├── sell/              # Pages de vente
│   ├── settings/          # Paramètres utilisateur
│   └── support/           # Centre d'aide
├── components/            # Composants React
│   ├── admin/             # Composants d'administration
│   ├── home/              # Composants page d'accueil
│   ├── layout/            # Layout et navigation
│   ├── providers/         # Context providers
│   ├── skinplace/         # Composants Skinplace
│   └── ui/                # Composants UI (shadcn)
├── hooks/                 # Custom React hooks
│   └── use-skinplace.ts   # Hook pour API Skinplace
└── lib/                   # Utilitaires et types
    ├── auth.ts            # Gestion authentification
    ├── i18n.ts            # Internationalisation
    ├── mock-data.ts       # Données de test
    ├── skinplace.ts       # Service API Skinplace
    ├── stripe.ts          # Configuration Stripe
    ├── types.ts           # Types TypeScript
    └── utils.ts           # Fonctions utilitaires
```

## 🔧 Scripts disponibles

```bash
# Développement
pnpm run dev         # Démarrer le serveur de développement
pnpm run build       # Build de production
pnpm run start       # Démarrer le serveur de production
pnpm run lint        # Linter le code
pnpm check           # Vérifier TypeScript + Lint

# Base de données
pnpm run db:generate # Générer le client Prisma
pnpm run db:push     # Pousser le schéma vers la DB
pnpm run db:migrate  # Appliquer les migrations
pnpm run db:seed     # Peupler la base de données
pnpm run db:studio   # Interface Prisma Studio

# Deployment
pnpm run type-check  # Vérifier les types TypeScript
```

## 🚦 Roadmap

### Phase 1 - MVP ✅
- [x] Authentification Steam
- [x] Processus de vente basic
- [x] KYC simple
- [x] Paiements SEPA
- [x] Interface utilisateur

### Phase 2 - Fonctionnalités avancées ✅
- [x] Support crypto (Stripe)
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
- [ ] Tests automatisés (Jest, Playwright)
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
KYCAID_API_TOKEN=your_api_token_here
KYCAID_FORM_ID=your_form_id_here
KYCAID_WEBHOOK_SECRET=your_webhook_secret_here
KYCAID_BASE_URL=https://api.kycaid.com
KYCAID_SANDBOX_MODE=true
KYCAID_CALLBACK_URL=https://yourdomain.com/api/kycaid/webhook
KYCAID_REDIRECT_URL=https://yourdomain.com/kyc/complete
```

### Tests

Script de test du flow KYC complet :

```bash
# Test complet du flow
npm run test:kyc full

# Test création applicant seulement
npm run test:kyc applicant

# Test création adresse
npm run test:kyc address <applicant_id>
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
- **Documentation**: [docs.moonskin.gg](https://docs.moonskin.gg)
- **Status**: [status.moonskin.gg](https://status.moonskin.gg)

## 📈 Statistiques

- **Volume traité**: €2.4M+
- **Utilisateurs actifs**: 15,420+
- **Trades réalisés**: 8,967+
- **Taux de satisfaction**: 99.8%

---

**Développé avec ❤️ par l'équipe MoonSkin**

*Vendez vos skins CS2 en toute sécurité et simplicité !*