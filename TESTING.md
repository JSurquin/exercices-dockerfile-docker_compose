# Guide de tests pour l'intégration GateFi

Ce document décrit comment tester l'intégration GateFi en environnement sandbox.

## Configuration du sandbox

### 1. Variables d'environnement

Dans votre fichier `.env.local`, utilisez les clés sandbox :

```bash
GATEFI_ENVIRONMENT=sandbox
GATEFI_API_KEY_PUBLIC=<votre-clé-sandbox-publique>
GATEFI_API_KEY_PRIVATE=<votre-clé-sandbox-privée>
GATEFI_PARTNER_ACCOUNT_ID=<votre-partner-id-sandbox>
```

### 2. URLs sandbox

Les services utilisent automatiquement les URLs sandbox :
- **OffRamp** : `https://api-sandbox.gatefi.com/offramp/v1`
- **OnRamp** : `https://api-sandbox.gatefi.com/onramp/v1`
- **Sumsub** : `https://test-api.sumsub.com` (si applicable)

## Tests manuels

### Test 1 : Configuration

Vérifier que la configuration est accessible :

```bash
curl http://localhost:3000/api/gatefi/configuration?type=all
```

Réponse attendue : Configuration OffRamp et OnRamp

### Test 2 : Quote SEPA

Obtenir un devis pour un paiement SEPA :

```bash
curl -X POST http://localhost:3000/api/gatefi/offramp/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fiatAmount": 10000,
    "crypto": "USDC",
    "region": "FR"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "quote": {
    "amountIn": "100.5",
    "amountOut": "99.00",
    "processingFee": "0.50",
    "rate": "1.0",
    "crypto": "USDC",
    "fiat": "EUR"
  }
}
```

### Test 3 : Quote Crypto

Obtenir un devis pour un paiement crypto :

```bash
curl -X POST http://localhost:3000/api/gatefi/onramp/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fiatAmount": 10000,
    "crypto": "USDT",
    "region": "FR"
  }'
```

### Test 4 : Initiation paiement SEPA

**Prérequis** : Être authentifié et avoir un payout créé

```bash
curl -X POST http://localhost:3000/api/gatefi/offramp/sell \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre-token>" \
  -d '{
    "payoutId": "payout_123",
    "amountCents": 10000,
    "cryptoAmount": "100.5",
    "crypto": "USDC",
    "region": "FR"
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "redirectUrl": "https://widget-sandbox.gatefi.com/...",
  "orderCustomId": "payout_123"
}
```

### Test 5 : Initiation paiement Crypto

```bash
curl -X POST http://localhost:3000/api/gatefi/onramp/buy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre-token>" \
  -d '{
    "payoutId": "payout_123",
    "amountCents": 10000,
    "crypto": "USDT",
    "region": "FR",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

### Test 6 : Statut KYC

```bash
curl http://localhost:3000/api/gatefi/kyc/status \
  -H "Authorization: Bearer <votre-token>"
```

### Test 7 : Webhook GateFi

Simuler un webhook de succès :

```bash
curl -X POST http://localhost:3000/api/gatefi/webhooks \
  -H "Content-Type: application/json" \
  -H "x-signature: <signature-calculée>" \
  -H "x-webhook-type: gatefi" \
  -d '{
    "orderCustomId": "payout_123",
    "status": "COMPLETED",
    "orderType": "SELL",
    "txHash": "0xabc123..."
  }'
```

### Test 8 : Cron job

Tester le traitement automatique des trades :

```bash
curl -X POST http://localhost:3000/api/cron/process-trades \
  -H "Authorization: Bearer <votre-cron-secret>"
```

## Tests d'intégration UI

### Test du flux complet SEPA

1. Se connecter avec Steam
2. Aller sur `/sell`
3. Créer un trade avec des skins
4. Attendre que le trade passe à `AVAILABLE` (ou forcer en DB pour test)
5. Cliquer sur "Retirer mes fonds"
6. Sélectionner "Virement SEPA"
7. Obtenir un devis
8. Confirmer le paiement
9. Être redirigé vers le widget GateFi
10. Compléter les informations bancaires (sandbox)
11. Vérifier que le statut est mis à jour

### Test du flux complet Crypto

1. Se connecter avec Steam
2. Aller sur `/sell`
3. Créer un trade avec des skins
4. Attendre que le trade passe à `AVAILABLE`
5. Cliquer sur "Retirer mes fonds"
6. Sélectionner "Crypto-monnaie"
7. Choisir USDT
8. Saisir une adresse wallet de test
9. Obtenir un devis
10. Confirmer le paiement
11. Être redirigé vers le widget GateFi
12. Finaliser le processus
13. Vérifier la transaction sur testnet

### Test du KYC

1. Se connecter
2. Aller sur `/kyc`
3. Cliquer sur "Démarrer la vérification"
4. Compléter le processus Sumsub (sandbox)
5. Vérifier que le statut KYC est mis à jour
6. Essayer d'initier un payout (devrait être autorisé)

## Tests unitaires

Exécuter les tests unitaires :

```bash
npm test
```

Tests couverts :
- Génération de signatures HMAC
- Construction de query strings
- Conversions de devises
- Validation des montants
- Validation des adresses wallet

## Cartes et données de test

### GateFi Sandbox

Selon la documentation GateFi, utiliser :
- **Carte de test** : Fournie dans la documentation GateFi
- **Montant** : Entre 10 EUR et 1000 EUR
- **IBAN de test** : Fourni dans la documentation

### Adresses crypto de test

- **Ethereum (Sepolia)** : `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **Bitcoin (Testnet)** : `tb1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq`
- **USDT/USDC (Testnet)** : Utiliser la même adresse Ethereum Sepolia

## Scénarios de test

### Scénario 1 : Premier paiement SEPA avec KYC

1. Nouveau compte utilisateur
2. Créer un trade
3. Trade passe à AVAILABLE
4. Tenter de faire un payout → KYC requis
5. Compléter le KYC
6. Initier le payout SEPA
7. Compléter le widget
8. Vérifier webhook de succès
9. Vérifier statut final = PAID

### Scénario 2 : Paiement crypto rapide

1. Utilisateur avec KYC validé
2. Trade disponible
3. Choisir paiement crypto
4. Saisir adresse wallet
5. Confirmer immédiatement
6. Vérifier transaction sur testnet

### Scénario 3 : Échec de paiement

1. Initier un paiement
2. Annuler dans le widget
3. Vérifier que le statut revient à FAILED
4. Vérifier que l'utilisateur peut réessayer

### Scénario 4 : Changement de méthode de paiement

1. Payout créé avec SEPA
2. Changer pour CRYPTO
3. Vérifier que les détails sont mis à jour
4. Compléter le paiement crypto

## Vérifications importantes

- [ ] Les signatures HMAC sont correctes
- [ ] Les montants sont toujours en centimes en base de données
- [ ] Les webhooks sont validés
- [ ] Le KYC bloque bien les paiements si non validé
- [ ] Les statuts sont mis à jour correctement
- [ ] Les logs d'audit sont créés
- [ ] Les erreurs sont gérées gracieusement
- [ ] Les redirections fonctionnent
- [ ] Le widget s'affiche correctement
- [ ] Le cron job traite les trades correctement

## Monitoring

Vérifier les logs dans la console :

```bash
[GateFi OffRamp] Transaction initiated: ...
[GateFi OnRamp] Payment completed: ...
[KYC] User verified: ...
[Cron] Trade processing completed: ...
[Webhook] Payment status updated: ...
```

## Problèmes courants

### Signature invalide
- Vérifier que les clés API sont correctes
- Vérifier que la query string est construite dans le bon ordre

### KYC non validé
- Compléter le processus Sumsub en sandbox
- Vérifier que le webhook Sumsub est reçu

### Widget ne s'affiche pas
- Vérifier la console pour les erreurs CORS
- Vérifier que l'URL de redirection est valide

### Paiement bloqué
- Vérifier le statut du trade
- Vérifier le statut KYC
- Vérifier les logs d'erreur

## Passage en production

Avant de passer en production :

1. Changer `GATEFI_ENVIRONMENT=production`
2. Utiliser les vraies clés API
3. Configurer les webhooks en production
4. Tester avec de petits montants réels
5. Activer le monitoring
6. Configurer les alertes

---

**Important** : Ne jamais utiliser de vraies informations bancaires ou de vraies clés API en environnement de développement !

