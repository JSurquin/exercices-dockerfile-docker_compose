# Intégration Skinplace API

Ce document décrit l'intégration complète de l'API Skinplace dans le projet CashTrade.

## Architecture

### Service Skinplace (`src/lib/skinplace.ts`)

Le service principal qui gère toutes les interactions avec l'API Skinplace :

- **Authentification** : Gestion des clés API et headers
- **Cache intelligent** : Cache en mémoire avec TTL de 5 minutes
- **Retry automatique** : 3 tentatives avec backoff exponentiel
- **Gestion d'erreurs** : Transformation des erreurs en types TypeScript
- **Timeout** : 10 secondes par requête

### Types TypeScript (`src/lib/types.ts`)

Types complets pour toutes les réponses Skinplace :

- `SkinplaceInventoryItem` : Item d'inventaire
- `SkinplaceInventoryResponse` : Réponse d'inventaire
- `SkinplaceTradeResponse` : Réponse de trade
- `SkinplacePurchaseResponse` : Réponse d'achat
- `SkinplaceBalanceResponse` : Réponse de solde
- `SkinplaceHistoryResponse` : Réponse d'historique
- `SkinplaceHoldResponse` : Réponse de hold orders
- `SkinplaceListingsResponse` : Réponse des items en vente

### Hook React (`src/hooks/use-skinplace.ts`)

Hook personnalisé pour faciliter l'utilisation côté client :

```typescript
const { 
  loading, 
  error, 
  getInventory, 
  createTrade, 
  purchaseItems 
} = useSkinplace({
  onError: (err) => console.error(err),
  onSuccess: (data) => console.log(data)
});
```

## Endpoints API

Tous les endpoints sont préfixés par `/api/skinplace/` :

### Inventaire
- `GET /api/skinplace/inventory?steam_id={id}` - Inventaire d'un utilisateur
- `POST /api/skinplace/inventory/multiple` - Inventaires multiples

### Trades
- `POST /api/skinplace/trade` - Créer un trade
- `GET /api/skinplace/trade/{token}` - Statut d'un trade

### Achats
- `POST /api/skinplace/purchase` - Acheter des items
- `GET /api/skinplace/purchase/items?purchase_id={id}` - Items d'un achat
- `GET /api/skinplace/purchase/history` - Historique des achats

### Solde
- `GET /api/skinplace/balance` - Solde actuel
- `GET /api/skinplace/balance/refills` - Historique des recharges

### Hold Orders
- `GET /api/skinplace/hold?type={orders|grouped|full}` - Hold orders
- `POST /api/skinplace/hold/withdraw` - Retirer du hold

### Items en vente
- `GET /api/skinplace/items/listing` - Items disponibles

## Composants UI

### InventoryViewer (`src/components/skinplace/inventory-viewer.tsx`)

Composant pour afficher et sélectionner des items d'inventaire :

```tsx
<InventoryViewer
  steamId="76561198000000000"
  onItemSelect={(item) => console.log(item)}
  selectable={true}
/>
```

**Fonctionnalités :**
- Affichage de l'inventaire Steam
- Recherche et filtrage
- Sélection d'items
- Calcul de la valeur totale
- Cache automatique

### TradeCreator (`src/components/skinplace/trade-creator.tsx`)

Composant pour créer des trades instantanés :

```tsx
<TradeCreator
  steamId="76561198000000000"
  selectedItems={items}
  onTradeCreated={(trade) => console.log(trade)}
/>
```

**Fonctionnalités :**
- Validation de l'URL de trade Steam
- Création de trade instantané
- Suivi du statut en temps réel
- Gestion des erreurs

## Configuration

### Variables d'environnement

```env
SKINPLACE_API_KEY=your-skinplace-api-key
SKINPLACE_API_URL=https://api.skinplace.com
```

### Authentification

Tous les endpoints nécessitent une authentification Steam via Better Auth.

### Sécurité

- Validation des Steam IDs
- Limitation du nombre d'items (50 max)
- Limitation des inventaires multiples (10 max)
- Validation des URLs de trade Steam
- Rate limiting côté Skinplace

## Utilisation

### 1. Récupérer l'inventaire

```typescript
const { getInventory } = useSkinplace();

const inventory = await getInventory('76561198000000000');
if (inventory?.success) {
  console.log(inventory.data.items);
}
```

### 2. Créer un trade

```typescript
const { createTrade } = useSkinplace();

const trade = await createTrade(
  '76561198000000000',
  ['item1', 'item2'],
  'https://steamcommunity.com/tradeoffer/new/?partner=...&token=...'
);
```

### 3. Acheter des items

```typescript
const { purchaseItems } = useSkinplace();

const purchase = await purchaseItems({
  items: ['item1', 'item2'],
  payment_method: 'stripe',
  trade_token: 'optional-token'
});
```

## Gestion des erreurs

Toutes les erreurs sont typées et gérées de manière cohérente :

```typescript
if (isSkinplaceError(response)) {
  console.error('Erreur Skinplace:', response.error);
  console.error('Code:', response.code);
}
```

## Cache

Le cache est automatique pour :
- Inventaires (5 minutes)
- Historiques (5 minutes)
- Items en vente (5 minutes)

Pour vider le cache :
```typescript
skinplaceService.clearCache();
skinplaceService.clearCacheForEndpoint('/api/v3/instant/inventory');
```

## Monitoring

Tous les appels API sont loggés avec :
- Type d'événement
- Durée de la requête
- Statut de la réponse
- Erreurs éventuelles

## Tests

Pour tester l'intégration :

1. Configurer les variables d'environnement
2. Se connecter avec Steam
3. Aller sur `/sell` pour tester l'inventaire
4. Créer un trade de test

## Support

En cas de problème :
1. Vérifier les logs de l'API
2. Vérifier la configuration Skinplace
3. Tester avec l'API Skinplace directement
4. Consulter la documentation Skinplace officielle
