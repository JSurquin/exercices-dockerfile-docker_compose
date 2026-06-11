# Système d'Affiliation MoonSkin

## Vue d'ensemble

Le système d'affiliation permet aux créateurs de contenu de gagner des commissions en référant de nouveaux utilisateurs à la plateforme MoonSkin. Les affiliés reçoivent 2% du volume brut généré par leurs référrals.

## Architecture

### Modèles de Base de Données

#### AffiliateStats
- **id**: Identifiant unique
- **userId**: Référence vers l'utilisateur affilié
- **code**: Code d'affiliation unique (ex: "streamer123")
- **totalReferrals**: Nombre total de référrals
- **totalVolumeCents**: Volume total généré en centimes
- **totalCommissionCents**: Commissions totales gagnées en centimes
- **commissionRate**: Taux de commission (défaut: 0.02 = 2%)
- **isActive**: Statut actif/inactif

#### AffiliateReferral
- **id**: Identifiant unique
- **affiliateId**: Référence vers AffiliateStats
- **referredUserId**: Utilisateur référé
- **tradeId**: Trade associé (optionnel)
- **volumeCents**: Volume généré par ce référral
- **commissionCents**: Commission générée

#### AffiliateCommission
- **id**: Identifiant unique
- **affiliateId**: Référence vers AffiliateStats
- **referralId**: Référence vers AffiliateReferral
- **amountCents**: Montant de la commission
- **status**: PENDING | PAYOUT_REQUESTED | APPROVED | CREDITED | PAID | CANCELLED
- **balanceCreditedAt**: Horodatage du crédit sur balanceCents
- **payoutId**: Référence vers le payout (si payé)

### Rôles Utilisateur

Le système étend l'enum `UserRole` avec :
- **USER**: Utilisateur standard
- **ADMIN**: Administrateur
- **AFFILIATE**: Utilisateur affilié (peut aussi faire des trades)

## Fonctionnalités

### 1. Tracking des Référrals

#### Middleware de Tracking
- Capture automatiquement les paramètres `?ref=CODE` et `?affiliate=CODE`
- Stocke le code dans un cookie `ctf_affiliate_ref` (30 jours)
- Nettoie l'URL pour éviter l'exposition du code

#### Association Automatique
- Lors de l'inscription/première connexion, associe l'utilisateur à l'affilié
- Évite l'auto-référencement
- Crée automatiquement un enregistrement `AffiliateReferral`

### 2. Calcul des Commissions

#### Hooks de Trade
Le système utilise `TradeHooks` pour calculer automatiquement les commissions :

```typescript
// Appelé quand un trade passe au statut PAID
await TradeHooks.onTradePaid(tradeId);

// Appelé lors de la création d'un trade
await TradeHooks.onTradeCreated(userId, tradeId);
```

#### Règles de Calcul
- Commission = Volume brut × Taux de commission
- Calculé uniquement sur les trades avec statut `PAID`
- Commissions créées en statut `PENDING`
- Mise à jour automatique des statistiques d'affilié

### 3. Panneau Affilié (`/affiliate`)

#### Candidature
- Formulaire de candidature avec motivation et liens sociaux
- Vérification KYC obligatoire
- Génération automatique du code d'affiliation

#### Dashboard
- **Métriques**: Référrals, volume, commissions, taux de conversion
- **Référrals**: Liste des utilisateurs référés avec leurs trades
- **Commissions**: Historique et statut des commissions
- **Outils**: Générateur de liens d'affiliation

#### Fonctionnalités
- Génération de liens personnalisés
- Copie automatique dans le presse-papiers
- Statistiques en temps réel
- Demande de paiement des commissions

### 4. Administration (`/admin/dashboard`)

#### Gestion des Affiliés
- Liste de tous les affiliés avec filtres et recherche
- Activation/désactivation des comptes
- Modification des taux de commission
- Statistiques globales

#### Gestion des Commissions
- Vue de toutes les commissions par statut
- Approbation/rejet en lot
- Création de payouts pour les commissions approuvées
- Historique des paiements

#### Outils d'Administration
- Recalcul des commissions par affilié
- Traitement forcé d'un trade
- Recalcul global (opération lourde)

## API Endpoints

### Affiliés
- `POST /api/affiliate/apply` - Candidature d'affiliation
- `GET /api/affiliate/stats?userId=X` - Statistiques d'un affilié
- `GET /api/affiliate/commissions?userId=X&status=Y` - Commissions d'un affilié
- `POST /api/affiliate/link` - Génération de lien d'affiliation

### Administration
- `GET /api/admin/affiliates` - Liste des affiliés (avec pagination)
- `POST /api/admin/affiliates` - Actions sur les affiliés
- `GET /api/admin/affiliates/commissions` - Liste des commissions
- `POST /api/admin/affiliates/commissions` - Actions sur les commissions
- `POST /api/admin/affiliates/recalculate` - Outils de recalcul

## Services

### AffiliateService
Service principal pour la gestion des affiliations :

```typescript
// Créer un compte affilié
await AffiliateService.createAffiliateAccount(userId, commissionRate);

// Associer un utilisateur à un affilié
await AffiliateService.associateUserToAffiliate(userId, affiliateCode);

// Calculer les commissions pour un trade
await AffiliateService.calculateCommissionForTrade(tradeId);

// Générer un lien d'affiliation
const link = AffiliateService.generateAffiliateLink(code, path);
```

### TradeHooks
Système de hooks pour les événements de trade :

```typescript
// Hook appelé lors du paiement d'un trade
await TradeHooks.onTradePaid(tradeId);

// Hook appelé lors de la création d'un trade
await TradeHooks.onTradeCreated(userId, tradeId);

// Recalcul des commissions d'un affilié
await TradeHooks.recalculateAffiliateCommissions(affiliateId);
```

## Configuration

### Variables d'Environnement
```env
NEXT_PUBLIC_APP_URL=https://moonskin.fr  # URL de base pour les liens d'affiliation
```

### Paramètres par Défaut
- **Taux de commission**: 2% (0.02)
- **Durée du cookie**: 30 jours
- **Statut initial**: PENDING pour les commissions

## Sécurité

### Validation
- Vérification KYC obligatoire pour devenir affilié
- Évitement de l'auto-référencement
- Validation des taux de commission (0-100%)

### Audit
- Journalisation de toutes les actions d'administration
- Traçabilité des changements de statut
- Historique des modifications de taux

### Anti-fraude
- Limitation des demandes par IP
- Vérification de l'appartenance des trades
- Cooldown sur les changements de paramètres

## Flux de Fonctionnement

### 1. Devenir Affilié
1. Utilisateur remplit le formulaire de candidature
2. Vérification KYC obligatoire
3. Génération automatique du code d'affiliation
4. Activation du compte affilié

### 2. Référer un Utilisateur
1. Affilié partage son lien `https://moonskin.fr?ref=CODE`
2. Utilisateur clique et le code est stocké en cookie
3. Utilisateur s'inscrit/se connecte via Steam
4. Association automatique à l'affilié

### 3. Génération de Commission
1. Utilisateur référé effectue un trade
2. Trade passe au statut PAID
3. Hook automatique calcule la commission
4. Commission créée en statut PENDING
5. Mise à jour des statistiques d'affilié

### 4. Paiement des Commissions

1. La vente du filleul est validée (~7 jours, ou instant + 8 jours)
2. Hook `onTradeAvailable` → `calculateCommissionForTrade`
3. Commission créée en statut `CREDITED` + `creditBalance` sur `balanceCents` de l'affilié
4. L'affilié retire via le flux payout classique (même solde que ses ventes perso)
5. Annulation fraude admin : `cancelCommissionById` débite le solde si déjà crédité

### Rattrapage legacy

`POST /api/admin/affiliates/commissions/backfill` — crédite les commissions `PENDING` sans `balanceCreditedAt`.

## Maintenance

### Recalcul des Commissions
En cas de problème ou de changement de taux :

```typescript
// Recalculer pour un affilié spécifique
await TradeHooks.recalculateAffiliateCommissions(affiliateId);

// Via l'API admin
POST /api/admin/affiliates/recalculate
{
  "action": "recalculate_affiliate",
  "affiliateId": "affiliate_xxx"
}
```

### Monitoring
- Surveiller les taux de conversion
- Vérifier les commissions en attente
- Contrôler les volumes générés
- Audit des paiements

## Conformité

### RGPD
- Export des données d'affiliation
- Suppression des données (sauf obligations légales)
- Consentement pour le tracking

### Comptabilité
- Export des commissions pour déclaration
- Historique des paiements
- Justificatifs de versement

## Migration

Pour activer le système sur une base existante :

```sql
-- Exécuter la migration
npx prisma migrate deploy

-- Ou appliquer manuellement
psql -d database < prisma/migrations/20251007000000_add_affiliate_system/migration.sql
```

## Tests

### Tests Unitaires
- Calcul des commissions
- Génération des codes d'affiliation
- Validation des taux

### Tests d'Intégration
- Flux complet de référral
- Calcul automatique des commissions
- Paiement des commissions

### Tests E2E
- Candidature d'affiliation
- Référral d'un utilisateur
- Trade et génération de commission
- Paiement via admin

## Support

Pour toute question sur le système d'affiliation :
- Documentation technique : Ce fichier
- API Documentation : OpenAPI/Swagger
- Support technique : support@moonskin.fr