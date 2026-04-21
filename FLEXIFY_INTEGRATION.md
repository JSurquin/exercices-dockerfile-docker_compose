# Intégration Flexify - Documentation

## ✅ Corrections Appliquées

L'implémentation Flexify a été entièrement corrigée pour suivre la documentation officielle de l'API H2H (Host-to-Host) V1.

### 1. Authentification HMAC-SHA256

**Avant :** Signature simple avec headers custom (`X-Signature`, `X-Timestamp`, `X-API-Key`)

**Après :** Authentification conforme à la spec Flexify :
- Génération d'un `Digest` SHA-256 du body (pour POST)
- Construction du payload de signature : `host digest content-length date`
- Signature HMAC-SHA256 avec `apiSecret`
- Header `Authorization` au format : `Signature keyId="...", algorithm="HmacSHA256", headers="...", signature="..."`

### 2. URLs et Endpoints

**Avant :**
- Base URL unique : `https://api.flexify.finance`
- Endpoint : `/v1/payouts`

**Après :**
- **H2H Gate API** : `https://h2h.flexify.finance` (pour créer des transactions)
- **Reporting API** : `https://api.flexify.finance` (pour récupérer l'historique)
- Endpoints corrects :
  - Créer un payout : `POST /v1/payout` (singulier)
  - Créer un refund : `POST /v1/refund`
  - Reporting : `GET /v1/report/transaction`

### 3. Structure des Requêtes

**Avant :** Structure custom avec `merchantId`, `orderId`, `beneficiary`

**Après :** Structure conforme API V1 :
```json
{
  "method": "sepa",
  "mode": "initial",
  "reference": "MOON-xxxxx",
  "currency": "EUR",
  "amount": "100.00",
  "customer": {
    "identifier": "user_id",
    "email": "user@example.com",
    "country": "FR",
    "ip": "1.2.3.4"
  },
  "callback_url": "https://...",
  "sepa": {
    "iban": "FR76...",
    "bic": "BNPAFRPP",
    "holder_name": "John Doe"
  }
}
```

### 4. Gestion des Statuts

**Avant :** Statuts custom (`PENDING`, `PROCESSING`, `COMPLETED`, etc.)

**Après :** Statuts Flexify officiels :
- `new` : Transaction créée
- `pending` : En attente de traitement
- `success` : Succès ✅
- `declined` : Refusé
- `failed` : Échec
- `expired` : Expiré (20 min pour intention, 7 jours pour paiement)

### 5. Validation des Webhooks

**Avant :** Validation simple du HMAC

**Après :** Validation complète selon spec H2H :
1. Vérification du `keyId` dans `Authorization`
2. Vérification du `Digest` SHA-256 du body
3. Reconstruction du payload de signature
4. Comparaison sécurisée avec `timingSafeEqual`
5. Réponse HTTP 200 obligatoire sous 30 secondes

### 6. Gestion des Erreurs

Les codes d'erreur Flexify sont maintenant pris en compte :
- **0** : Succès
- **11** : Signature invalide
- **30/31** : Paramètres invalides
- **500** : Fonds insuffisants (côté marchand)
- **1020** : Fonds insuffisants (côté client)
- **1054** : Méthode de paiement non configurée

## 📋 Configuration Requise

### Variables d'Environnement

Copier `.env.example` et configurer :

```bash
# Clés API (depuis le portail Flexify)
FLEXIFY_API_KEY=votre-api-key
FLEXIFY_API_SECRET=votre-api-secret
FLEXIFY_MERCHANT_IDENTIFIER=MR_TEST  # Pour sandbox

# URLs
FLEXIFY_H2H_URL=https://h2h.flexify.finance
FLEXIFY_API_URL=https://api.flexify.finance
FLEXIFY_ENVIRONMENT=sandbox

# Callbacks
FLEXIFY_CALLBACK_URL=https://votredomaine.com/api/flexify/webhook
```

### ⚠️ Important : Whitelisting IP

**Votre IP serveur DOIT être whitelistée par Flexify** avant toute requête H2H ou HPP.

Contactez le support Flexify pour ajouter :
- IP de production
- IP de développement/staging si nécessaire

## 🔧 Utilisation

### Créer un Payout SEPA

```typescript
import { createSepaPayout } from '@/lib/flexify';

const result = await createSepaPayout({
  reference: 'MOON-1234-ABCD',
  amountCents: 10000, // 100.00 EUR
  customer: {
    identifier: userId,
    email: 'user@example.com',
    country: 'FR',
    ip: '1.2.3.4',
  },
  sepa: {
    iban: 'FR7630006000011234567890189',
    bic: 'BNPAFRPP',
    holderName: 'Jean Dupont',
  },
});

if (result.code === 0) {
  console.log('Transaction créée:', result.transaction.id);
}
```

### Créer un Payout Carte

```typescript
import { createCardPayout } from '@/lib/flexify';

const result = await createCardPayout({
  reference: 'MOON-1234-ABCD',
  amountCents: 5000, // 50.00 EUR
  customer: {
    identifier: userId,
    email: 'user@example.com',
    country: 'FR',
    ip: '1.2.3.4',
  },
  card: {
    number: '4242424242424242',
    holderName: 'JEAN DUPONT',
    expireMonth: '12',
    expireYear: '25',
    cvv: '123',
  },
});
```

### Récupérer le Statut

```typescript
import { getTransactionByReference } from '@/lib/flexify';

const transaction = await getTransactionByReference('MOON-1234-ABCD');
console.log('Statut:', transaction.transaction?.status);
```

## 🔐 Sécurité

### Conformité PCI DSS

⚠️ **L'intégration H2H nécessite la conformité PCI DSS** car vous manipulez des données de carte.

Pour les paiements par carte, considérez :
- Utiliser l'HPP (Hosted Payment Page) de Flexify à la place
- Obtenir la certification PCI DSS
- Ne jamais logger ou stocker les numéros de carte complets

### Gestion des Secrets

- ❌ Ne JAMAIS committer les clés API
- ✅ Utiliser des variables d'environnement
- ✅ Rotation régulière des secrets
- ✅ Accès restreint aux logs de production

## 📊 Reporting

L'API de reporting utilise **Basic Auth** (différent de H2H) :

```typescript
// Headers pour le reporting
Authorization: Basic base64(apiKey:apiSecret)
```

Paramètres requis :
- `merchant_identifier` : Votre identifiant marchand
- Plage de dates : `created_at_from`/`to` ou `updated_at_from`/`to`

## 🐛 Debugging

### Vérifier la Signature

Si les webhooks échouent, vérifier :
1. Le `Digest` correspond au body reçu
2. Le `keyId` est correct
3. Les headers sont dans le bon ordre : `host digest content-length date`
4. La signature est calculée avec le bon secret

### Logs

Les logs sont préfixés par :
- `[Flexify Payout]` : Création de transactions
- `[Flexify Webhook]` : Réception de webhooks

Activer les logs détaillés en développement :
```typescript
console.log('[Flexify Debug]', {
  digest,
  signaturePayload,
  expectedSignature,
});
```

## ✨ Améliorations Possibles

1. **Ajouter un champ CVV** dans le formulaire de payout par carte
2. **Implémenter la Balance API** pour vérifier les fonds disponibles
3. **Ajouter la tokenisation** pour les paiements récurrents
4. **Gérer l'overdraft** si activé sur le compte
5. **Ajouter des webhooks pour les événements** :
   - `transaction.created`
   - `transaction.pending`
   - `transaction.success`
   - `transaction.failed`

## 📚 Références

- Documentation Flexify H2H : Voir `.flexify.md`
- Portail Marchand : `https://my.flexify.finance`
- Support : contact@flexify.finance

## 🔄 Stratégie de Retry

Flexify réessaie les webhooks jusqu'à **15 fois** avec un backoff :
- Tentative 1 : +5s
- Tentative 2 : +15s
- ...
- Tentative 15 : +1h

Assurez-vous de :
- Répondre HTTP 200 sous 30s
- Être idempotent (même webhook peut arriver plusieurs fois)
- Logger les duplicatas pour investigation

## 🚀 Migration depuis l'Ancienne Version

Si vous avez des payouts en cours avec l'ancienne implémentation :

1. **Ne pas toucher aux payouts existants**
2. Les nouveaux payouts utiliseront la nouvelle API
3. Garder un système de fallback si nécessaire
4. Mapper les anciens statuts vers les nouveaux

---

**Date de mise à jour :** 12 février 2026
**Version :** 2.0.0 (Conformité H2H V1)
