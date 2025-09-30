# Intégration Stripe - CashTrade

## Configuration

### Variables d'environnement

Ajoutez ces variables à votre fichier `.env.local` :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_ton-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_ton-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_ton-stripe-webhook-secret
STRIPE_WEBHOOK_ENDPOINT_SECRET=whsec_ton-webhook-endpoint-secret
```

### Installation des dépendances

```bash
pnpm install
```

## Fonctionnalités Stripe

### 1. Paiements sécurisés
- **Cartes bancaires** : Visa, Mastercard, American Express
- **SEPA** : Virements bancaires européens
- **3D Secure** : Authentification renforcée automatique

### 2. Composants Frontend

#### StripePaymentForm
```tsx
import { StripePaymentForm } from '@/components/ui/stripe-payment-form';

<StripePaymentForm
  tradeId="trade_123"
  ticketId="TICK-20241201-0001"
  amount={15000} // en centimes
  onSuccess={(paymentIntentId) => console.log('Paiement réussi')}
  onError={(error) => console.error('Erreur:', error)}
  onCancel={() => console.log('Paiement annulé')}
/>
```

#### PaymentMethodsList
```tsx
import { PaymentMethodsList } from '@/components/ui/payment-methods-list';

<PaymentMethodsList
  onAddNew={() => console.log('Ajouter méthode')}
  onSelect={(id) => console.log('Sélectionné:', id)}
  selectedId="pm_123"
/>
```

### 3. API Routes

#### Créer un PaymentIntent
```bash
POST /api/stripe/create-payment-intent
{
  "tradeId": "trade_123",
  "ticketId": "TICK-20241201-0001",
  "amount": 15000
}
```

#### Confirmer un paiement
```bash
POST /api/stripe/confirm-payment
{
  "paymentIntentId": "pi_123",
  "paymentMethodId": "pm_123"
}
```

#### Webhook Stripe
```bash
POST /api/stripe/webhook
```

## Dashboard Admin

### Accès
Le dashboard admin est accessible via `/admin/dashboard` (pas de lien dans le menu pour l'instant).

### Fonctionnalités

#### 1. Vue d'ensemble
- **Statistiques en temps réel** : Utilisateurs, trades, volume, paiements
- **Graphiques mensuels** : Évolution des métriques
- **Top utilisateurs** : Classement par volume
- **Alertes** : KYC en attente, paiements bloqués

#### 2. Gestion des Trades
- **Filtres avancés** : Statut, utilisateur, date, recherche
- **Actions** : Voir détails, modifier statut
- **Export CSV/Excel** : Données complètes

#### 3. Gestion des Utilisateurs
- **Profil complet** : Steam ID, KYC, niveau, volume
- **Filtres KYC** : En attente, vérifié, rejeté
- **Actions** : Voir profil, gérer KYC

#### 4. Gestion des Paiements
- **Suivi complet** : SEPA, crypto, Stripe
- **Statuts détaillés** : En attente, vérifié, payé, échoué
- **Filtres** : Type, statut, montant, date

#### 5. Validation KYC
- **Documents** : Carte d'identité, passeport, selfie, justificatif
- **Actions** : Approuver, rejeter avec raison
- **Historique** : Toutes les modifications

#### 6. Exports de Données
- **Types** : Trades, utilisateurs, paiements, KYC, affiliés, giveaways
- **Formats** : CSV, Excel
- **Filtres** : Date, statut, utilisateur
- **Historique** : Derniers exports

### API Admin

#### Statistiques
```bash
GET /api/admin/stats
```

#### Trades
```bash
GET /api/admin/trades?status=payé&page=1&limit=20
```

#### Utilisateurs
```bash
GET /api/admin/users?status=verified&search=ProTrader
```

#### Paiements
```bash
GET /api/admin/payouts?status=en_attente
```

#### KYC
```bash
GET /api/admin/kyc?status=pending
```

#### Exports
```bash
GET /api/admin/exports?type=trades&format=csv&dateFrom=2024-01-01&dateTo=2024-12-31
```

## Sécurité

### 1. Authentification
- **Steam OpenID** : Authentification unique
- **Sessions sécurisées** : JWT avec refresh tokens
- **RBAC** : Rôles admin/utilisateur

### 2. Paiements
- **Chiffrement** : Toutes les données sensibles chiffrées
- **PCI DSS** : Conformité via Stripe
- **Webhooks** : Vérification des signatures

### 3. Données
- **RGPD** : Export/suppression des données
- **Audit** : Logs de toutes les actions
- **Backup** : Sauvegardes automatiques

## Déploiement

### 1. Variables de production
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Webhooks Stripe
Configurez ces endpoints dans votre dashboard Stripe :
- `https://votre-domaine.com/api/stripe/webhook`

### 3. Base de données
- **PostgreSQL** : Données principales
- **Redis** : Cache et sessions
- **Migrations** : Automatiques au déploiement

## Monitoring

### 1. Logs
- **Stripe** : Tous les événements de paiement
- **Admin** : Actions sur le dashboard
- **Erreurs** : Stack traces complètes

### 2. Métriques
- **Volume** : Trades et paiements
- **Performance** : Temps de réponse API
- **Erreurs** : Taux d'échec par endpoint

### 3. Alertes
- **Paiements échoués** : > 5% en 1h
- **KYC bloqués** : > 10 en attente
- **Erreurs critiques** : 500, timeouts

## Support

### 1. Documentation
- **API** : OpenAPI/Swagger
- **Composants** : Storybook
- **Tests** : Jest + Playwright

### 2. Contact
- **Développement** : dev@ctf.interne
- **Sécurité** : sécurité@ctf.interne
- **Conformité** : conformité@ctf.interne
