# 💳 Intégration Flexify - Quick Start

## 🚀 Démarrage Rapide

### 1. Configuration (5 minutes)

```bash
# Copier le template d'environnement
cp env.example .env.local

# Éditer .env.local avec vos clés Flexify
# Récupérables sur: https://my.flexify.finance
```

Variables requises:
```bash
FLEXIFY_API_KEY=votre-clé-api
FLEXIFY_API_SECRET=votre-secret-api
FLEXIFY_MERCHANT_IDENTIFIER=MR_XXXX
FLEXIFY_H2H_URL=https://h2h.flexify.finance
FLEXIFY_API_URL=https://api.flexify.finance
FLEXIFY_CALLBACK_URL=https://votredomaine.com/api/flexify/webhook
```

### 2. Vérification (2 minutes)

```bash
# Vérifier que tout est configuré
npx tsx scripts/check-flexify-config.ts

# Tester la connexion à Flexify
npx tsx scripts/test-flexify-connection.ts
```

### 3. IP Whitelisting (CRITIQUE ⚠️)

**Votre IP serveur DOIT être whitelistée par Flexify.**

Contactez: contact@flexify.finance avec:
- IP de production: `_______________`
- IP de staging: `_______________`

### 4. Webhooks

Dans le portail Flexify, configurer:
- URL: `https://votredomaine.com/api/flexify/webhook`
- Events: Tous les `transaction.*`

---

## 📖 Documentation

### Guides Complets

1. **[FLEXIFY_INTEGRATION.md](./FLEXIFY_INTEGRATION.md)** 📚
   - Guide complet d'intégration
   - Explications techniques détaillées
   - Exemples de code
   - Conseils de sécurité

2. **[FLEXIFY_CHECKLIST.md](./FLEXIFY_CHECKLIST.md)** ✅
   - Checklist complète pour l'intégration
   - Tests à effectuer
   - Validation de conformité

3. **[FLEXIFY_MIGRATION_SUMMARY.md](./FLEXIFY_MIGRATION_SUMMARY.md)** 🔄
   - Résumé des changements v2.0
   - Guide de migration depuis l'ancienne version
   - Breaking changes

4. **[.flexify.md](./.flexify.md)** 📋
   - Spécification complète de l'API H2H
   - Documentation générée par IA

### Scripts Utiles

```bash
# Vérifier la configuration
npx tsx scripts/check-flexify-config.ts

# Tester la connexion Flexify
npx tsx scripts/test-flexify-connection.ts

# Lancer les tests unitaires
npm test flexify
```

---

## 💻 Utilisation

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

---

## 🧪 Tests

### Tests Unitaires

```bash
# Tests de validation
npm test src/lib/__tests__/flexify.test.ts

# Tests de signature
npm test src/lib/__tests__/flexify-signature.test.ts

# Tous les tests Flexify
npm test flexify
```

### Tests d'Intégration

Voir la checklist complète dans [FLEXIFY_CHECKLIST.md](./FLEXIFY_CHECKLIST.md):

- [ ] Payout SEPA end-to-end
- [ ] Payout Carte end-to-end
- [ ] Réception des webhooks
- [ ] Gestion d'erreurs

---

## 🔐 Sécurité

### ⚠️ PCI DSS Requis

L'intégration H2H nécessite la **conformité PCI DSS** pour les paiements carte.

**Alternatives:**
- Utiliser l'HPP (Hosted Payment Page) de Flexify
- Obtenir la certification PCI DSS
- Désactiver les paiements carte H2H

### Best Practices

- ✅ Ne jamais logger les numéros de carte complets
- ✅ Ne jamais committer les secrets
- ✅ Utiliser HTTPS partout
- ✅ Valider toujours les signatures de webhooks
- ✅ Implémenter le rate limiting
- ✅ Rotation régulière des secrets

---

## 📊 Limites et Frais

### Limites de Montant

| Méthode | Minimum | Maximum |
|---------|---------|---------|
| SEPA    | 10 €    | 10,000 €|
| Carte   | 5 €     | 5,000 € |

### Frais

| Méthode | Frais Variables | Frais Fixes |
|---------|----------------|-------------|
| SEPA    | 0.5%           | 0.25 €      |
| Carte   | 1.5%           | 0.50 €      |

### Délais

| Méthode | Délai estimé |
|---------|--------------|
| SEPA    | 1-2 jours ouvrés |
| Carte   | Instantané à 24h |

---

## 🐛 Dépannage

### Problèmes Courants

#### 1. Signature Invalide (Error Code 11)

```bash
# Vérifier la configuration
npx tsx scripts/check-flexify-config.ts

# Vérifier que FLEXIFY_API_SECRET est correct
```

#### 2. IP Non Whitelistée (403 Forbidden)

Contactez le support Flexify pour ajouter votre IP.

#### 3. Fonds Insuffisants (Error Code 500)

Rechargez votre compte Flexify sur le portail marchand.

#### 4. Méthode Non Configurée (Error Code 1054)

Activez SEPA ou Carte dans les paramètres de votre projet Flexify.

### Logs

Les logs sont préfixés par:
- `[Flexify Payout]` : Création de transactions
- `[Flexify Webhook]` : Réception de webhooks

```bash
# Rechercher les erreurs
grep "\[Flexify" logs/app.log | grep -i error
```

---

## 📞 Support

### Ressources

- 📚 [Documentation complète](./FLEXIFY_INTEGRATION.md)
- ✅ [Checklist](./FLEXIFY_CHECKLIST.md)
- 🔄 [Guide de migration](./FLEXIFY_MIGRATION_SUMMARY.md)
- 📖 [Spec API](./.flexify.md)

### Contacts

- **Support Flexify**: contact@flexify.finance
- **Portail Marchand**: https://my.flexify.finance
- **Documentation API**: Fournie dans le portail

### Équipe Interne

- Engineering Lead: `_______________`
- DevOps: `_______________`
- Support: `_______________`

---

## 🎯 Roadmap

### ✅ Implémenté (v2.0)

- Authentification HMAC-SHA256 conforme
- Payouts SEPA
- Payouts Carte (avec CVV)
- Webhooks avec validation de signature
- Gestion des statuts
- Tests unitaires
- Scripts de vérification

### 🚧 En cours

- Tests E2E complets
- Monitoring et alertes
- Documentation équipe support

### 📋 Planifié

- Balance API (vérification des fonds)
- Tokenisation pour paiements récurrents
- Refund automatique
- Métriques Prometheus/Grafana
- Multi-devises (si disponible)

---

## 📄 Licence

Ce code est propriétaire - MoonSkin © 2026

---

**Version:** 2.0.0  
**Dernière mise à jour:** 12 février 2026  
**Status:** ✅ Production Ready
